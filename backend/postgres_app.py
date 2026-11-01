"""Native PostgreSQL hosting entry point; explicit configuration, no fallback."""
import os
import asyncio
from contextlib import asynccontextmanager
from urllib.parse import urlsplit
from fastapi import Request
from starlette.responses import JSONResponse
from backend.http_api import build_app
from backend.domain import RepositoryError
from backend.postgres_repository import PostgresRepository

class PostgresPolicy:
    def __init__(self,app):self.app=app
    async def __call__(self,scope,receive,send):
        if scope['type']!='http' or not scope['path'].startswith('/api/') or scope['path'] in ('/api/health','/api/ready'):
            return await self.app(scope,receive,send)
        # Resource admission only; cross-process correctness remains in SQL.
        async with scope['app'].state.admission:
            owner=scope['app'];settings=owner.state.settings
            try:
                write=scope['method'] in ('POST','PATCH','PUT','DELETE')
                if write and settings['readonly']:raise RepositoryError('Demo is temporarily read-only',503)
                repo=PostgresRepository(owner.state.pg_pool,daily_snapshot_bytes=settings['bytes'])
                await repo.check_schema()
                await repo.reserve('requests',settings['requests'])
                if write:
                    await repo.reserve('writes',settings['writes'])
                    size=(await repo.query('SELECT pg_database_size(current_database()) AS bytes'))[0]['bytes']
                    if size>=settings['capacity']:raise RepositoryError('Demo storage capacity reached; writes temporarily unavailable',503)
                scope['postgres_repository']=repo
            except RepositoryError as exc:
                headers={'Retry-After':'3600'} if exc.status==429 else {}
                return await JSONResponse({'detail':str(exc)},status_code=exc.status,headers=headers)(scope,receive,send)
            return await self.app(scope,receive,send)
async def get_repository(request:Request):
    repo=request.scope.get('postgres_repository')
    if repo is None:raise RepositoryError('Database policy unavailable; no local fallback',503)
    return repo

def create_app():
    url=os.environ.get('DATABASE_URL')
    if not url:raise RuntimeError('DATABASE_URL is required for PostgreSQL; no SQLite fallback')
    parsed=urlsplit(url)
    if parsed.scheme not in ('postgres','postgresql') or not parsed.hostname:raise RuntimeError('Invalid database configuration')
    origins=[v.strip() for v in os.environ.get('MAINTAINAI_ALLOWED_ORIGINS','http://localhost:5173,http://127.0.0.1:5173').split(',') if v.strip()]
    if os.environ.get('MAINTAINAI_HOSTED')=='1' and (not origins or any(not v.startswith('https://') for v in origins)):
        raise RuntimeError('Hosted origins must be explicit HTTPS origins')
    maximum=int(os.environ.get('PG_POOL_MAX','4'))
    if not 1<=maximum<=8:raise RuntimeError('PG_POOL_MAX must be between 1 and 8')
    app=build_app(get_repository,origins,request_policy=PostgresPolicy)
    app.state.settings=dict(readonly=os.environ.get('DEMO_READONLY')=='1',requests=int(os.environ.get('DEMO_DAILY_REQUESTS','2000')),writes=int(os.environ.get('DEMO_DAILY_WRITES','250')),bytes=int(os.environ.get('DEMO_DAILY_SNAPSHOT_BYTES','67108864')),capacity=int(os.environ.get('DEMO_MAX_DATABASE_BYTES','536870912')))
    @asynccontextmanager
    async def lifespan(_app):
        from postgres.driver import create_pool
        try:
            app.state.pg_pool=await create_pool(url,maximum)
        except Exception:raise RuntimeError('Database pool configuration failed') from None
        app.state.admission=asyncio.Semaphore(1)
        try:yield
        finally:await app.state.pg_pool.close()
    app.router.lifespan_context=lifespan
    @app.get('/api/ready')
    async def ready():
        try:await PostgresRepository(app.state.pg_pool).check_schema()
        except RepositoryError:return JSONResponse({'status':'unavailable'},status_code=503)
        return {'status':'ready'}
    static=os.environ.get('MAINTAINAI_STATIC_DIR')
    if static:
        from pathlib import Path
        from fastapi.responses import FileResponse
        root=Path(static).resolve()
        if not (root/'index.html').is_file():raise RuntimeError('Frontend build missing')
        @app.get('/{path:path}')
        async def frontend(path:str):
            if path=='api' or path.startswith('api/'):return JSONResponse({'detail':'Not found'},status_code=404)
            target=(root/path).resolve()
            if not target.is_relative_to(root):return JSONResponse({'detail':'Not found'},status_code=404)
            return FileResponse(target if target.is_file() else root/'index.html')
    return app
