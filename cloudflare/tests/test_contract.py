import asyncio
import inspect
import json
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4
import pytest
from backend.domain import RepositoryError
from backend.diagnostics import analyze
from backend.models import Cycle
from backend.tests.test_diagnostics import fixture

async def invoke(repo,method,*args):
    function=getattr(repo,method)
    return await function(*args) if inspect.iscoroutinefunction(function) else function(*args)
def call(repo,method,*args):return asyncio.run(invoke(repo,method,*args))
def data(**extra):return dict(equipment_id='R-01',title='Synthetic contract incident',description='operator observation',diagnosis_id=None,**extra)

def test_initialize_equipment_and_seed_idempotency(adapter):
    for _ in range(3):call(adapter,'initialize')
    assert len(call(adapter,'equipment'))==2
    assert len(call(adapter,'list_tickets'))==1
    detail=call(adapter,'ticket','T-SEED-001')
    assert detail['ticket']['status']=='Resolved' and len(detail['history'])==2
    assert detail['diagnosis']['failure']=='Dropped object'

def test_snapshot_ticket_notes_resolution_and_reopen(adapter):
    result=analyze(Cycle(**fixture(True)));call(adapter,'save_diagnosis',result)
    payload=data();payload['diagnosis_id']=result['id'];created=call(adapter,'create_ticket',payload);ticket_id=created['ticket']['id']
    assert created['diagnosis']==json.loads(json.dumps(result))
    progressed=call(adapter,'update_ticket',ticket_id,dict(expected_version=1,status='In Progress',note='inspect',resolution_notes=None))
    assert progressed['ticket']['version']==2
    resolved=call(adapter,'update_ticket',ticket_id,dict(expected_version=2,status='Resolved',note='tested',resolution_notes='seal replaced'))
    assert resolved['ticket']['status']=='Resolved' and len(resolved['history'])==5
    assert [h['at'] for h in resolved['history']]==sorted(h['at'] for h in resolved['history'])
    assert resolved['diagnosis']==json.loads(json.dumps(result))
    reopened=call(adapter,'update_ticket',ticket_id,dict(expected_version=3,status='Open',note='recurred',resolution_notes=None))
    assert reopened['ticket']['version']==4

def test_idempotency_and_changed_content_conflict(adapter):
    payload=data(request_id=uuid4());a=call(adapter,'create_ticket',payload);b=call(adapter,'create_ticket',payload)
    assert a==b and len(a['history'])==1
    payload['title']='different'
    with pytest.raises(RepositoryError) as exc:call(adapter,'create_ticket',payload)
    assert exc.value.status==409

@pytest.mark.parametrize('kind',['equipment','diagnosis','ticket','version','resolution'])
def test_errors(adapter,kind):
    with pytest.raises(RepositoryError) as exc:
        if kind in ('equipment','diagnosis'):
            payload=data();payload['equipment_id' if kind=='equipment' else 'diagnosis_id']='missing';call(adapter,'create_ticket',payload)
        elif kind=='ticket':call(adapter,'ticket','missing')
        else:
            ticket_id=call(adapter,'create_ticket',data())['ticket']['id']
            call(adapter,'update_ticket',ticket_id,dict(expected_version=9 if kind=='version' else 1,status='Resolved',note=None,resolution_notes=None))
    assert exc.value.status==({'equipment':404,'diagnosis':404,'ticket':404,'version':409,'resolution':422}[kind])

def test_concurrent_idempotent_creates(adapter):
    payload=data(request_id=uuid4())
    with ThreadPoolExecutor(max_workers=2) as pool:created=list(pool.map(lambda _:call(adapter,'create_ticket',payload),range(2)))
    assert created[0]['ticket']['id']==created[1]['ticket']['id']
    assert len(call(adapter,'ticket',created[0]['ticket']['id'])['history'])==1

def test_concurrent_optimistic_updates(adapter):
    ticket_id=call(adapter,'create_ticket',data())['ticket']['id']
    def update(note):
        try:return call(adapter,'update_ticket',ticket_id,dict(expected_version=1,status=None,note=note,resolution_notes=None))['ticket']['version']
        except RepositoryError as exc:return exc.status
    with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(update,['A','B']))
    assert sorted(results)==[2,409]
    assert len(call(adapter,'ticket',ticket_id)['history'])==2

def test_snapshot_is_immutable_on_repeated_insert(adapter):
    result=analyze(Cycle(**fixture(True)));call(adapter,'save_diagnosis',result)
    altered=json.loads(json.dumps(result));altered['summary']='must not replace evidence'
    if hasattr(adapter,'binding'):
        with pytest.raises(RepositoryError) as exc:call(adapter,'save_diagnosis',altered)
        assert exc.value.status==409
    else:call(adapter,'save_diagnosis',altered)
    payload=data();payload['diagnosis_id']=result['id'];assert call(adapter,'create_ticket',payload)['diagnosis']==json.loads(json.dumps(result))

def test_keyset_pages_preserve_all_records_and_filter(adapter):
    cloud=hasattr(adapter,'binding')
    sql="INSERT INTO tickets(id,equipment_id,title,description,status,created_at,updated_at"+(",creation_note" if cloud else "")+") VALUES(?,'R-01','Paged','synthetic','Open',?,?"+(",'Created'" if cloud else "")+")"
    values=[(f'T-paged-{i:04d}',f'2026-11-{1+i%3:02d}',f'2026-11-{1+i%3:02d}') for i in range(450)]
    if cloud:
        for start in range(0,len(values),100):call(adapter,'batch',[(sql,row) for row in values[start:start+100]])
    else:
        with adapter.connection(write=True) as db:db.executemany(sql,values)
    rows=[];page=call(adapter,'list_tickets')
    while page:
        rows+=page;last=page[-1];page=call(adapter,'list_tickets',None,last['created_at'],last['id'])
    assert len(rows)==451 and len({row['id'] for row in rows})==451
    assert all(rows[i]['created_at']>=rows[i+1]['created_at'] for i in range(len(rows)-1))
    for i in range(len(rows)-1):
        if rows[i]['created_at']==rows[i+1]['created_at']:assert rows[i]['id']<rows[i+1]['id']
    assert len(call(adapter,'list_tickets','R-01'))==200
    assert call(adapter,'list_tickets','CELL-01')==[]
