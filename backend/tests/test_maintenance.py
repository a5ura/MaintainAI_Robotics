import sqlite3
from concurrent.futures import ThreadPoolExecutor
import pytest
from fastapi.testclient import TestClient
from backend.app import create_app
from backend.repository import Repository, RepositoryError
from backend.tests.test_diagnostics import client, fixture, run

def create(diagnosis_id=None):
    response=client.post('/api/tickets',json=dict(equipment_id='R-01',title='Investigate grip',description='Operator observed a fault',diagnosis_id=diagnosis_id))
    assert response.status_code==201
    return response.json()

def test_equipment_seed_is_idempotent(isolated_database):
    path=isolated_database.path
    for _ in range(3): Repository(path)
    assert len(client.get('/api/equipment').json())==2
    assert len(client.get('/api/tickets').json())==1
    assert client.get('/api/tickets').json()[0]['status']=='Resolved'
    assert client.get('/api/tickets/T-SEED-001').json()['diagnosis']['failure']=='Dropped object'

def test_create_from_computed_diagnosis_and_immutable_snapshot():
    d=run(fixture(True));ticket=create(d['id']);ticket_id=ticket['ticket']['id']
    run(fixture(False))
    detail=client.get('/api/tickets/'+ticket_id).json()
    assert detail['diagnosis']==d
    assert detail['diagnosis']['timeline'][2]['id']=='E3'
    assert detail['ticket']['status']=='Open'
    assert len(detail['history'])==1

def test_status_notes_resolution_and_chronological_history():
    detail=create();id=detail['ticket']['id']
    response=client.patch('/api/tickets/'+id,json={'expected_version':1,'status':'In Progress','note':'Inspected cup and supply'})
    assert response.status_code==200
    detail=response.json();assert detail['ticket']['version']==2
    response=client.patch('/api/tickets/'+id,json={'expected_version':2,'status':'Resolved','resolution_notes':'Seal replaced; hold test passed','note':'Verification passed'})
    assert response.status_code==200
    detail=response.json();assert detail['ticket']['resolution_notes']=='Seal replaced; hold test passed'
    assert [h['seq'] for h in detail['history']]==sorted(h['seq'] for h in detail['history'])
    assert [h['at'] for h in detail['history']]==sorted(h['at'] for h in detail['history'])
    assert len(detail['history'])==5
    assert client.patch('/api/tickets/'+id,json={'expected_version':3,'status':'In Progress'}).status_code==422
    assert client.patch('/api/tickets/'+id,json={'expected_version':3,'status':'Open','note':'Issue recurred'}).status_code==200

def test_reopening_database_and_new_app_preserves_records(isolated_database):
    detail=create(run(fixture(True))['id']);id=detail['ticket']['id'];path=isolated_database.path
    other=TestClient(create_app(path))
    assert other.get('/api/tickets/'+id).json()==detail
    assert Repository(path).ticket(id)==detail

@pytest.mark.parametrize('payload,status',[
    ({'equipment_id':'missing','title':'x'},404),
    ({'equipment_id':'R-01','title':'x','diagnosis_id':'missing'},404),
    ({'equipment_id':'R-01','title':'   '},422),
    ({'equipment_id':'R-01','title':'x'*121},422),
    ({'equipment_id':'R-01','title':'x','description':'a'*4001},422),
])
def test_invalid_creation(payload,status):
    assert client.post('/api/tickets',json=payload).status_code==status

def test_invalid_updates_and_missing_records():
    id=create()['ticket']['id']
    for payload in [dict(expected_version=1,status='Unknown'),dict(expected_version=1,status='Resolved'),dict(expected_version=1,note=' '),dict(expected_version=1,note='x'*2001),dict(expected_version=1)]:
        assert client.patch('/api/tickets/'+id,json=payload).status_code==422
    assert client.get('/api/tickets/missing').status_code==404
    assert client.patch('/api/tickets/missing',json={'expected_version':1,'note':'x'}).status_code==404

def test_optimistic_concurrent_updates_no_lost_notes(isolated_database):
    id=create()['ticket']['id'];path=isolated_database.path
    def update(note):
        try: return Repository(path).update_ticket(id,dict(expected_version=1,status=None,note=note,resolution_notes=None))['ticket']['version']
        except RepositoryError as e: return e.status
    with ThreadPoolExecutor(max_workers=2) as pool: outcomes=list(pool.map(update,['note A','note B']))
    assert sorted(outcomes)==[2,409]
    detail=Repository(path).ticket(id)
    assert detail['ticket']['version']==2 and len(detail['history'])==2
    assert detail['history'][-1]['body'] in ('note A','note B')

def test_parameterized_queries_and_rollback(isolated_database):
    title="' ; DROP TABLE tickets; --"
    response=client.post('/api/tickets',json={'equipment_id':'R-01','title':title});assert response.status_code==201
    assert response.json()['ticket']['title']==title
    assert len(client.get('/api/tickets').json())==2
    assert client.get('/api/tickets',params={'equipment_id':"' OR 1=1 --"}).json()==[]
    with pytest.raises(sqlite3.IntegrityError):
        with isolated_database.connection(write=True) as db:
            db.execute("INSERT INTO equipment VALUES('rollback','x','x','x')")
            db.execute("INSERT INTO equipment VALUES('R-01','x','x','x')")
    assert not any(e['id']=='rollback' for e in isolated_database.equipment())

def test_newer_schema_not_silently_downgraded(tmp_path):
    path=tmp_path/'future.db'
    with sqlite3.connect(path) as db: db.execute('PRAGMA user_version=2')
    with pytest.raises(RepositoryError): Repository(path)

def test_export_history_bounds_are_complete_and_read_only(isolated_database):
    repo=isolated_database
    ticket=repo.create_ticket(dict(equipment_id='R-01',title='Export pagination',description='Synthetic',diagnosis_id=None))['ticket']['id']
    with repo.connection(write=True) as db:
        db.executemany("INSERT INTO ticket_history(ticket_id,at,kind,body) VALUES(?,'2026-11-01','note',?)",[(ticket,str(i)) for i in range(250)])
    with repo.connection() as db:before=list(db.iterdump())
    detail=repo.ticket(ticket)
    page=repo.history_page(ticket,detail['history_next_seq'])
    assert detail['history_total']==251 and len(detail['history'])==200 and len(page['history'])==51
    assert detail['history_last_seq']==page['history'][-1]['seq']
    with repo.connection() as db:assert list(db.iterdump())==before
