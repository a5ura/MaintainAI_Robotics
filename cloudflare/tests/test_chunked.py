import asyncio
import json
from uuid import uuid4
import pytest
from backend.d1_repository import D1Repository
from backend.domain import RepositoryError
from cloudflare.test_support import BridgeBinding
from cloudflare.tests.test_contract import call,data
from cloudflare.local_recovery import export_fixture,restore_fixture

@pytest.fixture
def repo():
    repo=D1Repository(BridgeBinding(),daily_snapshot_bytes=64*1024*1024)
    call(repo,'batch',[(f'DELETE FROM {table}',()) for table in ('ticket_history','tickets','diagnoses','equipment','request_budgets')]);call(repo,'initialize')
    return repo

def payload(size=600000):return {'id':'D-'+uuid4().hex,'evidence':'λ'*size}

def test_unicode_multichunk_ticket_backup_restore_and_retry(repo):
    value=payload();call(repo,'save_diagnosis',value)
    assert call(repo,'load_diagnosis',value['id'])==value
    m=call(repo,'query','SELECT * FROM snapshot_manifests')[0]
    assert m['chunk_count']>2 and m['byte_length']==len(json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode())
    before=call(repo,'query','SELECT * FROM request_budgets')
    call(repo,'save_diagnosis',value);assert call(repo,'query','SELECT * FROM request_budgets')==before
    p=data();p['diagnosis_id']=value['id'];detail=call(repo,'create_ticket',p)
    assert detail['diagnosis']==value
    backup=asyncio.run(export_fixture(repo.binding));asyncio.run(restore_fixture(repo.binding,backup,confirm_disposable=True))
    assert call(repo,'ticket',detail['ticket']['id'])==detail

@pytest.mark.parametrize('fault',['count','missing','content','checksum','length'])
def test_corruption_is_explicit(repo,fault):
    value=payload(100);call(repo,'save_diagnosis',value)
    trigger='no_partial_chunk' if fault=='missing' else 'immutable_chunk' if fault=='content' else 'immutable_manifest'
    sql=call(repo,'query','SELECT sql FROM sqlite_master WHERE name=?',(trigger,))[0]['sql']
    call(repo,'query','DROP TRIGGER '+trigger)
    try:
        if fault=='missing':call(repo,'query','DELETE FROM snapshot_chunks WHERE diagnosis_id=?',(value['id'],))
        elif fault=='content':call(repo,'query',"UPDATE snapshot_chunks SET content='bad' WHERE diagnosis_id=?",(value['id'],))
        else:
            column={'count':'chunk_count','checksum':'sha256','length':'byte_length'}[fault]
            call(repo,'query',f'UPDATE snapshot_manifests SET {column}=? WHERE diagnosis_id=?',('0'*64 if fault=='checksum' else 999,value['id']))
        with pytest.raises(RepositoryError) as exc:call(repo,'load_diagnosis',value['id'])
        assert exc.value.status==503
    finally:call(repo,'query',sql)

def test_immutable_updates_and_partial_deletes(repo):
    value=payload(100);call(repo,'save_diagnosis',value)
    for sql in ("UPDATE snapshot_chunks SET content='bad'",'DELETE FROM snapshot_chunks','DELETE FROM snapshot_manifests'):
        with pytest.raises(RepositoryError):call(repo,'query',sql)

def test_partial_chunk_failure_rolls_back_bytes_and_manifest(repo):
    before=call(repo,'query','SELECT * FROM request_budgets');value=payload()
    call(repo,'query',"CREATE TRIGGER reject_chunk BEFORE INSERT ON snapshot_chunks WHEN NEW.chunk_index=1 BEGIN SELECT RAISE(ABORT,'injected failure'); END")
    try:
        with pytest.raises(RepositoryError):call(repo,'save_diagnosis',value)
        assert not call(repo,'query','SELECT id FROM diagnoses WHERE id=?',(value['id'],))
        assert call(repo,'query','SELECT * FROM request_budgets')==before
    finally:call(repo,'query','DROP TRIGGER reject_chunk')

def test_concurrent_identical_and_conflicting_writers(repo):
    value=payload()
    async def run():return await asyncio.gather(*(repo.save_diagnosis(value) for _ in range(3)))
    asyncio.run(run());m=call(repo,'query','SELECT storage_bytes FROM snapshot_manifests')[0]
    assert call(repo,'query',"SELECT used FROM request_budgets WHERE bucket LIKE '%:snapshot-bytes'")[0]['used']==m['storage_bytes']
    changed={**value,'evidence':'changed'}
    with pytest.raises(RepositoryError) as exc:call(repo,'save_diagnosis',changed)
    assert exc.value.status==409 and call(repo,'load_diagnosis',value['id'])==value

def test_atomic_quota_concurrent_unique_and_retry(repo):
    tiny=D1Repository(repo.binding,daily_snapshot_bytes=60000)
    values=[payload(200) for _ in range(4)]
    async def run():return await asyncio.gather(*(tiny.save_diagnosis(v) for v in values),return_exceptions=True)
    results=asyncio.run(run());assert sum(r is None for r in results)==1
    assert all(r is None or isinstance(r,RepositoryError) and r.status==429 for r in results)
    assert len(call(repo,'query','SELECT * FROM snapshot_manifests'))==1

@pytest.mark.parametrize('case',['max-evidence','max-body','max-samples'])
def test_dense_maximum_accepted_diagnosis_roundtrip(repo,case):
    from cloudflare.measure import payloads
    from backend.models import Cycle
    from backend.diagnostics import analyze
    value=analyze(Cycle(**payloads()[case]))
    if case=='max-evidence':assert len(json.dumps(value).encode())>2_000_000
    call(repo,'save_diagnosis',value);assert call(repo,'load_diagnosis',value['id'])==json.loads(json.dumps(value))

def test_bounded_ticket_history_and_lists(repo):
    p=data();ticket=call(repo,'create_ticket',p)['ticket']['id']
    call(repo,'batch',[("INSERT INTO ticket_history(ticket_id,version,at,kind,body) VALUES(?,?,?,'note',?)",(ticket,-i-1,'2026-11-01',str(i))) for i in range(99)])
    for start,end in ((99,199),(199,250)):
        call(repo,'batch',[("INSERT INTO ticket_history(ticket_id,version,at,kind,body) VALUES(?,?,?,'note',?)",(ticket,-i-1,'2026-11-01',str(i))) for i in range(start,end)])
    detail=call(repo,'ticket',ticket);assert len(detail['history'])==200
    page=call(repo,'history_page',ticket,detail['history_next_seq']);assert len(page['history'])==51 and page['next_seq'] is None
    all_rows=detail['history']+page['history'];assert [r['seq'] for r in all_rows]==sorted(r['seq'] for r in all_rows)


def test_concurrent_conflicting_insert_rejects_one(repo):
    first=payload();second={**first,'evidence':'different'}
    async def run():return await asyncio.gather(repo.save_diagnosis(first),repo.save_diagnosis(second),return_exceptions=True)
    results=asyncio.run(run())
    assert sum(r is None for r in results)==1
    assert sum(isinstance(r,RepositoryError) and r.status==409 for r in results)==1
    assert call(repo,'load_diagnosis',first['id']) in (first,second)

def test_damaged_backup_is_rejected_before_deleting_records(repo):
    from copy import deepcopy
    value=payload(100);call(repo,'save_diagnosis',value)
    backup=asyncio.run(export_fixture(repo.binding));broken=deepcopy(backup)
    broken['tables']['snapshot_chunks'][0]['content']='damaged'
    with pytest.raises(RepositoryError):asyncio.run(restore_fixture(repo.binding,broken,confirm_disposable=True))
    assert call(repo,'load_diagnosis',value['id'])==value
    assert asyncio.run(export_fixture(repo.binding))==backup


def test_cannot_append_or_replace_chunks_with_insert(repo):
    value=payload(100);call(repo,'save_diagnosis',value)
    with pytest.raises(RepositoryError):call(repo,'query','INSERT INTO snapshot_chunks VALUES(?,?,?)',(value['id'],1,'extra'))
    with pytest.raises(RepositoryError):call(repo,'query','INSERT INTO snapshot_chunks VALUES(?,?,?) ON CONFLICT DO NOTHING',(value['id'],0,'changed'))
    assert call(repo,'load_diagnosis',value['id'])==value


@pytest.mark.parametrize('same',[True,False])
def test_racing_legacy_insert_never_replaces_evidence(repo,same):
    value=payload(100);original=repo.batch
    legacy=value if same else {**value,'evidence':'original legacy data'}
    async def insert_legacy_then_save(statements):
        await repo.query('INSERT INTO diagnoses VALUES(?,?,?)',(value['id'],json.dumps(legacy),'2026-11-01'))
        return await original(statements)
    repo.batch=insert_legacy_then_save
    if same:call(repo,'save_diagnosis',value)
    else:
        with pytest.raises(RepositoryError) as exc:call(repo,'save_diagnosis',value)
        assert exc.value.status==409
    assert call(repo,'load_diagnosis',value['id'])==legacy
    assert not call(repo,'query','SELECT * FROM snapshot_manifests')
