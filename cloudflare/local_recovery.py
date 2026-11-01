"""Disposable fixture backup/restore over the loopback D1 bridge only.

Not a production migrator or a hosted-backup implementation. Exported JSON is
sensitive if adapted to real records; this phase uses synthetic fixtures only.
"""
import json
from cloudflare.test_support import BridgeBinding
from backend.d1_repository import D1Repository

TABLES=('equipment','diagnoses','snapshot_manifests','snapshot_chunks','tickets','ticket_history','request_budgets')

async def export_fixture(binding):
    if not isinstance(binding,BridgeBinding):raise ValueError('Local contract bridge required')
    repo=D1Repository(binding)
    tables={}
    # Quiesced fixture export only: bound every response including legacy JSON.
    for table in TABLES:
        order='seq' if table=='ticket_history' else 'bucket' if table=='request_budgets' else 'diagnosis_id,chunk_index' if table=='snapshot_chunks' else 'diagnosis_id' if table=='snapshot_manifests' else 'id'
        page_size=16 if table=='snapshot_chunks' else 4 if table=='diagnoses' else 100
        limit=80 if table=='snapshot_chunks' else 100
        rows=[]
        while True:
            page=await repo.query(f'SELECT * FROM {table} ORDER BY {order} LIMIT ? OFFSET ?',(page_size,len(rows)))
            rows.extend(page)
            if len(rows)>limit:raise ValueError('Fixture export limit exceeded; use a separately reviewed operator export')
            if len(page)<page_size:break
        tables[table]=rows
    return {'schema_version':2,'synthetic_only':True,'tables':tables}

async def restore_fixture(binding,backup,*,confirm_disposable=False):
    if not isinstance(binding,BridgeBinding) or not confirm_disposable:raise ValueError('Explicit disposable local restore required')
    if backup.get('schema_version') not in (1,2) or backup.get('synthetic_only') is not True :raise ValueError('Unsupported fixture export')
    tables={table:backup['tables'].get(table,[]) for table in TABLES}
    from backend.snapshots import verify
    for manifest in tables['snapshot_manifests']:
        verify(manifest,sorted((row for row in tables['snapshot_chunks'] if row['diagnosis_id']==manifest['diagnosis_id']),key=lambda row:row['chunk_index']))
    trigger=(await D1Repository(binding).query("SELECT sql FROM sqlite_master WHERE name='manifest_budget'"))[0]['sql']
    statements=[('DROP TRIGGER manifest_budget',())]+[(f'DELETE FROM {table}',()) for table in ('ticket_history','tickets','diagnoses','equipment','request_budgets')]
    # Ticket INSERT triggers create history; replace it with the exact exported
    # history after inserting tickets. All deletions/inserts share one D1 batch.
    for table in TABLES:
        if table=='ticket_history':statements.append(('DELETE FROM ticket_history',()))
        for row in tables[table]:
            columns=list(row)
            if not columns or any(not col.replace('_','').isalnum() for col in columns):raise ValueError('Invalid fixture column')
            statements.append((f'INSERT INTO {table}({",".join(columns)}) VALUES({",".join("?" for _ in columns)})',tuple(row.values())))
    statements.append((trigger,()))
    if len(statements)>100:raise ValueError('Small fixture only; production migration requires a separately reviewed tool')
    await D1Repository(binding).batch(statements)
