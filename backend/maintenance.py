import os
from pathlib import Path
from typing import Literal
from fastapi import APIRouter, Depends, Request, Query
from pydantic import BaseModel, Field, ConfigDict
from backend.repository import Repository

DEFAULT_DATABASE=Path(__file__).resolve().parents[1]/'data'/'maintainai.sqlite3'
def get_repository(request: Request):
    return Repository(request.app.state.database_path or os.environ.get('MAINTAINAI_DB_PATH',DEFAULT_DATABASE))

class TicketCreate(BaseModel):
    model_config=ConfigDict(str_strip_whitespace=True)
    equipment_id: str = Field(min_length=1,max_length=80)
    diagnosis_id: str | None = Field(default=None,min_length=1,max_length=80)
    title: str = Field(min_length=1,max_length=120)
    description: str = Field(default='',max_length=4000)

class TicketUpdate(BaseModel):
    model_config=ConfigDict(str_strip_whitespace=True)
    expected_version: int = Field(ge=1)
    status: Literal['Open','In Progress','Resolved'] | None = None
    note: str | None = Field(default=None,min_length=1,max_length=2000)
    resolution_notes: str | None = Field(default=None,min_length=1,max_length=2000)

router=APIRouter(prefix='/api')
@router.get('/equipment')
def equipment(repository=Depends(get_repository)): return repository.equipment()
@router.get('/tickets')
def tickets(equipment_id: str | None=Query(default=None,max_length=80),repository=Depends(get_repository)): return repository.list_tickets(equipment_id)
@router.post('/tickets',status_code=201)
def create_ticket(data:TicketCreate,repository=Depends(get_repository)): return repository.create_ticket(data.model_dump())
@router.get('/tickets/{ticket_id}')
def ticket(ticket_id:str,repository=Depends(get_repository)): return repository.ticket(ticket_id)
@router.patch('/tickets/{ticket_id}')
def update_ticket(ticket_id:str,data:TicketUpdate,repository=Depends(get_repository)): return repository.update_ticket(ticket_id,data.model_dump())
