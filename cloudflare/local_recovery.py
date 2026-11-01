"""Disposable fixture backup/restore over the loopback D1 bridge only.

Not a production migrator or a hosted-backup implementation. Exported JSON is
sensitive if adapted to real records; this phase uses synthetic fixtures only.
"""
import json
from cloudflare.test_support import BridgeBinding
from backend.d1_repository import D1Repository

TABLES=('equipment','diagnoses','tickets','ticket_history','request_budgets')

async def export_fixture(binding):
    if not isinstance(binding,BridgeBinding):raise ValueError('Local contract bridge required')
    repo=D1Repository(binding)
    results=await repo.batch([(f'SELECT * FROM {table} ORDER BY '+('seq' if table=='ticket_history' else 'bucket' if table=='request_budgets' else 'id'),()) for table in TABLES])
    return {'schema_version':1,'synthetic_only':True,'tables':{table:result['results'] for table,result in zip(TABLES,results)}}

async def restore_fixture(binding,backup,*,confirm_disposable=False):
    if not isinstance(binding,BridgeBinding) or not confirm_disposable:raise ValueError('Explicit disposable local restore required')
    if backup.get('schema_version')!=1 or backup.get('synthetic_only') is not True or set(backup['tables'])!=set(TABLES):raise ValueError('Unsupported fixture export')
    statements=[(f'DELETE FROM {table}',()) for table in reversed(TABLES)]
    # Ticket INSERT triggers create history; replace it with the exact exported
    # history after inserting tickets. All deletions/inserts share one D1 batch.
    for table in TABLES:
        if table=='ticket_history':statements.append(('DELETE FROM ticket_history',()))
        for row in backup['tables'][table]:
            columns=list(row)
            if not columns or any(not col.replace('_','').isalnum() for col in columns):raise ValueError('Invalid fixture column')
            statements.append((f'INSERT INTO {table}({",".join(columns)}) VALUES({",".join("?" for _ in columns)})',tuple(row.values())))
    if len(statements)>100:raise ValueError('Small fixture only; production migration requires a separately reviewed tool')
    await D1Repository(binding).batch(statements)
