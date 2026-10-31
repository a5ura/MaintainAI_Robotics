import asyncio
import sqlite3
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient
from backend.app import create_app
from backend.tests.test_diagnostics import client
from backend.security import DemoWriteLimit
from backend.manage import backup,prune

def test_guided_ticket_retry_is_idempotent_and_reuse_rejected():
    body=dict(equipment_id='R-01',title='Guided demo',description='synthetic',request_id=str(uuid4()))
    first=client.post('/api/tickets',json=body);second=client.post('/api/tickets',json=body)
    assert first.status_code==second.status_code==201
    assert first.json()==second.json()
    assert len(client.get('/api/tickets').json())==2
    body['title']='different content'
    assert client.post('/api/tickets',json=body).status_code==409
    body['request_id']='invalid'
    assert client.post('/api/tickets',json=body).status_code==422

def test_public_profile_limits_writes_but_not_reads(tmp_path):
    c=TestClient(create_app(tmp_path/'public.db',public_demo=True))
    for _ in range(20):assert c.post('/api/diagnose',json={}).status_code==422
    response=c.post('/api/diagnose',json={})
    assert response.status_code==429 and response.headers['Retry-After']
    assert c.get('/api/equipment').status_code==200

def test_budget_resets_and_forwarded_ip_does_not_bypass():
    now=[0];called=[]
    async def app(scope,receive,send):called.append(True);await send({'type':'http.response.start','status':200,'headers':[]})
    middleware=DemoWriteLimit(app,per_peer=1,total=2,window=60,clock=lambda:now[0])
    async def attempt(peer,forwarded):
        messages=[]
        async def send(message):messages.append(message)
        async def receive():return {'type':'http.request','body':b''}
        await middleware(dict(type='http',method='POST',path='/api/tickets',client=(peer,1),headers=[(b'x-forwarded-for',forwarded)]),receive,send)
        return messages[0]['status']
    assert asyncio.run(attempt('same',b'one'))==200
    assert asyncio.run(attempt('same',b'two'))==429
    assert asyncio.run(attempt('other',b'three'))==200
    assert asyncio.run(attempt('third',b'four'))==429
    now[0]=61
    assert asyncio.run(attempt('same',b'five'))==200

def test_retention_dry_run_backup_and_seed_recovery(isolated_database,tmp_path):
    repo=isolated_database
    old=repo.create_ticket(dict(equipment_id='R-01',diagnosis_id=None,title='Old resolved demo',description='test'))
    ticket_id=old['ticket']['id']
    repo.update_ticket(ticket_id,dict(expected_version=1,status='Resolved',resolution_notes='fixed',note=None))
    with repo.connection(write=True) as db:db.execute("UPDATE tickets SET updated_at='2020-01-01T00:00:00+00:00' WHERE id=?",(ticket_id,))
    assert prune(repo.path)['resolved_tickets_eligible']==1
    assert repo.ticket(ticket_id)
    with pytest.raises(ValueError):prune(repo.path,apply=True)
    saved=tmp_path/'saved.db'
    assert prune(repo.path,apply=True,backup_path=saved)['applied']
    with sqlite3.connect(saved) as db:assert db.execute('SELECT id FROM tickets WHERE id=?',(ticket_id,)).fetchone()
    assert len(repo.list_tickets())==1 and repo.list_tickets()[0]['id']=='T-SEED-001'
    assert repo.ticket('T-SEED-001')['diagnosis']['failure']=='Dropped object'
    with pytest.raises(ValueError):backup(repo.path,saved)

def test_wildcard_cors_not_allowed(monkeypatch):
    monkeypatch.setenv('MAINTAINAI_ALLOWED_ORIGINS','*')
    with pytest.raises(ValueError):create_app()

def test_concurrent_guided_retries_create_one_ticket(isolated_database):
    from concurrent.futures import ThreadPoolExecutor
    from backend.repository import Repository
    body=dict(equipment_id='R-01',diagnosis_id=None,title='Guided retry',description='synthetic',request_id=uuid4())
    def create(_):return Repository(isolated_database.path).create_ticket(body)
    with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(create,range(2)))
    assert results[0]==results[1]
    assert len(isolated_database.list_tickets())==2
    assert len(results[0]['history'])==1
