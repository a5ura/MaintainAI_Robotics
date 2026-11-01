"""Explicit operator commands. Local tests require a loopback *_test database."""
import asyncio
import os
from urllib.parse import urlsplit
from backend.postgres_repository import PostgresRepository

TEST_URL='postgresql://postgres@127.0.0.1:55432/maintainai_b0_test'

def test_url():
    value=os.environ.get('POSTGRES_TEST_URL',TEST_URL);parsed=urlsplit(value)
    if parsed.hostname not in ('localhost','127.0.0.1') or not parsed.path.endswith('_test'):
        raise ValueError('Disposable loopback *_test database required')
    return value

async def pool_for(url,maximum=4):
    from postgres.driver import create_pool
    return await create_pool(url,maximum,wait=True)

async def main():
    url=os.environ.get('DATABASE_URL')
    if not url:raise SystemExit('DATABASE_URL is required; no SQLite fallback')
    pool=await pool_for(url)
    try:await PostgresRepository(pool).migrate()
    finally:await pool.close()
if __name__=='__main__':asyncio.run(main())
