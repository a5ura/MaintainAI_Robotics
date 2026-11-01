from uuid import UUID
from typing import Literal
from pydantic import BaseModel,Field,ConfigDict

class TicketCreate(BaseModel):
    model_config=ConfigDict(str_strip_whitespace=True)
    request_id: UUID | None = None
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
