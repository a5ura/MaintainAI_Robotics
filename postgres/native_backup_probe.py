"""Trusted local pg_dump/pg_restore proof; fresh disposable target, never hosted."""
import asyncio
import json
from pathlib import Path
import subprocess
import tempfile
from uuid import uuid4
from postgres.local import pool_for,test_url
from backend.postgres_repository import PostgresRepository

DOCKER=['env','-u','DOCKER_HOST','-u','DOCKER_CONTEXT','-u','DOCKER_TLS','-u','DOCKER_TLS_VERIFY','-u','DOCKER_CERT_PATH','docker','--host=unix:///var/run/docker.sock','exec','--user','postgres']
TABLES={'equipment':'id','diagnoses':'id','snapshot_manifests':'diagnosis_id','snapshot_chunks':'diagnosis_id,chunk_index','tickets':'id','ticket_history':'seq','request_budgets':'bucket','equipment_ticket_counts':'equipment_id','postgres_schema':'version'}

async def fingerprints(pool):
    repo=PostgresRepository(pool);result={}
    for table,order in TABLES.items():
        result[table]=(await repo.query(f"SELECT COUNT(*) AS count,encode(sha256(convert_to(COALESCE(string_agg(row_to_json(t)::text,E'\\n' ORDER BY {order}),''),'UTF8')),'hex') AS hash FROM {table} t"))[0]
    return result

async def main():
    source=test_url()
    if source!='postgresql://postgres@127.0.0.1:55432/maintainai_b0_test':raise ValueError('Owned local test container required')
    target='b0_restore_'+uuid4().hex[:10]+'_test';created=False
    with tempfile.TemporaryDirectory(prefix='maintainai-b0-backup-') as directory:
        path=Path(directory)/'synthetic.dump'
        with path.open('wb') as output:subprocess.run(DOCKER+['maintainai-b0-pg','pg_dump','--format=custom','--no-owner','--dbname=maintainai_b0_test'],check=True,stdout=output,stderr=subprocess.PIPE)
        subprocess.run(DOCKER+['maintainai-b0-pg','createdb',target],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);created=True
        try:
            with path.open('rb') as data:
                subprocess.run(DOCKER[:]+['-i','maintainai-b0-pg','pg_restore','--single-transaction','--exit-on-error','--no-owner','--dbname='+target],stdin=data,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
            a=await pool_for(source);b=await pool_for(source.replace('maintainai_b0_test',target))
            try:
                before=await fingerprints(b);assert before==await fingerprints(a)
                bad=subprocess.run(DOCKER+['-i','maintainai-b0-pg','pg_restore','--single-transaction','--exit-on-error','--dbname='+target],input=b'not a PostgreSQL archive',stdout=subprocess.PIPE,stderr=subprocess.PIPE)
                assert bad.returncode!=0 and await fingerprints(b)==before
                report=dict(environment='Real local PostgreSQL pg_dump/pg_restore, NOT hosted backups',full_table_fingerprints=before,restored_equal=True,malformed_archive_rejected=True,destination_unchanged=True,archive_bytes=path.stat().st_size)
                Path('docs/PHASE_B0_BACKUP.json').write_text(json.dumps(report,indent=2)+'\n');print('Native archive restored to fresh test DB; all table fingerprints match; malformed restore preserved complete destination.')
            finally:await a.close();await b.close()
        finally:
            if created:subprocess.run(DOCKER+['maintainai-b0-pg','dropdb',target],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
if __name__=='__main__':asyncio.run(main())
