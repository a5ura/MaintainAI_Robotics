"""Disposable genuine-local-D1 retained-data measurement. Never hosted metrics."""
import asyncio
import json
from pathlib import Path
import time
from backend.d1_repository import D1Repository
from cloudflare.test_support import BridgeBinding
from cloudflare.measure import payloads
from backend.models import Cycle
from backend.diagnostics import analyze

async def main():
    binding=BridgeBinding();repo=D1Repository(binding,daily_snapshot_bytes=64*1024*1024)
    await repo.batch([(f'DELETE FROM {table}',()) for table in ('ticket_history','tickets','diagnoses','equipment','request_budgets')]);await repo.initialize()
    measured=[]
    async def measure(label,fn):
        offset=len(binding.metadata);calls=binding.calls;start=time.perf_counter();result=await fn();meta=binding.metadata[offset:]
        measured.append(dict(operation=label,wall_ms=round((time.perf_counter()-start)*1000,3),binding_calls=binding.calls-calls,statements=len(meta),rows_read=sum(m.get('rows_read',0) for m in meta),rows_written=sum(m.get('rows_written',0) for m in meta),sql_duration_ms=sum(m.get('duration',0) for m in meta),size_after=max((m.get('size_after',0) for m in meta),default=0)))
        return result
    previous=0
    for total in (100,1000,7500):
        for start in range(previous,total,100):
            statements=[]
            for i in range(start,min(start+100,total)):
                stamp=f'2026-11-{1+i%28:02d}T12:00:00+00:00'
                statements.append(("INSERT INTO tickets(id,equipment_id,title,description,status,created_at,updated_at,creation_note) VALUES(?,'R-01',?,?,'Open',?,?,'Synthetic retained fixture')",(f'T-volume-{i:06d}',f'Incident {i}','x'*128,stamp,stamp)))
            await measure(f'insert-to-{total}',lambda:repo.batch(statements))
        registry=await measure(f'equipment-{total}',repo.equipment)
        assert next(row['ticket_count'] for row in registry if row['id']=='R-01')==total+1
        first=await measure(f'global-first-{total}',repo.list_tickets)
        await measure(f'filtered-first-{total}',lambda:repo.list_tickets('R-01'))
        seen={row['id'] for row in first};last=first[-1]
        page=await measure(f'global-next-{total}',lambda:repo.list_tickets(None,last['created_at'],last['id']))
        await measure(f'filtered-next-{total}',lambda:repo.list_tickets('R-01',last['created_at'],last['id']))
        assert not seen.intersection(row['id'] for row in page)
        previous=total
    for start in range(0,2500,100):
        await repo.batch([("INSERT INTO ticket_history(ticket_id,version,at,kind,body) VALUES('T-volume-000000',?,?,'note',?)",(-i-1,'2026-11-30',str(i)+'x'*1980)) for i in range(start,start+100)])
    detail=await measure('history-first-2501',lambda:repo.ticket('T-volume-000000'))
    cursor=detail['history_next_seq'];count=len(detail['history'])
    while cursor is not None:
        page=await measure('history-next-2501',lambda:repo.history_page('T-volume-000000',cursor));count+=len(page['history']);cursor=page['next_seq']
    assert count==2501
    result=analyze(Cycle(**payloads()['max-evidence']))
    await measure('dense-snapshot-save',lambda:repo.save_diagnosis(result))
    loaded=await measure('dense-snapshot-load',lambda:repo.load_diagnosis(result['id']))
    assert loaded==json.loads(json.dumps(result))
    manifest=(await repo.query('SELECT * FROM snapshot_manifests WHERE diagnosis_id=?',(result['id'],)))[0]
    await measure('dense-snapshot-retry',lambda:repo.save_diagnosis(result))
    plans={label:await repo.query('EXPLAIN QUERY PLAN '+sql) for label,sql in {'global':"SELECT id FROM tickets ORDER BY created_at DESC,id LIMIT 200",'equipment':"SELECT id FROM tickets WHERE equipment_id='R-01' ORDER BY created_at DESC,id LIMIT 200",'history':"SELECT seq FROM ticket_history WHERE ticket_id='T-volume-000000' AND seq>100 ORDER BY seq LIMIT 201"}.items()}
    report=dict(environment='CPython + genuine local workerd D1, NOT Python Workers or hosted billing',datasets=[100,1000,7500],history_rows=2501,snapshot_manifest=manifest,operations=measured,query_plans=plans,worker_cpu='UNVERIFIED')
    Path('docs/PHASE_A2_MEASUREMENTS.json').write_text(json.dumps(report,indent=2)+'\n')
    print('Measured 100/1000/7500 tickets, 2501 history rows, complete dense snapshot and idempotent retry.')
if __name__=='__main__':asyncio.run(main())
