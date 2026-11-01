import asyncio
import pytest
from postgres.local import test_url,pool_for
from backend.postgres_repository import PostgresRepository

@pytest.fixture
def run_pg():
    def run(check):
        async def scenario():
            pool=await pool_for(test_url())
            repo=PostgresRepository(pool)
            try:
                await repo.migrate()
                async with pool.acquire() as c:
                    await c.execute('TRUNCATE ticket_history,tickets,diagnoses,equipment,request_budgets RESTART IDENTITY CASCADE')
                await repo.initialize()
                await check(repo)
            finally:await pool.close()
        return asyncio.run(scenario())
    return run
