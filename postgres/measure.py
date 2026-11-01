"""Bounded local full-request measurements; never hosted performance evidence."""
import asyncio
from copy import deepcopy
import json
import os
from pathlib import Path
import statistics
import sys
import time
import httpx
from backend.models import Cycle
from backend.diagnostics import analyze
from backend.postgres_repository import PostgresRepository
from cloudflare.measure import payloads
from postgres.local import pool_for,test_url

def stats(values):
    values=sorted(values)
    return dict(min=round(values[0],3),median=round(statistics.median(values),3),p95=round(values[int((len(values)-1)*.95)],3),max=round(values[-1],3))

def cpu_ms(pid):
    fields=Path(f'/proc/{pid}/stat').read_text().split()
    return (int(fields[13])+int(fields[14]))*1000/os.sysconf('SC_CLK_TCK')

async def measure_fresh_write(repo,value):
    """Time a new synthetic evidence insert, separate from HTTP/idempotent reads."""
    from uuid import uuid4
    fresh=deepcopy(value);fresh['id']=value['id']+'-storage-'+uuid4().hex
    stamp=time.perf_counter()
    await repo.save_diagnosis(fresh)
    elapsed=(time.perf_counter()-stamp)*1000
    assert await repo.load_diagnosis(fresh['id'])==json.loads(json.dumps(fresh))
    return round(elapsed,3)

async def main():
    pid=int(sys.argv[1]);pool=await pool_for(test_url());repo=PostgresRepository(pool)
    async with pool.acquire() as connection:
        await connection.execute('TRUNCATE ticket_history,tickets,diagnoses,equipment,request_budgets RESTART IDENTITY CASCADE')
    await repo.initialize()
    cases=payloads();unicode=deepcopy(cases['max-evidence'])
    for row in unicode['samples']:row['events'][0]['message']='λ'*100
    cases['unicode']=unicode;report={};n=5
    async with httpx.AsyncClient(base_url='http://127.0.0.1:5173',timeout=30) as client:
        for name,payload in cases.items():
            encoded=json.dumps(payload,ensure_ascii=False,separators=(',',':')).encode();assert len(encoded)<=2*1024*1024
            walls=[];api_cpu=[];compute=[]
            for _ in range(n):
                stamp=time.process_time_ns();value=analyze(Cycle.model_validate_json(encoded));compute.append((time.process_time_ns()-stamp)/1e6)
                cpu=cpu_ms(pid);stamp=time.perf_counter_ns();response=await client.post('/api/diagnose',content=encoded,headers={'Content-Type':'application/json'})
                walls.append((time.perf_counter_ns()-stamp)/1e6);api_cpu.append(cpu_ms(pid)-cpu)
                assert response.status_code==200,(name,response.text[:100])
            manifest=(await repo.query('SELECT * FROM snapshot_manifests WHERE diagnosis_id=?',(value['id'],)))[0]
            stamp=time.perf_counter();restored=await repo.load_diagnosis(value['id']);read_ms=(time.perf_counter()-stamp)*1000
            assert restored==json.loads(json.dumps(value))
            report[name]=dict(samples=len(payload['samples']),body_bytes=len(encoded),snapshot_bytes=manifest['byte_length'],chunks=manifest['chunk_count'],repeats=n,diagnostic_cpython_cpu_ms=stats(compute),full_api_wall_ms=stats(walls),native_api_process_cpu_ms_tick_resolution=stats(api_cpu),database_reconstruction_wall_ms=round(read_ms,3),database_fresh_write_wall_ms=await measure_fresh_write(repo,value))
        gets={}
        for path in ('/api/health','/api/ready','/api/equipment','/api/tickets','/api/tickets/T-SEED-001'):
            walls=[]
            for _ in range(n):
                stamp=time.perf_counter();r=await client.get(path);assert r.status_code==200;walls.append((time.perf_counter()-stamp)*1000)
            gets[path]=stats(walls)
        from uuid import uuid4
        ticket_payload=dict(equipment_id='R-01',title='Synthetic timing',description='No real data',request_id=str(uuid4()))
        creates=[]
        for _ in range(n):
            stamp=time.perf_counter();r=await client.post('/api/tickets',json=ticket_payload);creates.append((time.perf_counter()-stamp)*1000)
            assert r.status_code==201;ticket_id=r.json()['ticket']['id']
        updates=[]
        for version in range(1,n+1):
            stamp=time.perf_counter();r=await client.patch('/api/tickets/'+ticket_id,json=dict(expected_version=version,note='Synthetic timing note'));updates.append((time.perf_counter()-stamp)*1000)
            assert r.status_code==200
        gets['guided_create_and_idempotent_retry']=stats(creates);gets['ticket_update']=stats(updates)
        stamp=time.perf_counter();concurrent=await asyncio.gather(*(client.get('/api/equipment') for _ in range(5)));concurrent_ms=(time.perf_counter()-stamp)*1000
        assert all(r.status_code==200 for r in concurrent)
    # Increasing retained datasets; no public API quotas bypassed in deployment:
    # this is direct SQL in an explicitly disposable loopback test database.
    volumes=[];previous=0
    for count in (100,1000,7500):
        for start in range(previous,count,100):
            await repo.batch([("INSERT INTO tickets(id,equipment_id,title,description,status,created_at,updated_at,creation_note) VALUES(?,'R-01','Retained synthetic','fixture','Open',?,?,'Created')",(f'T-b0-{i:06d}',f'2026-10-{1+i%28:02d}',f'2026-10-{1+i%28:02d}')) for i in range(start,min(start+100,count))])
        stamp=time.perf_counter();equipment=await repo.equipment();registry_ms=(time.perf_counter()-stamp)*1000
        stamp=time.perf_counter();page=await repo.list_tickets();page_ms=(time.perf_counter()-stamp)*1000
        size=(await repo.query('SELECT pg_database_size(current_database()) AS bytes'))[0]['bytes']
        plan=await repo.query('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT id FROM tickets ORDER BY created_at DESC,id LIMIT 200')
        volumes.append(dict(tickets=count,equipment_wall_ms=round(registry_ms,3),ticket_page_wall_ms=round(page_ms,3),returned=len(page),database_bytes=size,plan=plan));previous=count
    for start in range(0,1000,100):
        await repo.batch([("INSERT INTO ticket_history(ticket_id,version,at,kind,body) VALUES('T-b0-000000',?,'2026-10-01','note',?)",(-i-1,'x'*2000)) for i in range(start,start+100)])
    detail=await repo.ticket('T-b0-000000');assert len(detail['history'])==200
    count=len(detail['history']);cursor=detail['history_next_seq'];pages=1
    while cursor is not None:
        page=await repo.history_page('T-b0-000000',cursor);count+=len(page['history']);cursor=page['next_seq'];pages+=1
    assert count==1001
    memory={line.split(':')[0]:line.split(':')[1].strip() for line in Path(f'/proc/{pid}/status').read_text().splitlines() if line.startswith(('VmRSS:','VmHWM:'))}
    connections=(await repo.query('SELECT COUNT(*) AS count FROM pg_stat_activity WHERE datname=current_database()'))[0]['count']
    result=dict(environment='Local native Python/Uvicorn + genuine PostgreSQL 17.11 container capped at 512 MiB/1 CPU, NOT hosted measurements',api_pid=pid,api_memory=memory,observed_database_connections=connections,configured_pool_max_per_api=4,cases=report,get_latency_ms=gets,retained=volumes,history=dict(events=1001,pages=pages,max_returned=200),cpu_note='Native process CPU uses OS ticks, excludes separate PostgreSQL CPU; never Cloudflare billed CPU',repeat_count=n,concurrent_five_reads_wall_ms=round(concurrent_ms,3))
    Path('docs/PHASE_B0_MEASUREMENTS.json').write_text(json.dumps(result,indent=2)+'\n');print('Measured 11 payload cases, native API and genuine PostgreSQL, 7500 tickets and 1001 history rows.')
    await pool.close()
if __name__=='__main__':asyncio.run(main())
