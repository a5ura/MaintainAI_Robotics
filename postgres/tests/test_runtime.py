import asyncio
import pytest
from fastapi.testclient import TestClient
from backend.postgres_app import create_app
from postgres.local import test_url as local_test_url

def test_explicit_configuration_and_no_fallback(monkeypatch):
    monkeypatch.delenv('DATABASE_URL',raising=False)
    with pytest.raises(RuntimeError,match='no SQLite fallback'):create_app()
    monkeypatch.setenv('DATABASE_URL',local_test_url());monkeypatch.setenv('PG_POOL_MAX','99')
    with pytest.raises(RuntimeError,match='PG_POOL_MAX'):create_app()

def test_native_api_policies_and_two_clients(run_pg,monkeypatch):
    async def prepared(repo):pass
    run_pg(prepared)
    monkeypatch.setenv('DATABASE_URL',local_test_url())
    with TestClient(create_app()) as first,TestClient(create_app()) as second:
        assert first.get('/api/health').json()=={'status':'ok'}
        assert first.get('/api/ready').status_code==200
        assert first.post('/api/diagnose',json={}).status_code==422
        assert first.post('/api/diagnose',content=b'x'*(2*1024*1024+1)).status_code==413
        created=first.post('/api/tickets',json=dict(equipment_id='R-01',title='Two API clients'))
        assert created.status_code==201,created.text
        ticket_id=created.json()['ticket']['id']
        assert second.get('/api/tickets/'+ticket_id).json()==created.json()
        updated=second.patch('/api/tickets/'+ticket_id,json=dict(expected_version=1,note='Shared across processes'))
        assert updated.status_code==200
        assert first.get('/api/tickets/'+ticket_id).json()==updated.json()
        assert first.patch('/api/tickets/T-SEED-001',json=dict(expected_version=1,note='vandalism')).status_code==403
    # Pool closes and a new application lifespan reconnects; data survives.
    with TestClient(create_app()) as restarted:
        assert restarted.get('/api/tickets/'+ticket_id).json()==updated.json()

def test_readonly_and_database_unavailable(monkeypatch):
    monkeypatch.setenv('DATABASE_URL','postgresql://postgres@127.0.0.1:59999/unavailable_test')
    monkeypatch.setenv('DEMO_READONLY','1')
    with TestClient(create_app()) as client:
        assert client.get('/api/health').status_code==200
        assert client.get('/api/ready').status_code==503
        assert client.post('/api/tickets',json={}).status_code==503
        response=client.get('/api/equipment');assert response.status_code==503
        assert '59999' not in response.text and 'postgresql' not in response.text

def test_distributed_api_quota_and_capacity(run_pg,monkeypatch):
    run_pg(lambda repo: asyncio.sleep(0))
    monkeypatch.setenv('DATABASE_URL',local_test_url());monkeypatch.setenv('DEMO_DAILY_REQUESTS','2')
    for i in range(3):
        with TestClient(create_app()) as client:
            assert client.get('/api/equipment').status_code==(200 if i<2 else 429)
    monkeypatch.setenv('DEMO_DAILY_REQUESTS','2000');monkeypatch.setenv('DEMO_MAX_DATABASE_BYTES','1')
    with TestClient(create_app()) as client:
        response=client.post('/api/tickets',json=dict(equipment_id='R-01',title='Capacity guard'))
        assert response.status_code==503 and 'capacity' in response.text

def test_remote_tls_and_required_channel_binding_are_preserved():
    from postgres.driver import connection_options
    options=connection_options('postgresql://example.invalid/demo?sslmode=require&channel_binding=require')
    assert options['sslmode']=='verify-full' and options['channel_binding']=='require'
    assert options['sslrootcert']=='system'

def test_same_origin_static_spa_and_api_routing(run_pg,monkeypatch):
    from pathlib import Path
    run_pg(lambda repo: asyncio.sleep(0))
    monkeypatch.setenv('DATABASE_URL',local_test_url());monkeypatch.setenv('MAINTAINAI_STATIC_DIR','frontend/dist')
    with TestClient(create_app()) as client:
        assert client.get('/').content==Path('frontend/dist/index.html').read_bytes()
        assert client.get('/maintenance/example').content==client.get('/').content
        assert client.get('/api/unknown').status_code==404
        assert client.get('/api/equipment').status_code==200

def test_hosted_cors_is_explicit_https(monkeypatch):
    monkeypatch.setenv('DATABASE_URL',local_test_url());monkeypatch.setenv('MAINTAINAI_HOSTED','1')
    monkeypatch.setenv('MAINTAINAI_ALLOWED_ORIGINS','*')
    with pytest.raises((RuntimeError,ValueError)):create_app()


def test_hosted_flag_cannot_silently_start_sqlite(monkeypatch):
    from backend.app import create_app as sqlite_app
    monkeypatch.setenv('MAINTAINAI_HOSTED','1')
    with pytest.raises(RuntimeError,match='SQLite is disabled'):sqlite_app()

def test_runtime_role_needs_no_schema_or_delete_privileges(run_pg):
    from urllib.parse import urlsplit,urlunsplit
    from postgres.local import pool_for
    from backend.postgres_repository import PostgresRepository
    async def check(owner):
        role='maintainai_b0_app_test'
        await owner.query(f'CREATE ROLE {role} LOGIN')
        await owner.query(f'GRANT USAGE ON SCHEMA public TO {role}')
        await owner.query(f'GRANT SELECT ON ALL TABLES IN SCHEMA public TO {role}')
        await owner.query(f'GRANT INSERT ON diagnoses,snapshot_manifests,snapshot_chunks,tickets,ticket_history,request_budgets TO {role}')
        await owner.query(f'GRANT UPDATE ON tickets,request_budgets,equipment_ticket_counts TO {role}')
        await owner.query(f'GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO {role}')
        parsed=urlsplit(local_test_url());url=urlunsplit((parsed.scheme,role+'@'+parsed.hostname+':'+str(parsed.port),parsed.path,'',''))
        pool=await pool_for(url)
        try:
            repo=PostgresRepository(pool)
            assert (await repo.query('SELECT pg_database_size(current_database()) AS bytes'))[0]['bytes']>0
            value={'id':'D-limited-role','evidence':'complete'};await repo.save_diagnosis(value)
            created=await repo.create_ticket(dict(equipment_id='R-01',diagnosis_id=value['id'],title='Restricted runtime',description='Synthetic'))
            assert created['diagnosis']==value
            from backend.domain import RepositoryError
            with pytest.raises(RepositoryError):await repo.query('DELETE FROM tickets')
            with pytest.raises(RepositoryError):await repo.query('ALTER TABLE snapshot_chunks DISABLE TRIGGER immutable_chunk')
        finally:
            await pool.close()
            await owner.query(f'DROP OWNED BY {role}')
            await owner.query(f'DROP ROLE {role}')
    run_pg(check)
