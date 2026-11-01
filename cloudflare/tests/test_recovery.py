import asyncio
import json
from copy import deepcopy
from uuid import uuid4
import pytest
from backend.domain import RepositoryError
from backend.d1_repository import D1Repository
from cloudflare.test_support import BridgeBinding
from cloudflare.local_recovery import export_fixture,restore_fixture
from cloudflare.tests.test_contract import call,data

@pytest.fixture
def repository():
    repo=D1Repository(BridgeBinding())
    call(repo,'batch',[(f'DELETE FROM {table}',()) for table in ('ticket_history','tickets','diagnoses','equipment','request_budgets')])
    call(repo,'initialize')
    return repo

def test_synthetic_backup_restore_preserves_full_evidence_history_and_versions(repository,tmp_path):
    repo=repository
    payload=data(request_id=uuid4());payload['diagnosis_id']=call(repo,'ticket','T-SEED-001')['diagnosis']['id']
    original=call(repo,'create_ticket',payload);ticket_id=original['ticket']['id']
    expected=call(repo,'update_ticket',ticket_id,dict(expected_version=1,status='Resolved',note='synthetic verified repair',resolution_notes='hold test passed'))
    backup=asyncio.run(export_fixture(repo.binding))
    path=tmp_path/'synthetic-backup.json';path.write_text(json.dumps(backup,allow_nan=False))
    call(repo,'update_ticket',ticket_id,dict(expected_version=2,status='Open',note='synthetic vandalism',resolution_notes=None))
    asyncio.run(restore_fixture(repo.binding,json.loads(path.read_text()),confirm_disposable=True))
    assert call(repo,'ticket',ticket_id)==expected
    assert asyncio.run(export_fixture(repo.binding))==backup
    # Idempotency identity/content is preserved through restore too.
    assert call(repo,'create_ticket',payload)==expected

def test_bad_restore_rolls_back_all_deletes(repository):
    backup=asyncio.run(export_fixture(repository.binding));broken=deepcopy(backup)
    broken['tables']['tickets'][0]['equipment_id']='missing-reference'
    with pytest.raises(RepositoryError):asyncio.run(restore_fixture(repository.binding,broken,confirm_disposable=True))
    assert asyncio.run(export_fixture(repository.binding))==backup

def test_restore_refuses_without_disposable_confirmation(repository):
    with pytest.raises(ValueError):asyncio.run(restore_fixture(repository.binding,asyncio.run(export_fixture(repository.binding))))

def test_disposable_sqlite_export_to_local_d1_keeps_public_contract(repository,tmp_path):
    from backend.repository import Repository
    source=Repository(tmp_path/'synthetic-only.sqlite3')
    diagnosis=source.ticket('T-SEED-001')['diagnosis']
    payload=data(request_id=uuid4());payload['diagnosis_id']=diagnosis['id']
    created=source.create_ticket(payload);ticket_id=created['ticket']['id']
    expected=source.update_ticket(ticket_id,dict(expected_version=1,status='Resolved',note='fixture only',resolution_notes='verified'))
    with source.connection() as db:
        tables={table:[dict(row) for row in db.execute(f'SELECT * FROM {table}')] for table in ('equipment','diagnoses','tickets','ticket_history')}
    # Preserve original public columns. Adapter trigger-only fields are derived;
    # legacy history uses negative private version tags to avoid collisions with
    # all future positive ticket versions. Public seq/time/kind/body are exact.
    for row in tables['tickets']:
        row.update(creation_note='Imported synthetic history',last_note=None,last_status_note=None)
    for row in tables['ticket_history']:row['version']=-row['seq']
    backup=dict(schema_version=1,synthetic_only=True,tables={**tables,'request_budgets':[]})
    asyncio.run(restore_fixture(repository.binding,backup,confirm_disposable=True))
    assert call(repository,'ticket',ticket_id)==expected
    assert call(repository,'create_ticket',payload)==expected
    assert call(repository,'ticket','T-SEED-001')==source.ticket('T-SEED-001')
    next_detail=call(repository,'update_ticket',ticket_id,dict(expected_version=2,status='Open',note='post import',resolution_notes=None))
    assert next_detail['ticket']['version']==3 and next_detail['diagnosis']==expected['diagnosis']
