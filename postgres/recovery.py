"""Protected, synthetic local PostgreSQL export/restore. No public route."""
from cloudflare.local_recovery import TABLES,validate_fixture
from backend.domain import RepositoryError

async def require_disposable(repo):
    # Operations are intentionally restricted to the known disposable DB name.
    name=(await repo.query('SELECT current_database() AS name'))[0]['name']
    if not name.endswith('_test'):raise ValueError('Disposable *_test database required')

async def export_fixture(repo):
    await require_disposable(repo)
    async with repo.pool.acquire() as connection:
        async with connection.transaction(isolation='repeatable_read',readonly=True):
            tables={}
            for table in TABLES:
                order='seq' if table=='ticket_history' else 'bucket' if table=='request_budgets' else 'diagnosis_id,chunk_index' if table=='snapshot_chunks' else 'diagnosis_id' if table=='snapshot_manifests' else 'id'
                rows=[dict(row) for row in await connection.fetch(f'SELECT * FROM {table} ORDER BY {order} LIMIT 101')]
                if len(rows)>100:raise ValueError('Fixture export limit exceeded; use protected native PostgreSQL backup tooling')
                tables[table]=rows
    result=dict(schema_version=2,synthetic_only=True,tables=tables)
    validate_fixture(result)
    return result

async def restore_fixture(repo,backup,*,confirm_disposable=False):
    if not confirm_disposable:raise ValueError('Explicit disposable restore confirmation required')
    tables=validate_fixture(backup) # Complete fail-closed validation before DB access.
    if sum(map(len,tables.values()))>500:raise ValueError('Fixture restore too large')
    await require_disposable(repo)
    try:
        async with repo.pool.acquire() as connection:
            async with connection.transaction():
                # Block all fixture writers/readers during replacement; no local lock.
                await connection.execute('LOCK TABLE '+','.join(TABLES)+',equipment_ticket_counts IN ACCESS EXCLUSIVE MODE')
                await connection.execute('ALTER TABLE snapshot_manifests DISABLE TRIGGER manifest_budget')
                await connection.execute('DELETE FROM ticket_history; DELETE FROM tickets; DELETE FROM diagnoses; DELETE FROM equipment; DELETE FROM request_budgets')
                for table in TABLES:
                    if table=='ticket_history':await connection.execute('DELETE FROM ticket_history')
                    for row in tables[table]:
                        cols=list(row)
                        await connection.execute(f'INSERT INTO {table}({",".join(cols)}) VALUES({",".join("%s" for _ in cols)})',*row.values())
                await connection.execute('ALTER TABLE snapshot_manifests ENABLE TRIGGER manifest_budget')
                # Explicit restored history IDs must not collide with future events.
                next_seq=await connection.fetchval('SELECT COALESCE(MAX(seq),0)+1 FROM ticket_history')
                await connection.execute(f'ALTER TABLE ticket_history ALTER COLUMN seq RESTART WITH {int(next_seq)}')
    except Exception as exc:raise RepositoryError('Fixture restore failed; destination unchanged',503) from exc
