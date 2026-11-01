"""Small Psycopg async-pool facade used by explicit repository transactions."""
from contextlib import asynccontextmanager
from urllib.parse import urlsplit
from psycopg.conninfo import conninfo_to_dict
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

def connection_options(url):
    parsed=urlsplit(url)
    if parsed.scheme not in ('postgres','postgresql') or not parsed.hostname:raise ValueError('Invalid PostgreSQL URL')
    # Preserve channel_binding=require and enforce certificate/hostname checks
    # for remote connections. Loopback-only disposable tests need no TLS.
    local=parsed.hostname in ('localhost','127.0.0.1')
    options=conninfo_to_dict(url,sslmode='disable' if local else 'verify-full',connect_timeout='5')
    if not local:options.setdefault('sslrootcert','system')
    return options

class Connection:
    def __init__(self,raw):self.raw=raw
    async def fetch(self,sql,*params):
        async with self.raw.cursor() as cursor:
            await cursor.execute(sql,params or None,prepare=False)
            return await cursor.fetchall() if cursor.description else []
    async def execute(self,sql,*params):return await self.fetch(sql,*params)
    async def fetchval(self,sql,*params):
        rows=await self.fetch(sql,*params)
        return next(iter(rows[0].values())) if rows else None
    @asynccontextmanager
    async def transaction(self,isolation='read_committed',readonly=False):
        levels={'read_committed':'READ COMMITTED','repeatable_read':'REPEATABLE READ'}
        async with self.raw.transaction():
            await self.raw.execute('SET TRANSACTION ISOLATION LEVEL '+levels[isolation]+(' READ ONLY' if readonly else ''))
            yield

class Pool:
    def __init__(self,raw):self.raw=raw
    @asynccontextmanager
    async def acquire(self,timeout=5):
        async with self.raw.connection(timeout=timeout) as connection:
            yield Connection(connection)
    async def close(self):await self.raw.close(timeout=5)

async def create_pool(url,maximum=4,wait=False):
    if not 1<=maximum<=8:raise ValueError('Pool bound must be 1..8')
    options=connection_options(url)
    pool=AsyncConnectionPool(conninfo='',kwargs={**options,'autocommit':True,'row_factory':dict_row,'prepare_threshold':None},min_size=1 if wait else 0,max_size=maximum,max_waiting=20,timeout=5,max_idle=60,reconnect_timeout=10,open=False,configure=configure)
    await pool.open(wait=wait,timeout=10)
    return Pool(pool)

async def configure(connection):
    await connection.execute("SET statement_timeout='15s'")
    await connection.execute("SET lock_timeout='5s'")
