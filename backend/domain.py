"""Shared maintenance semantics; no database, filesystem or platform imports."""
from datetime import datetime, timezone
from uuid import uuid4,uuid5,NAMESPACE_URL
from functools import lru_cache

class RepositoryError(Exception):
    def __init__(self,message,status=400):super().__init__(message);self.status=status

def now():return datetime.now(timezone.utc).isoformat(timespec='microseconds')
def ticket_identity(data):return 'T-'+(uuid5(NAMESPACE_URL,str(data['request_id'])).hex if data.get('request_id') else uuid4().hex[:16])
def check_reuse(existing,data):
    if any(existing[key]!=data.get(key) for key in ('equipment_id','diagnosis_id','title','description')):
        raise RepositoryError('Request ID already used for different ticket content',409)

def prepare_update(row,data):
    if row['version']!=data['expected_version']:raise RepositoryError('Ticket changed in another session. Reload before updating.',409)
    status=data.get('status') or row['status']
    transitions={'Open':{'In Progress','Resolved'},'In Progress':{'Open','Resolved'},'Resolved':{'Open'}}
    if status!=row['status'] and status not in transitions[row['status']]:raise RepositoryError('Invalid status transition',422)
    if status=='Resolved' and status!=row['status'] and not data.get('resolution_notes'):raise RepositoryError('Resolution notes required',422)
    if status==row['status'] and not data.get('note'):raise RepositoryError('Provide a note or a status change',422)
    resolution=data.get('resolution_notes') if status=='Resolved' else row['resolution_notes']
    status_event=row['status']+' → '+status+(': '+data['resolution_notes'] if data.get('resolution_notes') else '') if status!=row['status'] else None
    return dict(status=status,resolution_notes=resolution or row['resolution_notes'],status_event=status_event,note=data.get('note'),at=now())

@lru_cache(maxsize=1)
def seed_records():
    from backend.diagnostics import analyze
    from backend.models import Cycle
    rows=[(0,'pre-pick',False,False,0,'source'),(3,'post-pick',True,True,65,'held'),(6,'transport',True,False,12,None),(9,'pre-place',True,False,12,'missing'),(12,'post-place',False,False,0,'missing')]
    diagnosis=analyze(Cycle(samples=[dict(t=t,phase=p,grip_command=g,object_present=o,pressure_kpa=v,verification=c,tcp=[2.7,.28,0],joints=[0,0,0]) for t,p,g,o,v,c in rows]))
    return dict(equipment=[('R-01','Robot R-01','3-axis pick-and-place demonstrator','Operational'),('CELL-01','Workcell 01','Source fixture, target fixture and verification sensors','Operational')],diagnosis=diagnosis,stamp='2026-10-30T12:00:00+00:00',resolution='Cup seal inspected and replaced; hold test passed.')
