import asyncio
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import pytest
from fastapi.testclient import TestClient

from backend.domain import RepositoryError
from backend.postgres_app import create_app
from backend.postgres_repository import PostgresRepository
from postgres.local import pool_for, test_url as local_test_url


@pytest.mark.parametrize('origin', [
    'https://*', 'https://example.invalid/path', 'https://user:secret@example.invalid',
    'https://example.invalid?query=1', 'https://example.invalid#fragment',
    'https://example.invalid:0',
])
def test_hosted_origins_are_origins_not_urls(monkeypatch, origin):
    monkeypatch.setenv('DATABASE_URL', local_test_url())
    monkeypatch.setenv('MAINTAINAI_HOSTED', '1')
    monkeypatch.setenv('MAINTAINAI_ALLOWED_ORIGINS', origin)
    with pytest.raises(RuntimeError, match='explicit HTTPS origins'):
        create_app()


def test_hosted_static_release_routing_and_cache(run_pg, monkeypatch, tmp_path):
    run_pg(lambda repo: asyncio.sleep(0))
    (tmp_path / 'assets').mkdir()
    (tmp_path / 'index.html').write_text('<main>release candidate</main>')
    (tmp_path / 'assets/app-hash.js').write_text('console.log("release")')
    (tmp_path / '.env').write_text('DATABASE_URL=must-never-appear')
    monkeypatch.setenv('DATABASE_URL', local_test_url())
    monkeypatch.setenv('MAINTAINAI_HOSTED', '1')
    monkeypatch.setenv('MAINTAINAI_ALLOWED_ORIGINS', 'https://release.invalid')
    monkeypatch.setenv('MAINTAINAI_STATIC_DIR', str(tmp_path))
    with TestClient(create_app()) as client:
        for path in ('/', '/maintenance/example'):
            response = client.get(path)
            assert response.status_code == 200 and response.headers['cache-control'] == 'no-store'
            assert response.headers['x-content-type-options'] == 'nosniff'
        asset = client.get('/assets/app-hash.js')
        assert asset.status_code == 200 and 'immutable' in asset.headers['cache-control']
        for path in ('/assets/missing.js', '/.env', '/.git/config', '/docs', '/redoc', '/openapi.json', '/api/missing'):
            response = client.get(path)
            assert response.status_code == 404
            assert 'must-never-appear' not in response.text
        assert client.get('/api/health').status_code == 200
        response = client.get('/api/equipment', headers={'Origin': 'https://release.invalid'})
        assert response.headers['access-control-allow-origin'] == 'https://release.invalid'
        response = client.get('/api/equipment', headers={'Origin': 'https://untrusted.invalid'})
        assert 'access-control-allow-origin' not in response.headers


def test_documented_runtime_role_full_maintenance_workflow(run_pg):
    async def check(owner):
        await owner.query(Path('postgres/runtime-role.sql').read_text())
        parsed = urlsplit(local_test_url())
        url = urlunsplit((parsed.scheme, 'maintainai_runtime@'+parsed.hostname+':'+str(parsed.port), parsed.path, '', ''))
        pool = await pool_for(url)
        try:
            repo = PostgresRepository(pool)
            await repo.check_schema()
            await repo.reserve('release-role-test', 2)
            evidence = {'id': 'D-release-role', 'evidence': 'immutable synthetic evidence'}
            await repo.save_diagnosis(evidence)
            detail = await repo.create_ticket(dict(equipment_id='R-01', diagnosis_id=evidence['id'], title="Synthetic ' SQL text", description='No real data'))
            ticket_id = detail['ticket']['id']
            detail = await repo.update_ticket(ticket_id, dict(expected_version=1, status='Resolved', resolution_notes='Synthetic repair verified', note='Operator note'))
            assert detail['ticket']['version'] == 2 and len(detail['history']) == 3
            assert (await repo.ticket(ticket_id))['diagnosis'] == evidence
            assert await repo.equipment() and await repo.list_tickets()
            for sql in ('DELETE FROM tickets', 'CREATE TABLE forbidden(id INTEGER)', 'ALTER TABLE tickets ADD COLUMN forbidden INTEGER'):
                with pytest.raises(RepositoryError):
                    await repo.query(sql)
        finally:
            await pool.close()
            await owner.query('DROP OWNED BY maintainai_runtime')
            await owner.query('DROP ROLE maintainai_runtime')
    run_pg(check)
