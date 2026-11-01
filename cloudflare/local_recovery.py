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

# Exact exported columns, including private trigger fields retained by v1 fixtures.
COLUMNS={
    'equipment':'id name description status',
    'diagnoses':'id snapshot created_at',
    'snapshot_manifests':'diagnosis_id format schema_version byte_length chunk_count sha256 created_at storage_bytes budget_day budget_limit',
    'snapshot_chunks':'diagnosis_id chunk_index content',
    'tickets':'id equipment_id diagnosis_id title description status resolution_notes version created_at updated_at creation_note last_note last_status_note',
    'ticket_history':'seq ticket_id version at kind body',
    'request_budgets':'bucket used',
}
INTEGER_FIELDS={'schema_version','byte_length','chunk_count','storage_bytes','budget_limit','chunk_index','version','seq','used'}
NULLABLE={'budget_limit','diagnosis_id','last_note','last_status_note'}

def validate_fixture(backup):
    """Validate the complete export without reading or modifying the destination."""
    from backend.domain import RepositoryError
    from backend.snapshots import verify
    def require(condition):
        if not condition:raise RepositoryError('Invalid or incomplete fixture backup; destination unchanged',422)
    require(isinstance(backup,dict))
    version=backup.get('schema_version')
    require(type(version) is int and version in (1,2) and backup.get('synthetic_only') is True)
    def decode(snapshot):
        def unique_object(pairs):
            result={}
            for key,value in pairs:
                if key in result:raise ValueError('Duplicate JSON key')
                result[key]=value
            return result
        def invalid_constant(_):raise ValueError('Invalid JSON constant')
        try:return json.loads(snapshot,object_pairs_hook=unique_object,parse_constant=invalid_constant)
        except (ValueError,TypeError):
            require(False)
    source=backup.get('tables')
    expected=set(TABLES) if version==2 else set(TABLES)-{'snapshot_manifests','snapshot_chunks'}
    require(isinstance(source,dict) and set(source)==expected)
    tables={table:source[table] if table in expected else [] for table in TABLES}
    identities={}
    for table,rows in tables.items():
        require(type(rows) is list)
        keys=set(COLUMNS[table].split());seen=set()
        for row in rows:
            require(isinstance(row,dict) and set(row)==keys)
            for key,value in row.items():
                nullable=key in NULLABLE and (key!='diagnosis_id' or table=='tickets')
                require(value is None and nullable or type(value) is (int if key in INTEGER_FIELDS else str))
            key=(row['diagnosis_id'],row['chunk_index']) if table=='snapshot_chunks' else row['diagnosis_id'] if table=='snapshot_manifests' else row['seq'] if table=='ticket_history' else row['bucket'] if table=='request_budgets' else row['id']
            require(key not in seen);seen.add(key)
            if table in ('equipment','diagnoses','tickets','snapshot_manifests','snapshot_chunks','request_budgets'):
                identity_field='diagnosis_id' if table in ('snapshot_manifests','snapshot_chunks') else 'bucket' if table=='request_budgets' else 'id'
                require(bool(row[identity_field]))
            if table=='tickets':require(row['version']>0 and row['status'] in ('Open','In Progress','Resolved'))
            if table=='ticket_history':require(row['seq']>0)
            if table=='request_budgets':require(row['used']>=0)
            if table=='snapshot_chunks':require(row['chunk_index']>=0)
            if table=='snapshot_manifests':
                require(row['schema_version']==1 and row['format']=='json-ascii-v1')
                require(row['byte_length']>0 and row['chunk_count']>0 and row['storage_bytes']>=row['byte_length'])
                require(row['budget_limit'] is None or row['budget_limit']>=0)
                require(len(row['sha256'])==64 and all(c in '0123456789abcdef' for c in row['sha256']))
        identities[table]=seen
    manifests={row['diagnosis_id']:row for row in tables['snapshot_manifests']}
    grouped={key:[] for key in manifests};markers=set()
    for row in tables['diagnoses']:
        value=decode(row['snapshot'])
        require(isinstance(value,dict))
        if value.get('chunked')==1:
            require(version==2 and value=={'chunked':1} and row['snapshot']=='{"chunked":1}')
            markers.add(row['id'])
        else:require(value.get('id')==row['id'])
    require(markers==set(manifests))
    for row in tables['snapshot_chunks']:
        require(row['diagnosis_id'] in manifests)
        grouped[row['diagnosis_id']].append(row)
    for key,manifest in manifests.items():
        chunks=sorted(grouped[key],key=lambda row:row['chunk_index'])
        verify(manifest,chunks)
        decode(''.join(row['content'] for row in chunks))
    for row in tables['tickets']:
        require(row['equipment_id'] in identities['equipment'])
        require(row['diagnosis_id'] is None or row['diagnosis_id'] in identities['diagnoses'])
    events=set()
    for row in tables['ticket_history']:
        require(row['ticket_id'] in identities['tickets'])
        key=(row['ticket_id'],row['version'],row['kind'])
        require(key not in events);events.add(key)
    # All validated values are immutable scalars. Detach rows/lists before the
    # first await so caller mutation cannot invalidate the preflight result.
    return {table:[dict(row) for row in rows] for table,rows in tables.items()}

async def restore_fixture(binding,backup,*,confirm_disposable=False):
    if not isinstance(binding,BridgeBinding) or not confirm_disposable:raise ValueError('Explicit disposable local restore required')
    tables=validate_fixture(backup)
    if 8+sum(len(rows) for rows in tables.values())>100:
        raise ValueError('Small fixture only; production migration requires a separately reviewed tool')
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
