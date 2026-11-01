"""Shared ASGI + genuine local D1, executed in CPython, not Python Workers."""
import asyncio
import json
from pathlib import Path
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient
from cloudflare.local_api import BoundLocalApp
from cloudflare.test_support import BridgeBinding
from backend.d1_repository import D1Repository
from cloudflare.tests.test_contract import call

@pytest.fixture
def client():
    repo=D1Repository(BridgeBinding())
    call(repo,'query','DELETE FROM request_budgets')
    call(repo,'initialize')
    with TestClient(BoundLocalApp()) as client:yield client

def test_api_diagnoses_all_scenarios_and_guided_persistence(client):
    scenarios=json.loads(Path('fixtures/scenarios.json').read_text())
    for name,case in scenarios.items():
        payload=case
        response=client.post('/api/diagnose',json=payload)
        assert response.status_code==200,response.text
        result=response.json()
        assert result['failure']=={'normal':None,'drop':'Dropped object','position':'Positioning error','vision':'Vision failure','stop':'Unexpected robot stop'}[name]
    ticket=dict(equipment_id='R-01',diagnosis_id=result['id'],title='Guided synthetic',description='Evidence snapshot',request_id=str(uuid4()))
    first=client.post('/api/tickets',json=ticket)
    assert first.status_code==201,first.text
    assert client.post('/api/tickets',json=ticket).json()==first.json()
    ticket_id=first.json()['ticket']['id']
    updated=client.patch('/api/tickets/'+ticket_id,json=dict(expected_version=1,note='Unsaved notes now explicitly submitted'))
    assert updated.status_code==200
    # New ASGI instance + same emulated DB sees the complete shared result.
    with TestClient(BoundLocalApp()) as another:
        assert another.get('/api/tickets/'+ticket_id).json()==updated.json()
    assert updated.json()['diagnosis']==result
    assert client.patch('/api/tickets/'+ticket_id,json=dict(expected_version=1,note='stale')).status_code==409
    assert client.get('/api/equipment').status_code==200
    assert client.get('/api/tickets').status_code==200
    assert client.get('/api/tickets/missing').status_code==404

def test_validation_body_limit_and_seed_protection(client):
    assert client.get('/api/health').json()=={'status':'ok'}
    assert client.post('/api/diagnose',json={}).status_code==422
    assert client.post('/api/diagnose',content=b'x'*(2*1024*1024+1)).status_code==413
    assert client.post('/api/tickets',json=dict(equipment_id='R-01',title='x'*161)).status_code==422
    assert client.patch('/api/tickets/T-SEED-001',json=dict(expected_version=1,note='vandalism')).status_code==403

def test_emergency_read_only_precedes_database_access():
    # A binding with no methods proves the kill switch doesn't spend a D1 query.
    with TestClient(BoundLocalApp(binding=object(),DEMO_READONLY='1')) as client:
        response=client.post('/api/tickets',json={})
        assert response.status_code==503 and 'read-only' in response.text

def test_missing_binding_never_falls_back_to_sqlite():
    app=BoundLocalApp();app.env.DB=None
    with TestClient(app) as client:
        assert client.get('/api/health').status_code==200
        response=client.get('/api/equipment')
        assert response.status_code==503 and 'no local fallback' in response.text

def test_global_budget_shared_between_instances(client):
    for index in range(3):
        with TestClient(BoundLocalApp(DEMO_DAILY_REQUESTS='2')) as instance:
            response=instance.get('/api/equipment')
            assert response.status_code==(200 if index<2 else 429)
    assert response.headers['retry-after']=='3600'

def test_write_budget_and_read_only_still_allow_reads(client):
    for index in range(2):
        with TestClient(BoundLocalApp(DEMO_DAILY_WRITES='1')) as instance:
            response=instance.post('/api/diagnose',json={})
            assert response.status_code==(422 if index==0 else 429)
    with TestClient(BoundLocalApp(DEMO_READONLY='1')) as readonly:
        assert readonly.get('/api/equipment').status_code==200
        assert readonly.post('/api/diagnose',json={}).status_code==503

def test_multi_anomaly_evidence_is_computed_and_preserved(client):
    from copy import deepcopy
    cases=json.loads(Path('fixtures/scenarios.json').read_text())
    payload=deepcopy(cases['position']);payload['samples'][-1]['vision']=cases['vision']['samples'][-1]['vision'];payload['samples'][-1]['events']+=cases['vision']['samples'][-1]['events']
    response=client.post('/api/diagnose',json=payload)
    assert response.status_code==200
    assert {item['kind'] for item in response.json()['anomalies']}=={'Positioning error','Vision failure'}
