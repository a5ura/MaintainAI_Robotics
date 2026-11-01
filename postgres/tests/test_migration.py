import pytest
from backend.domain import RepositoryError

def test_fresh_migration_and_unknown_version_fail_closed(run_pg):
    async def check(repo):
        async with repo.pool.acquire() as c:
            await c.execute('DROP SCHEMA public CASCADE; CREATE SCHEMA public')
        await repo.migrate();await repo.migrate()
        assert len(await repo.list_tickets())==1
        await repo.query('INSERT INTO postgres_schema VALUES(2)')
        try:
            with pytest.raises(RepositoryError):await repo.migrate()
        finally:await repo.query('DELETE FROM postgres_schema WHERE version=2')
        assert len(await repo.list_tickets())==1
    run_pg(check)
