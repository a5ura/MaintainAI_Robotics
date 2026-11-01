"""Workers ASGI application; binding required, no local-file fallback."""
from fastapi import Request
from starlette.responses import JSONResponse
from backend.d1_repository import D1Repository
from backend.domain import RepositoryError
from backend.http_api import build_app

def setting(env,name,default):
    value=getattr(env,name,default)
    return default if value is None else value

class WorkerPolicy:
    def __init__(self,app):self.app=app
    async def __call__(self,scope,receive,send):
        if scope['type']!='http' or not scope['path'].startswith('/api/') or scope['path']=='/api/health':
            return await self.app(scope,receive,send)
        try:
            env=scope.get('env')
            if env is None or getattr(env,'DB',None) is None:raise RepositoryError('D1 binding unavailable; no local fallback',503)
            write=scope['method'] in ('POST','PATCH','PUT','DELETE')
            if write and str(setting(env,'DEMO_READONLY','0'))=='1':raise RepositoryError('Demo is temporarily read-only',503)
            repo=D1Repository(env.DB,daily_snapshot_bytes=int(setting(env,'DEMO_DAILY_SNAPSHOT_BYTES',67108864)))
            await repo.check_schema()
            await repo.reserve('requests',int(setting(env,'DEMO_DAILY_REQUESTS',2000)))
            if write:await repo.reserve('writes',int(setting(env,'DEMO_DAILY_WRITES',250)))
            scope['phase_a_repository']=repo
        except (ValueError,TypeError):
            return await JSONResponse({'detail':'Invalid demo policy configuration'},status_code=503)(scope,receive,send)
        except RepositoryError as exc:
            headers={'Retry-After':'3600'} if exc.status==429 else {}
            return await JSONResponse({'detail':str(exc)},status_code=exc.status,headers=headers)(scope,receive,send)
        return await self.app(scope,receive,send)

async def get_d1_repository(request:Request):
    repo=request.scope.get('phase_a_repository')
    if repo is None:raise RepositoryError('D1 policy/binding unavailable; no local fallback',503)
    return repo

def create_worker_app():
    app=build_app(get_d1_repository)
    app.add_middleware(WorkerPolicy)
    return app
