import asyncio
import json
from uuid import uuid4
import pytest
from backend.domain import RepositoryError
from backend.d1_repository import D1Repository
from cloudflare.test_support import BridgeBinding
from cloudflare.tests.test_contract import call,data

@pytest.fixture
def repo():
    repo=D1Repository(BridgeBinding());call(repo,'initialize');return repo

def test_batch_foreign_key_failure_rolls_back(repo):
    marker='rollback-'+uuid4().hex
    with pytest.raises(RepositoryError):call(repo,'batch',[
        ('INSERT INTO equipment VALUES(?,?,?,?)',(marker,'x','x','x')),
        ("INSERT INTO ticket_history(ticket_id,version,at,kind,body) VALUES('missing',1,'x','note','bad')",()),
    ])
    assert not call(repo,'query','SELECT id FROM equipment WHERE id=?',(marker,))

def test_trigger_failure_rolls_back_ticket_and_version(repo):
    detail=call(repo,'create_ticket',data());ticket_id=detail['ticket']['id']
    # Break an associated history write in the disposable DB. The UPDATE must
    # not commit without history, even though Python already validated it.
    call(repo,'query',"CREATE TRIGGER reject_contract_note BEFORE INSERT ON ticket_history WHEN NEW.body='reject-this' BEGIN SELECT RAISE(ABORT,'contract fault'); END")
    try:
        with pytest.raises(RepositoryError):call(repo,'update_ticket',ticket_id,dict(expected_version=1,status='In Progress',note='reject-this',resolution_notes=None))
        assert call(repo,'ticket',ticket_id)==detail
    finally:call(repo,'query','DROP TRIGGER reject_contract_note')

def test_direct_snapshot_updates_are_rejected(repo):
    detail=call(repo,'ticket','T-SEED-001')
    with pytest.raises(RepositoryError):call(repo,'query','UPDATE diagnoses SET snapshot=? WHERE id=?',('{}',detail['diagnosis']['id']))
    assert call(repo,'ticket','T-SEED-001')['diagnosis']==detail['diagnosis']

def test_schema_version_failure_and_migration_batch_rollback(repo):
    with pytest.raises(RepositoryError):call(repo,'batch',[('CREATE TABLE rollback_migration(id TEXT)',()),('INSERT INTO missing_table VALUES(1)',())])
    assert not call(repo,'query',"SELECT name FROM sqlite_master WHERE name='rollback_migration'")
    call(repo,'query','INSERT INTO phase_a_schema VALUES(3)')
    try:
        with pytest.raises(RepositoryError):call(repo,'initialize')
    finally:call(repo,'query','DELETE FROM phase_a_schema WHERE version=3')

def test_distributed_daily_budget_and_byte_cap(repo):
    bucket='contract-'+uuid4().hex
    async def reserve():return await asyncio.gather(*(repo.reserve(bucket,2,day='2099-01-01') for _ in range(6)),return_exceptions=True)
    results=asyncio.run(reserve());assert sum(isinstance(r,int) for r in results)==2
    assert all(isinstance(r,int) or isinstance(r,RepositoryError) and r.status==429 for r in results)
    tiny=D1Repository(repo.binding,daily_snapshot_bytes=1)
    with pytest.raises(RepositoryError) as exc:call(tiny,'save_diagnosis',{'id':'huge-'+uuid4().hex,'data':'too big'})
    assert exc.value.status==429

def test_seed_protected_from_public_update(repo):
    with pytest.raises(RepositoryError) as exc:call(repo,'update_ticket','T-SEED-001',dict(expected_version=1,status='Open',note='vandalism',resolution_notes=None))
    assert exc.value.status==403

def test_reinitialize_recovers_missing_synthetic_seed_without_overwriting_tickets(repo):
    own=call(repo,'create_ticket',data())
    call(repo,'batch',[("DELETE FROM ticket_history WHERE ticket_id='T-SEED-001'",()),("DELETE FROM tickets WHERE id='T-SEED-001'",())])
    call(repo,'initialize');assert call(repo,'ticket',own['ticket']['id'])==own
    assert call(repo,'ticket','T-SEED-001')['diagnosis']['failure']=='Dropped object'

def test_history_failure_rolls_back_ticket_creation(repo):
    payload=data(request_id=uuid4())
    call(repo,'query',"CREATE TRIGGER reject_created BEFORE INSERT ON ticket_history WHEN NEW.kind='created' AND NEW.body='Open — Synthetic contract incident' BEGIN SELECT RAISE(ABORT,'contract create fault'); END")
    from backend.domain import ticket_identity
    try:
        with pytest.raises(RepositoryError):call(repo,'create_ticket',payload)
        assert not call(repo,'query','SELECT id FROM tickets WHERE id=?',(ticket_identity(payload),))
    finally:call(repo,'query','DROP TRIGGER reject_created')

def test_schema_loader_and_seed_can_be_repeated(repo):
    from cloudflare.local_schema import apply_schema
    before=call(repo,'ticket','T-SEED-001')
    for _ in range(2):asyncio.run(apply_schema(repo.binding));call(repo,'initialize')
    assert call(repo,'ticket','T-SEED-001')==before

def test_oversize_complete_snapshot_round_trip(repo):
    result={'id':'oversize-'+uuid4().hex,'evidence':'x'*2_000_000}
    call(repo,'save_diagnosis',result)
    assert call(repo,'load_diagnosis',result['id'])==result
