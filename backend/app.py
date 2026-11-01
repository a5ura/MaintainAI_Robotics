"""Native development entry point; preserves SQLite configuration and tools."""
import os
from backend.models import Sample,Cycle
from backend.domain import RepositoryError
from backend.maintenance import get_repository
from backend.http_api import build_app

def create_app(database_path=None,*,public_demo=None):
    enabled=public_demo if public_demo is not None else os.environ.get('MAINTAINAI_PUBLIC_DEMO')=='1'
    origins=[s.strip() for s in os.environ.get('MAINTAINAI_ALLOWED_ORIGINS','http://localhost:5173,http://127.0.0.1:5173').split(',') if s.strip()]
    app=build_app(get_repository,origins,local_write_limit=enabled)
    app.state.database_path=database_path
    return app
app=create_app()
