"""Start/stop a disposable genuine D1 emulator twice; never uses remote D1."""
import asyncio
import json
import os
from pathlib import Path
import signal
import subprocess
import tempfile
import time
from uuid import uuid4
import httpx
from backend.d1_repository import D1Repository
from cloudflare.local_schema import apply_schema
from cloudflare.test_support import BridgeBinding

async def main():
    Path('.wrangler').mkdir(exist_ok=True)
    startup=[]
    with tempfile.TemporaryDirectory(prefix='restart-',dir='.wrangler') as state:
        binding=BridgeBinding('http://127.0.0.1:8790/__contract/query')
        repo=D1Repository(binding)
        expected=None
        for run in range(2):
            start=time.perf_counter()
            with open('/tmp/phase-a-restart-runtime.log','a') as log:
                process=subprocess.Popen(['node_modules/.bin/wrangler','dev','--local','--config','wrangler.d1-local.jsonc','--ip','127.0.0.1','--port','8790','--persist-to',state],stdout=log,stderr=log,start_new_session=True,env={**os.environ,'WRANGLER_SEND_METRICS':'false','XDG_CONFIG_HOME':'/tmp/phase-a-config'})
                try:
                    async with httpx.AsyncClient(timeout=1) as client:
                        for attempt in range(150):
                            if process.poll() is not None:raise RuntimeError('D1 emulator exited; see restart log')
                            try:
                                response=await client.get('http://127.0.0.1:8790/')
                                if response.status_code==200:break
                            except httpx.HTTPError:pass
                            await asyncio.sleep(.2)
                        else:raise RuntimeError('Local emulator readiness timed out')
                    startup.append(round((time.perf_counter()-start)*1000,3))
                    if run==0:
                        # Prove additive migration from real schema v1 with a legacy snapshot.
                        await apply_schema(binding,Path('cloudflare/migrations/0001_domain.sql'))
                        await repo.query('INSERT INTO equipment VALUES(?,?,?,?)',('LEGACY','Legacy fixture','Synthetic','Operational'))
                        await repo.query('INSERT INTO diagnoses VALUES(?,?,?)',('D-legacy','{"id":"D-legacy","evidence":"retained"}','2026-11-01'))
                        await apply_schema(binding);await apply_schema(binding);await repo.initialize()
                        assert await repo.load_diagnosis('D-legacy')=={'id':'D-legacy','evidence':'retained'}
                        large={'id':'D-restart-chunked','evidence':'unicode λ'*300000}
                        await repo.save_diagnosis(large)
                        assert await repo.load_diagnosis(large['id'])==large
                        diagnosis=(await repo.ticket('T-SEED-001'))['diagnosis']
                        created=await repo.create_ticket(dict(equipment_id='R-01',diagnosis_id=diagnosis['id'],title='Synthetic restart proof',description='No user records',request_id=uuid4()))
                        expected=await repo.update_ticket(created['ticket']['id'],dict(expected_version=1,status='In Progress',note='Persist this repair note',resolution_notes=None))
                        await repo.reserve('restart-proof',3,day='2099-01-01')
                    else:
                        assert await repo.load_diagnosis(large['id'])==large
                        assert await repo.ticket(expected['ticket']['id'])==expected
                        assert await repo.reserve('restart-proof',3,day='2099-01-01')==2
                        await repo.initialize()
                        assert await repo.load_diagnosis(large['id'])==large
                        assert await repo.ticket(expected['ticket']['id'])==expected
                finally:
                    os.killpg(process.pid,signal.SIGTERM)
                    try:process.wait(timeout=10)
                    except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);process.wait()
    report=dict(environment='Local JS workerd D1 emulator, CPython adapter; NOT Python Workers or hosted D1',restart_count=1,startup_wall_ms=startup,persisted_ticket_version=expected['ticket']['version'],history_events=len(expected['history']),diagnosis_id=expected['diagnosis']['id'],snapshot_equal=True,repair_note_equal=True,budget_survived=True,seed_repeat_preserved_records=True,legacy_v1_migration=True,large_chunked_evidence_survived=True)
    Path('docs/PHASE_A2_RECOVERY.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__':asyncio.run(main())
