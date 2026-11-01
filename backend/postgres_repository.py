"""Native async PostgreSQL adapter. No SQLite or D1 transport fallback."""
from pathlib import Path
from backend.async_repository import AsyncMaintenanceRepository
from backend.domain import RepositoryError

def parameters(sql):
    # Only fixed internal queries use '?' placeholders; HTTP input is always
    # passed as separate values, never as SQL or identifiers.
    return sql.replace('?', '%s')

class PostgresRepository(AsyncMaintenanceRepository):
    def __init__(self,pool,*,protect_seed=True,daily_snapshot_bytes=67108864):
        self.pool=pool;self.protect_seed=protect_seed;self.daily_snapshot_bytes=daily_snapshot_bytes
    async def query(self,sql,params=()):
        try:
            async with self.pool.acquire(timeout=5) as connection:
                return [dict(row) for row in await connection.fetch(parameters(sql),*params)]
        except Exception as exc:raise RepositoryError('Database unavailable; retry later',503) from exc
    async def batch(self,statements):
        try:
            async with self.pool.acquire(timeout=5) as connection:
                # READ COMMITTED writes + constraints/conditional updates; a
                # read-only detail batch uses REPEATABLE READ for one snapshot.
                readonly=all(sql.lstrip().upper().startswith('SELECT') for sql,_ in statements)
                async with connection.transaction(isolation='repeatable_read' if readonly else 'read_committed'):
                    results=[]
                    for sql,params in statements:
                        rows=await connection.fetch(parameters(sql),*params)
                        results.append({'results':[dict(row) for row in rows]})
                    return results
        except Exception as exc:raise RepositoryError('Database transaction failed; no partial mutation accepted',503) from exc
    async def check_schema(self):
        rows=await self.query('SELECT MAX(version) AS version FROM postgres_schema')
        if not rows or rows[0]['version']!=1:raise RepositoryError('Unsupported PostgreSQL schema version',503)
    async def migrate(self):
        # Explicit operator-only migration; concurrent invocations serialized in DB.
        async with self.pool.acquire(timeout=5) as connection:
            async with connection.transaction():
                await connection.execute('SELECT pg_advisory_xact_lock(726341002)')
                exists=await connection.fetchval("SELECT to_regclass('postgres_schema')")
                if exists is None:
                    await connection.execute((Path(__file__).parents[1]/'postgres/migrations/0001_maintenance.sql').read_text())
                else:
                    version=await connection.fetchval('SELECT MAX(version) FROM postgres_schema')
                    if version!=1:raise RepositoryError('Unsupported PostgreSQL schema version',503)
        await self.initialize()
