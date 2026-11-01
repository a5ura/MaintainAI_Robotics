"""Local SQLite dependency; never imported by the Workers entry point."""
import os
from pathlib import Path
from fastapi import Request
from backend.repository import Repository
from backend.ticket_models import TicketCreate,TicketUpdate

DEFAULT_DATABASE=Path(__file__).resolve().parents[1]/'data'/'maintainai.sqlite3'
def get_repository(request:Request):
    return Repository(request.app.state.database_path or os.environ.get('MAINTAINAI_DB_PATH',DEFAULT_DATABASE))
