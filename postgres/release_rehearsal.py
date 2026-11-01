"""Synthetic, loopback-only B.1 rehearsal. Never provisions or deploys.

Requires the existing disposable maintainai-b0-pg container on 55432, production
frontend build and Chromium. Owns port 5173. Runs real production startup with a
restricted password-authenticated role; removes that role/HBA rule on exit.
"""
import asyncio
from copy import deepcopy
import json
import os
from pathlib import Path
import resource
import secrets
import signal
import subprocess
import sys
import tempfile
import time
from urllib.parse import quote
from uuid import uuid4

import httpx
from psycopg import sql
from backend.domain import RepositoryError, now
from backend.postgres_repository import PostgresRepository
from cloudflare.measure import payloads
from postgres.local import pool_for, test_url
from postgres.measure import cpu_ms

ROOT = Path(__file__).resolve().parents[1]
ROLE = 'maintainai_b1_runtime'
DOCKER = ['env', '-u', 'DOCKER_HOST', '-u', 'DOCKER_CONTEXT', '-u', 'DOCKER_TLS', '-u', 'DOCKER_TLS_VERIFY', '-u', 'DOCKER_CERT_PATH', 'docker', '--host=unix:///var/run/docker.sock']


def docker(*args, **kwargs):
    return subprocess.run(DOCKER+list(args), check=True, capture_output=True, **kwargs)


def hba(enabled):
    # Only this rehearsal's marked rule changes. All other rules stay intact.
    script = "set -eu\nsed '/# maintainai-b1-only$/d' \"$PGDATA/pg_hba.conf\" > \"$PGDATA/b1-hba.tmp\"\n"
    if enabled:
        script += "{ printf 'host all maintainai_b1_runtime all scram-sha-256 # maintainai-b1-only\\n'; cat \"$PGDATA/b1-hba.tmp\"; } > \"$PGDATA/pg_hba.conf\"\n"
    else:
        script += 'cat "$PGDATA/b1-hba.tmp" > "$PGDATA/pg_hba.conf"\n'
    script += 'rm "$PGDATA/b1-hba.tmp"\npg_ctl reload -D "$PGDATA"\n'
    docker('exec', '-i', '--user', 'postgres', 'maintainai-b0-pg', 'sh', input=script.encode())


async def main():
    if test_url() != 'postgresql://postgres@127.0.0.1:55432/maintainai_b0_test':
        raise ValueError('Only the owned disposable local test database is supported')
    pool = await pool_for(test_url()); owner = PostgresRepository(pool)
    await owner.migrate()
    await owner.query('TRUNCATE ticket_history,tickets,diagnoses,equipment,request_budgets RESTART IDENTITY CASCADE')
    await owner.initialize()
    password = secrets.token_urlsafe(32); wrong = secrets.token_urlsafe(32)
    url = f'postgresql://{ROLE}:{quote(password, safe="")}@127.0.0.1:55432/maintainai_b0_test'
    bad_url = url.replace(quote(password, safe=''), quote(wrong, safe=''))
    process = None; role_created = False; hba_changed = False; logs = []
    starts = []; cases_report = {}; base = 'http://127.0.0.1:5173'
    cpu = min(os.sched_getaffinity(0)); max_address = 512*1024*1024

    def limits():
        resource.setrlimit(resource.RLIMIT_AS, (max_address, max_address))
        os.sched_setaffinity(0, {cpu})

    async def stop():
        nonlocal process
        if process is not None:
            if process.poll() is None:
                os.killpg(process.pid, signal.SIGTERM)
                await asyncio.to_thread(process.wait, 10)
            process = None

    async def start(directory, **extra):
        nonlocal process
        await stop(); path = Path(directory)/f'api-{len(logs)}.log'; logs.append(path)
        env = {**os.environ, 'PATH': str(Path(sys.executable).parent)+os.pathsep+os.environ['PATH'], 'DATABASE_URL': url, 'PORT': '5173', 'MAINTAINAI_HOSTED': '1', 'MAINTAINAI_ALLOWED_ORIGINS': 'https://release.invalid', 'MAINTAINAI_STATIC_DIR': str(ROOT/'frontend/dist'), 'DEMO_DAILY_WRITES': '2000', 'DEMO_DAILY_REQUESTS': '10000', **extra}
        stamp = time.perf_counter()
        with path.open('wb') as output:
            process = subprocess.Popen(['./scripts/start-native.sh'], cwd=ROOT, env=env, stdout=output, stderr=output, start_new_session=True, preexec_fn=limits)
        async with httpx.AsyncClient(timeout=2) as client:
            for _ in range(100):
                if process.poll() is not None:raise RuntimeError('Rehearsal API exited; inspect protected local log')
                try:
                    if (await client.get(base+'/api/health')).status_code == 200:break
                except httpx.HTTPError:pass
                await asyncio.sleep(.1)
            else:raise RuntimeError('Local API liveness timeout')
        starts.append(round((time.perf_counter()-stamp)*1000, 3))

    async def ready(client):
        for _ in range(30):
            try:
                if (await client.get(base+'/api/ready')).status_code == 200:return
            except httpx.HTTPError:pass
            await asyncio.sleep(.2)
        raise RuntimeError('Local database readiness did not recover')

    try:
        await owner.query((ROOT/'postgres/runtime-role.sql').read_text().replace('maintainai_runtime', ROLE)); role_created = True
        async with pool.acquire() as connection:
            await connection.raw.execute(sql.SQL('ALTER ROLE {} PASSWORD {}').format(sql.Identifier(ROLE), sql.Literal(password)))
        hba_changed = True; hba(True)
        with tempfile.TemporaryDirectory(prefix='maintainai-b1-') as directory:
            await start(directory)
            async with httpx.AsyncClient(timeout=30) as client:
                await ready(client)
                for path in ('/', '/maintenance/synthetic-refresh'):
                    response = await client.get(base+path)
                    assert response.status_code == 200 and response.headers['cache-control'] == 'no-store'
                for path in ('/docs', '/openapi.json', '/.env', '/assets/missing.js'):
                    assert (await client.get(base+path)).status_code == 404
                # All 16 existing real-browser tests, including all scenarios,
                # guided/manual takeover, drafts and independent browser contexts.
                with open('/tmp/b1-browser-pg.log', 'wb') as output:
                    browser = await asyncio.create_subprocess_exec('npm', '--prefix', 'frontend', 'run', 'smoke', cwd=ROOT, env={**os.environ, 'CHROMIUM_PATH': os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium')}, stdout=output, stderr=output)
                    assert await browser.wait() == 0, 'Chromium failed; see /tmp/b1-browser-pg.log'
                cases = payloads(); unicode = deepcopy(cases['max-evidence'])
                for row in unicode['samples']:row['events'][0]['message'] = 'λ'*100
                cases['unicode'] = unicode
                for name, payload in cases.items():
                    body = json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode()
                    stamp = time.perf_counter(); before_cpu = cpu_ms(process.pid)
                    response = await client.post(base+'/api/diagnose', content=body, headers={'Content-Type': 'application/json'})
                    elapsed = (time.perf_counter()-stamp)*1000
                    assert response.status_code == 200, name
                    diagnosis = response.json()
                    assert await owner.load_diagnosis(diagnosis['id']) == diagnosis
                    cases_report[name] = {'request_bytes': len(body), 'response_bytes': len(response.content), 'api_wall_ms': round(elapsed, 3), 'api_cpu_ms_10ms_ticks': round(cpu_ms(process.pid)-before_cpu, 3)}
                assert (await client.post(base+'/api/diagnose', content=b'x'*(2*1024*1024+1))).status_code == 413
                payload = dict(equipment_id='R-01', diagnosis_id=diagnosis['id'], title='B1 restricted runtime durability', description='Synthetic only', request_id=str(uuid4()))
                created = await client.post(base+'/api/tickets', json=payload); assert created.status_code == 201
                detail = created.json(); ticket_id = detail['ticket']['id']
                assert (await client.post(base+'/api/tickets', json=payload)).json()['ticket']['id'] == ticket_id
                updated = await client.patch(base+'/api/tickets/'+ticket_id, json={'expected_version': 1, 'note': 'Persist across production-shaped restarts'})
                assert updated.status_code == 200; detail = updated.json()
                readings = {row.split(':')[0]: row.split(':')[1].strip() for row in Path(f'/proc/{process.pid}/status').read_text().splitlines() if row.startswith(('VmRSS:', 'VmHWM:'))}
                await start(directory); await ready(client)
                assert (await client.get(base+'/api/tickets/'+ticket_id)).json() == detail
                docker('stop', 'maintainai-b0-pg')
                assert (await client.get(base+'/api/health')).status_code == 200
                assert (await client.get(base+'/api/ready')).status_code == 503
                unavailable = await client.get(base+'/api/equipment')
                assert unavailable.status_code == 503 and password not in unavailable.text
                docker('start', 'maintainai-b0-pg'); await ready(client)
                assert (await client.get(base+'/api/tickets/'+ticket_id)).json() == detail
                # Reconnect the operator control pool explicitly; the API above
                # recovered independently without an application restart.
                await pool.close(); pool = await pool_for(test_url()); owner = PostgresRepository(pool)
                await owner.query('UPDATE postgres_schema SET version=99 WHERE version=1')
                try:
                    assert (await client.get(base+'/api/ready')).status_code == 503
                    try:await owner.migrate()
                    except RepositoryError:pass
                    else:raise AssertionError('Unknown schema migration accepted')
                finally:await owner.query('UPDATE postgres_schema SET version=1 WHERE version=99')
                assert (await client.get(base+'/api/tickets/'+ticket_id)).json() == detail
                await start(directory, DEMO_READONLY='1'); await ready(client)
                assert (await client.post(base+'/api/tickets', json=payload)).status_code == 503
                assert (await client.get(base+'/api/tickets/'+ticket_id)).json() == detail
                await start(directory, DATABASE_URL=bad_url)
                assert (await client.get(base+'/api/health')).status_code == 200
                assert (await client.get(base+'/api/ready')).status_code == 503
                error = await client.get(base+'/api/equipment')
                assert error.status_code == 503 and wrong not in error.text
                await owner.query('DELETE FROM request_budgets WHERE bucket=?', (now()[:10]+':requests',))
                await start(directory, DEMO_DAILY_REQUESTS='2'); await ready(client)
                assert [(await client.get(base+'/api/equipment')).status_code for _ in range(3)] == [200, 200, 429]
                await stop()
                for path in logs:
                    content = path.read_text()
                    assert password not in content and wrong not in content, 'Credential leaked in API log'
                report = {'environment': 'Existing managed Linux; local native production startup, actual PostgreSQL 17.11; NOT Render/Neon hosted tests', 'profile': {'api_virtual_address_limit_bytes': max_address, 'api_cpu_affinity_cores': 1, 'postgres_container_memory_bytes': 536870912, 'postgres_container_cpu_limit': 1, 'note': 'Virtual-address limit and one-core affinity are local approximations, not provider RAM/CPU guarantees'}, 'runtime_role': 'restricted non-owner, SCRAM password authenticated; no DELETE/CREATE/ALTER', 'browser': {'passed': 16, 'failed': 0, 'skipped': 0}, 'startup_liveness_wall_ms': starts, 'api_memory_before_restart': readings, 'payloads_single_pass': cases_report, 'api_restart_record_equal': True, 'database_stop_unavailable_safe_503': True, 'same_api_recovers_after_database_restart': True, 'unknown_schema_migration_refused_without_record_change': True, 'wrong_password_safe_503_without_secret_in_logs': True, 'readonly_preserves_reads_and_records': True, 'request_budget_statuses': [200, 200, 429], 'oversized_body_status': 413, 'test_only_browser_budgets': {'daily_writes': 2000, 'daily_requests': 10000}}
                (ROOT/'docs/PHASE_B1_REHEARSAL.json').write_text(json.dumps(report, indent=2)+'\n')
                print('B1 rehearsal passed: 16 Chromium tests, 11 full-size payloads, restricted SCRAM role, bounded API, API/DB restart, unavailable/wrong credentials, readonly, quota and migration failure.')
    finally:
        await stop()
        # Ensure an interrupted outage test never leaves this owned DB stopped.
        docker('start', 'maintainai-b0-pg')
        if hba_changed:hba(False)
        if role_created:
            await pool.close(); pool = await pool_for(test_url()); owner = PostgresRepository(pool)
            await owner.query(f'DROP OWNED BY {ROLE}')
            await owner.query(f'DROP ROLE {ROLE}')
        await pool.close()


if __name__ == '__main__':
    asyncio.run(main())
