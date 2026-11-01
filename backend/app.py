"""FastAPI boundary: stateless diagnosis and local durable maintenance records."""
import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from backend.models import Cycle, Sample
from backend.diagnostics import analyze
from backend.maintenance import router, get_repository
from backend.repository import RepositoryError
from backend.limits import BodyLimitMiddleware
from backend.security import DemoWriteLimit


def create_app(database_path=None, *, public_demo=None):
    app = FastAPI(title="MaintainAI Robotics", version="0.2.0")
    app.state.database_path = database_path
    app.add_middleware(BodyLimitMiddleware, max_bytes=2 * 1024 * 1024)
    if public_demo if public_demo is not None else os.environ.get('MAINTAINAI_PUBLIC_DEMO')=='1':
        app.add_middleware(DemoWriteLimit)
    origins=os.environ.get('MAINTAINAI_ALLOWED_ORIGINS','http://localhost:5173,http://127.0.0.1:5173').split(',')
    if any(origin.strip()=='*' for origin in origins):
        raise ValueError('Use explicit allowed origins, not wildcard CORS')
    app.add_middleware(CORSMiddleware, allow_origins=[origin.strip() for origin in origins if origin.strip()], allow_methods=["GET", "POST", "PATCH"], allow_headers=["Content-Type"])

    @app.exception_handler(RequestValidationError)
    async def invalid_payload(_request, exc):
        return JSONResponse(status_code=422, content={"detail": [
            {"loc": e["loc"], "type": e["type"], "msg": e["msg"]} for e in exc.errors()]})

    @app.exception_handler(RepositoryError)
    async def repository_error(_request, exc):
        return JSONResponse(status_code=exc.status,content={"detail":str(exc)})

    @app.get("/api/health")
    def health():
        return {"status":"ok"}

    @app.post("/api/diagnose")
    def diagnose(cycle: Cycle, repository=Depends(get_repository)):
        result=analyze(cycle)
        repository.save_diagnosis(result)
        return result

    app.include_router(router)
    return app

app=create_app()
