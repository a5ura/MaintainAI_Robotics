import asyncio
import json
from uuid import uuid4
import pytest
from backend.domain import RepositoryError
from backend.models import Cycle
from backend.diagnostics import analyze
from cloudflare.measure import payloads
from cloudflare.tests.test_contract import data

def test_seed_idempotent_and_complete_snapshot(run_pg):
    async def check(repo):
        for _ in range(3):await repo.migrate()
        assert len(await repo.equipment())==2
        detail=await repo.ticket('T-SEED-001')
        assert len(detail['history'])==2 and detail['ticket']['status']=='Resolved'
        value={'id':'D-unicode','evidence':'λ'*600000};await repo.save_diagnosis(value)
        assert await repo.load_diagnosis(value['id'])==value
        before=await repo.query('SELECT * FROM request_budgets')
        await repo.save_diagnosis(value)
        assert await repo.query('SELECT * FROM request_budgets')==before
        with pytest.raises(RepositoryError) as exc:await repo.save_diagnosis({**value,'evidence':'changed'})
        assert exc.value.status==409
    run_pg(check)

@pytest.mark.parametrize('name',list(payloads()))
def test_scenarios_and_maximum_evidence(run_pg,name):
    async def check(repo):
        value=analyze(Cycle(**payloads()[name]));await repo.save_diagnosis(value)
        assert await repo.load_diagnosis(value['id'])==json.loads(json.dumps(value))
        p=data();p['diagnosis_id']=value['id'];detail=await repo.create_ticket(p)
        assert detail['diagnosis']==json.loads(json.dumps(value))
    run_pg(check)

def test_concurrent_guided_ids_and_optimistic_updates(run_pg):
    async def check(repo):
        p=data(request_id=uuid4());created=await asyncio.gather(*(repo.create_ticket(p) for _ in range(4)))
        assert len({d['ticket']['id'] for d in created})==1
        ticket_id=created[0]['ticket']['id'];assert len((await repo.ticket(ticket_id))['history'])==1
        with pytest.raises(RepositoryError) as exc:await repo.create_ticket({**p,'title':'different'})
        assert exc.value.status==409
        results=await asyncio.gather(*(repo.update_ticket(ticket_id,dict(expected_version=1,status='In Progress',note=n,resolution_notes=None)) for n in ('A','B')),return_exceptions=True)
        assert sum(isinstance(r,dict) for r in results)==1
        assert sum(isinstance(r,RepositoryError) and r.status==409 for r in results)==1
        detail=await repo.ticket(ticket_id);assert detail['ticket']['version']==2 and len(detail['history'])==3
    run_pg(check)

def test_concurrent_snapshots_and_quota(run_pg):
    async def check(repo):
        value={'id':'D-same','evidence':'x'*100};await asyncio.gather(*(repo.save_diagnosis(value) for _ in range(4)))
        manifest=(await repo.query('SELECT * FROM snapshot_manifests'))[0]
        assert (await repo.query("SELECT used FROM request_budgets WHERE bucket LIKE '%:snapshot-bytes'"))[0]['used']==manifest['storage_bytes']
        from backend.postgres_repository import PostgresRepository
        limited=PostgresRepository(repo.pool,daily_snapshot_bytes=60000)
        # Existing charge consumes most of this independent day's available budget.
        results=await asyncio.gather(*(limited.save_diagnosis({'id':f'D-{i}','value':'x'*100}) for i in range(4)),return_exceptions=True)
        assert all(isinstance(r,RepositoryError) and r.status==429 for r in results)
        budgets=await asyncio.gather(*(repo.reserve('test',2) for _ in range(5)),return_exceptions=True)
        assert sum(isinstance(r,int) for r in budgets)==2
    run_pg(check)

def test_atomic_rollback_and_immutable_storage(run_pg):
    async def check(repo):
        value={'id':'D-check','evidence':'x'*300000};await repo.save_diagnosis(value)
        with pytest.raises(RepositoryError):await repo.query("UPDATE snapshot_chunks SET content='bad'")
        with pytest.raises(RepositoryError):await repo.query('DELETE FROM snapshot_chunks')
        with pytest.raises(RepositoryError):await repo.batch([('INSERT INTO equipment VALUES(?,?,?,?)',('rollback','x','x','x')),("INSERT INTO ticket_history(ticket_id,version,at,kind,body) VALUES('missing',1,'x','note','bad')",())])
        assert not await repo.query("SELECT id FROM equipment WHERE id='rollback'")
        assert await repo.load_diagnosis(value['id'])==value
        with pytest.raises(RepositoryError) as exc:await repo.update_ticket('T-SEED-001',dict(expected_version=1,note='bad'))
        assert exc.value.status==403
    run_pg(check)

def test_fail_closed_backup_restore_and_corrupt_evidence(run_pg):
    async def check(repo):
        from copy import deepcopy
        from postgres.recovery import export_fixture,restore_fixture
        value={'id':'D-backup','evidence':'λ'*100000};await repo.save_diagnosis(value)
        p=data(request_id=uuid4());p['diagnosis_id']=value['id'];detail=await repo.create_ticket(p)
        detail=await repo.update_ticket(detail['ticket']['id'],dict(expected_version=1,status='Resolved',note='Verified repair note',resolution_notes='Hold test passed'))
        before=await export_fixture(repo)
        for fault in ('table','manifest','chunks','reference','checksum','version'):
            bad=deepcopy(before)
            if fault=='table':del bad['tables']['diagnoses']
            elif fault=='manifest':bad['tables']['snapshot_manifests']=[]
            elif fault=='chunks':bad['tables']['snapshot_chunks']=[]
            elif fault=='reference':bad['tables']['tickets'][0]['equipment_id']='missing'
            elif fault=='checksum':bad['tables']['snapshot_manifests'][0]['sha256']='0'*64
            else:bad['schema_version']=3
            with pytest.raises(RepositoryError):await restore_fixture(repo,bad,confirm_disposable=True)
            assert await export_fixture(repo)==before
        for _ in range(2):
            await restore_fixture(repo,before,confirm_disposable=True)
            assert await export_fixture(repo)==before
        async with repo.pool.acquire() as c:
            await c.execute('ALTER TABLE snapshot_chunks DISABLE TRIGGER immutable_chunk')
            await c.execute("UPDATE snapshot_chunks SET content='bad'")
            await c.execute('ALTER TABLE snapshot_chunks ENABLE TRIGGER immutable_chunk')
        with pytest.raises(RepositoryError) as exc:await repo.load_diagnosis(value['id'])
        assert exc.value.status==503
        await restore_fixture(repo,before,confirm_disposable=True)
        assert await repo.ticket(detail['ticket']['id'])==detail
        assert await repo.create_ticket(p)==detail
    run_pg(check)

def test_snapshot_and_history_failure_are_atomic(run_pg):
    async def check(repo):
        before=await repo.query('SELECT * FROM request_budgets')
        await repo.query('ALTER TABLE snapshot_chunks ADD CONSTRAINT reject_second_chunk CHECK(chunk_index!=1)')
        try:
            with pytest.raises(RepositoryError):await repo.save_diagnosis({'id':'D-rollback','evidence':'x'*400000})
            assert not await repo.query("SELECT id FROM diagnoses WHERE id='D-rollback'")
            assert await repo.query('SELECT * FROM request_budgets')==before
        finally:await repo.query('ALTER TABLE snapshot_chunks DROP CONSTRAINT reject_second_chunk')
        detail=await repo.create_ticket(data());ticket_id=detail['ticket']['id']
        await repo.query("ALTER TABLE ticket_history ADD CONSTRAINT reject_note CHECK(body!='reject-note')")
        try:
            with pytest.raises(RepositoryError):await repo.update_ticket(ticket_id,dict(expected_version=1,status='In Progress',note='reject-note',resolution_notes=None))
            assert await repo.ticket(ticket_id)==detail
        finally:await repo.query('ALTER TABLE ticket_history DROP CONSTRAINT reject_note')
    run_pg(check)

def test_conflicting_snapshot_race(run_pg):
    async def check(repo):
        a={'id':'D-race','evidence':'a'*300000};b={'id':'D-race','evidence':'b'*300000}
        results=await asyncio.gather(repo.save_diagnosis(a),repo.save_diagnosis(b),return_exceptions=True)
        assert sum(r is None for r in results)==1
        assert sum(isinstance(r,RepositoryError) and r.status==409 for r in results)==1
        assert await repo.load_diagnosis('D-race') in (a,b)
    run_pg(check)

def test_restore_sql_failure_preserves_complete_destination(run_pg):
    async def check(repo):
        from postgres.recovery import export_fixture,restore_fixture
        await repo.create_ticket(data());before=await export_fixture(repo)
        await repo.query("ALTER TABLE tickets ADD CONSTRAINT reject_restore CHECK(title!='Synthetic contract incident') NOT VALID")
        try:
            with pytest.raises(RepositoryError):await restore_fixture(repo,before,confirm_disposable=True)
            assert await export_fixture(repo)==before
            assert (await repo.query("SELECT tgenabled FROM pg_trigger WHERE tgname='manifest_budget'"))[0]['tgenabled']=='O'
        finally:await repo.query('ALTER TABLE tickets DROP CONSTRAINT reject_restore')
    run_pg(check)

def test_export_history_bounds_and_reads_preserve_all_tables(run_pg):
    from postgres.native_backup_probe import fingerprints
    async def check(repo):
        ticket=(await repo.create_ticket(data()))['ticket']['id']
        await repo.batch([("INSERT INTO ticket_history(ticket_id,version,at,kind,body) VALUES(?,?,'2026-11-01','note',?)",(ticket,-i-1,str(i))) for i in range(250)])
        before=await fingerprints(repo.pool)
        detail=await repo.ticket(ticket)
        page=await repo.history_page(ticket,detail['history_next_seq'])
        assert detail['history_total']==251 and len(detail['history'])==200 and len(page['history'])==51
        assert detail['history_last_seq']==page['history'][-1]['seq']
        assert await fingerprints(repo.pool)==before
    run_pg(check)
