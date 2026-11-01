"""Two real API processes + restart, local PostgreSQL only; no hosted calls."""
import asyncio
import json
import os
from pathlib import Path
import signal
import subprocess
import time
from uuid import uuid4
import httpx
from postgres.local import test_url,pool_for
from backend.postgres_repository import PostgresRepository

async def main():
    url=test_url();pool=await pool_for(url);repo=PostgresRepository(pool);await repo.migrate()
    processes={};startup=[]
    async def start(port):
        stamp=time.perf_counter();log=open(f'/tmp/b0-api-{port}.log','a')
        process=subprocess.Popen(['.venv/bin/python','-m','uvicorn','backend.postgres_app:create_app','--factory','--host','127.0.0.1','--port',str(port)],stdout=log,stderr=log,start_new_session=True,env={**os.environ,'DATABASE_URL':url});log.close();processes[port]=process
        async with httpx.AsyncClient(timeout=2) as client:
            for _ in range(100):
                if process.poll() is not None:raise RuntimeError('Local API exited; see bounded log')
                try:
                    response=await client.get(f'http://127.0.0.1:{port}/api/ready')
                    if response.status_code==200:break
                except httpx.HTTPError:pass
                await asyncio.sleep(.1)
            else:raise RuntimeError('API readiness timeout')
        startup.append(round((time.perf_counter()-stamp)*1000,3))
    def stop(port):
        p=processes.pop(port);os.killpg(p.pid,signal.SIGTERM);p.wait(timeout=10)
    try:
        await start(8011);await start(8012)
        cases=json.loads(Path('fixtures/scenarios.json').read_text())
        async with httpx.AsyncClient(timeout=15) as client:
            a='http://127.0.0.1:8011/api';b='http://127.0.0.1:8012/api'
            response=await client.post(a+'/diagnose',json=cases['drop']);assert response.status_code==200
            async def oversized():
                for _ in range(17):yield b'x'*131072
            rejected=await client.post(a+'/diagnose',content=oversized(),headers={'Content-Type':'application/json'})
            assert rejected.status_code==413
            diagnosis=response.json();p=dict(equipment_id='R-01',diagnosis_id=diagnosis['id'],title='Synthetic two-process durability',description='No real data',request_id=str(uuid4()))
            responses=await asyncio.gather(client.post(a+'/tickets',json=p),client.post(b+'/tickets',json=p))
            assert all(r.status_code==201 for r in responses)
            ticket_id=responses[0].json()['ticket']['id'];assert responses[1].json()['ticket']['id']==ticket_id
            assert (await client.get(b+'/tickets/'+ticket_id)).json()['diagnosis']==diagnosis
            changed=await client.patch(b+'/tickets/'+ticket_id,json=dict(expected_version=1,status='In Progress',note='Persist across processes'))
            assert changed.status_code==200
            assert (await client.get(a+'/tickets/'+ticket_id)).json()==changed.json()
            races=await asyncio.gather(*(client.patch(root+'/tickets/'+ticket_id,json=dict(expected_version=2,note=note)) for root,note in ((a,'A'),(b,'B'))))
            assert sorted(r.status_code for r in races)==[200,409]
            saved=(await client.get(b+'/tickets/'+ticket_id)).json()
            stop(8011);await start(8011)
            assert (await client.get(a+'/tickets/'+ticket_id)).json()==saved
            await pool.close()
            subprocess.run(['env','-u','DOCKER_HOST','-u','DOCKER_CONTEXT','-u','DOCKER_TLS','-u','DOCKER_TLS_VERIFY','-u','DOCKER_CERT_PATH','docker','--host=unix:///var/run/docker.sock','restart','maintainai-b0-pg'],check=True,stdout=subprocess.DEVNULL,timeout=30)
            for _ in range(30):
                ready=await client.get(a+'/ready')
                if ready.status_code==200:break
                await asyncio.sleep(.2)
            else:raise RuntimeError('PostgreSQL restart recovery failed')
            assert (await client.get(a+'/tickets/'+ticket_id)).json()==saved
            pool=await pool_for(url);repo=PostgresRepository(pool)
            conflict=await client.post(a+'/tickets',json={**p,'title':'changed'})
            assert conflict.status_code==409
        connections=await repo.query("SELECT COUNT(*) AS count FROM pg_stat_activity WHERE datname=current_database()")
        report=dict(environment='Real local PostgreSQL 17 container, two native Uvicorn processes; NOT hosted durability',api_processes=2,restart_count=1,database_container_restart=True,startup_wall_ms=startup,diagnosis_id=diagnosis['id'],ticket_id=ticket_id,version=saved['ticket']['version'],history_events=len(saved['history']),full_evidence_equal=True,chunked_oversize_upload_status=413,concurrent_updates=[200,409],guided_duplicate_prevented=True,conflict_status=409,observed_database_connections=connections[0]['count'])
        Path('docs/PHASE_B0_DURABILITY.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
    finally:
        for port in list(processes):stop(port)
        await pool.close()
if __name__=='__main__':asyncio.run(main())
