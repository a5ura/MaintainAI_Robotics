"""One async HTTP contract for native SQLite and Workers D1 adapters."""
import inspect
from fastapi import FastAPI,Depends,Query
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.domain import RepositoryError
from backend.ticket_models import TicketCreate,TicketUpdate
from backend.models import Cycle
from backend.diagnostics import analyze
from backend.limits import BodyLimitMiddleware

async def call_repository(repository,method,*args):
    function=getattr(repository,method)
    if inspect.iscoroutinefunction(function):return await function(*args)
    # Native SQLite only. D1 methods are async and never enter this branch.
    from starlette.concurrency import run_in_threadpool
    return await run_in_threadpool(function,*args)

def build_app(get_repository,origins=('http://localhost:5173','http://127.0.0.1:5173'),local_write_limit=False):
    if '*' in origins:raise ValueError('Use explicit allowed origins, not wildcard CORS')
    app=FastAPI(title='MaintainAI Robotics',version='0.2.0')
    app.add_middleware(BodyLimitMiddleware,max_bytes=2*1024*1024)
    if local_write_limit:
        from backend.security import DemoWriteLimit
        app.add_middleware(DemoWriteLimit)
    app.add_middleware(CORSMiddleware,allow_origins=list(origins),allow_methods=['GET','POST','PATCH'],allow_headers=['Content-Type'])
    @app.exception_handler(RequestValidationError)
    async def invalid_payload(_request,exc):
        return JSONResponse(status_code=422,content={'detail':[{'loc':e['loc'],'type':e['type'],'msg':e['msg']} for e in exc.errors()]})
    @app.exception_handler(RepositoryError)
    async def repository_error(_request,exc):return JSONResponse(status_code=exc.status,content={'detail':str(exc)})
    @app.get('/api/health')
    async def health():return {'status':'ok'}
    @app.post('/api/diagnose')
    async def diagnose(cycle:Cycle,repository=Depends(get_repository)):
        result=analyze(cycle);await call_repository(repository,'save_diagnosis',result);return result
    @app.get('/api/equipment')
    async def equipment(repository=Depends(get_repository)):return await call_repository(repository,'equipment')
    @app.get('/api/tickets')
    async def tickets(equipment_id:str|None=Query(default=None,max_length=80),repository=Depends(get_repository)):
        return await call_repository(repository,'list_tickets',equipment_id)
    @app.post('/api/tickets',status_code=201)
    async def create_ticket(data:TicketCreate,repository=Depends(get_repository)):
        return await call_repository(repository,'create_ticket',data.model_dump())
    @app.get('/api/tickets/{ticket_id}')
    async def ticket(ticket_id:str,repository=Depends(get_repository)):
        return await call_repository(repository,'ticket',ticket_id)
    @app.patch('/api/tickets/{ticket_id}')
    async def update_ticket(ticket_id:str,data:TicketUpdate,repository=Depends(get_repository)):
        return await call_repository(repository,'update_ticket',ticket_id,data.model_dump())
    return app
