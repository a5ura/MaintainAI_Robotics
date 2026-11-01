"""Reproducible CPython/local D1 measurements, NOT billed Worker CPU."""
import asyncio
from copy import deepcopy
import gzip
import json
from pathlib import Path
import resource
import statistics
import time
from uuid import uuid4
from fastapi.testclient import TestClient
from backend.diagnostics import analyze
from backend.models import Cycle
from backend.d1_repository import D1Repository
from cloudflare.local_api import BoundLocalApp
from cloudflare.test_support import BridgeBinding

REPEATS=15

def summary(values):
    values=sorted(values)
    return dict(min=round(values[0],3),median=round(statistics.median(values),3),p95=round(values[int((len(values)-1)*.95)],3),max=round(values[-1],3))

def payloads():
    cases=json.loads(Path('fixtures/scenarios.json').read_text())
    multi=deepcopy(cases['position']);multi['samples'][-1]['vision']=cases['vision']['samples'][-1]['vision'];multi['samples'][-1]['events']+=cases['vision']['samples'][-1]['events'];cases['multi']=multi
    cases['small']={'samples':[cases['normal']['samples'][0]]}
    rows=cases['normal']['samples']
    maximum=[]
    for index in range(2000):
        t=12*index/1999;row=deepcopy(max((row for row in rows if row['t']<=t),key=lambda r:r['t']));row['t']=t
        row['events']=[dict(t=t,source='controller',code='DRIVE_WARNING',message='Synthetic load '+('x'*280))]
        maximum.append(row)
    cases['max-samples']={'samples':maximum}
    # Existing API ignores unknown fields; include maximum JSON parsing/body
    # pressure too. Model sample count remains the real accepted maximum 2000.
    near=deepcopy(cases['max-samples']);near['padding']=''
    compact=lambda p:json.dumps(p,separators=(',',':')).encode()
    near['padding']='x'*(2*1024*1024-len(compact(near)))
    assert len(compact(near))==2*1024*1024
    cases['max-body']=near
    dense=deepcopy(cases['max-samples'])
    for row in dense['samples']:
        row['events'].append(dict(t=row['t'],source='controller',code='DRIVE_WARNING',message='x'*100))
    assert len(compact(dense))<=2*1024*1024
    cases['max-evidence']=dense
    return cases

async def main():
    binding=BridgeBinding();repo=D1Repository(binding)
    await repo.query('DELETE FROM request_budgets');await repo.initialize()
    app=BoundLocalApp(binding=binding,DEMO_DAILY_SNAPSHOT_BYTES=str(16*1024*1024))
    cases=payloads();pure={};requests={}
    def measure(name,function):
        walls=[];cpus=[];statuses=[];metadata_start=len(binding.metadata)
        for _ in range(REPEATS):
            cpu=time.process_time_ns();wall=time.perf_counter_ns();result=function()
            walls.append((time.perf_counter_ns()-wall)/1e6);cpus.append((time.process_time_ns()-cpu)/1e6)
            if hasattr(result,'status_code'):statuses.append(result.status_code)
        meta=binding.metadata[metadata_start:]
        return dict(repeats=REPEATS,wall_ms=summary(walls),cpython_process_cpu_ms=summary(cpus),status_codes=sorted(set(statuses)),d1_statement_count=len(meta),d1_sql_duration_ms=summary([m['duration'] for m in meta]) if meta else None,d1_rows_read=sum(m.get('rows_read',0) for m in meta),d1_rows_written=sum(m.get('rows_written',0) for m in meta))
    with TestClient(app) as client:
        for name,payload in cases.items():
            encoded=json.dumps(payload,separators=(',',':')).encode()
            def compute():return analyze(Cycle.model_validate_json(encoded))
            result=compute()
            pure[name]=dict(samples=len(payload['samples']),body_bytes=len(encoded),snapshot_bytes=len(json.dumps(result).encode()),status=result['status'],anomalies=[a['kind'] for a in result['anomalies']],**measure(name,compute))
            requests['diagnose-'+name]=measure(name,lambda:client.post('/api/diagnose',content=encoded,headers={'Content-Type':'application/json'}))
        for name,path in [('health','/api/health'),('equipment','/api/equipment'),('tickets','/api/tickets'),('ticket-detail','/api/tickets/T-SEED-001')]:
            requests[name]=measure(name,lambda path=path:client.get(path))
        payload=dict(equipment_id='R-01',title='Synthetic benchmark',description='No user records',request_id=str(uuid4()))
        requests['guided-idempotent-create']=measure('create',lambda:client.post('/api/tickets',json=payload))
        ticket_id=client.post('/api/tickets',json=payload).json()['ticket']['id']
        version=1
        def update():
            nonlocal version
            response=client.patch('/api/tickets/'+ticket_id,json=dict(expected_version=version,note='Synthetic benchmark repair note'));version+=1;return response
        requests['ticket-update']=measure('update',update)
        def concurrent_updates():
            nonlocal version
            async def once():return await asyncio.gather(*(repo.update_ticket(ticket_id,dict(expected_version=version,note=note,status=None,resolution_notes=None)) for note in ('A','B')),return_exceptions=True)
            # This benchmark runs outside the async loop below.
            results=asyncio.run(once());version+=1
            return sorted([r.status if isinstance(r,Exception) else 200 for r in results])
        conflicts=[]
        for _ in range(5):conflicts.append(await asyncio.to_thread(concurrent_updates))
    assets=[]
    for path in sorted(Path('frontend/dist').rglob('*')):
        if path.is_file():
            data=path.read_bytes();assets.append(dict(path=str(path.relative_to('frontend/dist')),bytes=len(data),gzip_bytes=len(gzip.compress(data))))
    report=dict(environment='Managed Linux; CPython 3.12.14 + workerd D1 via loopback HTTP bridge',worker_cpu='UNVERIFIED: no Python Worker startup or authoritative Cloudflare CPU accounting',worker_memory='UNVERIFIED',memory_cpython_peak_rss_kib=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,repeats=REPEATS,pure_validation_and_diagnosis=pure,asgi_and_local_d1=requests,concurrent_update_status_pairs=conflicts,assets=assets)
    Path('docs/PHASE_A_MEASUREMENTS.json').write_text(json.dumps(report,indent=2)+'\n')
    print('Measured',len(cases),'payloads;',len(requests),'request types. Cloudflare CPU UNVERIFIED.')
if __name__=='__main__':asyncio.run(main())
