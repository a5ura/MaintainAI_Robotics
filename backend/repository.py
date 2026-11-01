"""SQLite adapter; HTTP/rules depend on this boundary, not on a global cycle."""
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4, uuid5, NAMESPACE_URL

class RepositoryError(Exception):
    def __init__(self, message, status=400): super().__init__(message);self.status=status

def now(): return datetime.now(timezone.utc).isoformat(timespec='microseconds')

class Repository:
    def __init__(self, path):
        self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True)
        self.initialize()

    @contextmanager
    def connection(self, write=False):
        db=sqlite3.connect(self.path,timeout=5)
        db.row_factory=sqlite3.Row
        db.execute('PRAGMA foreign_keys=ON')
        try:
            if write: db.execute('BEGIN IMMEDIATE')
            yield db
            if write: db.commit()
        except sqlite3.OperationalError as exc:
            db.rollback()
            if 'locked' in str(exc).lower(): raise RepositoryError('Database busy; reload and retry.',503) from exc
            raise
        except Exception:
            db.rollback();raise
        finally: db.close()

    def initialize(self):
        with self.connection(write=True) as db:
            version=db.execute('PRAGMA user_version').fetchone()[0]
            if version>1: raise RepositoryError('Unsupported database schema version',503)
            # Execute individual DDL statements inside the transaction; executescript
            # would implicitly commit and weaken atomic schema/seed initialization.
            schema=[
                '''CREATE TABLE IF NOT EXISTS equipment(id TEXT PRIMARY KEY,name TEXT NOT NULL,description TEXT NOT NULL,status TEXT NOT NULL)''',
                '''CREATE TABLE IF NOT EXISTS diagnoses(id TEXT PRIMARY KEY,snapshot TEXT NOT NULL,created_at TEXT NOT NULL)''',
                '''CREATE TABLE IF NOT EXISTS tickets(id TEXT PRIMARY KEY,equipment_id TEXT NOT NULL REFERENCES equipment(id),diagnosis_id TEXT REFERENCES diagnoses(id),title TEXT NOT NULL,description TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('Open','In Progress','Resolved')),resolution_notes TEXT NOT NULL DEFAULT '',version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),created_at TEXT NOT NULL,updated_at TEXT NOT NULL)''',
                '''CREATE TABLE IF NOT EXISTS ticket_history(seq INTEGER PRIMARY KEY AUTOINCREMENT,ticket_id TEXT NOT NULL REFERENCES tickets(id),at TEXT NOT NULL,kind TEXT NOT NULL,body TEXT NOT NULL)''',
                '''CREATE INDEX IF NOT EXISTS ticket_history_ticket ON ticket_history(ticket_id,seq)''',
            ]
            for sql in schema: db.execute(sql)
            db.execute("INSERT OR IGNORE INTO equipment VALUES(?,?,?,?)",('R-01','Robot R-01','3-axis pick-and-place demonstrator','Operational'))
            db.execute("INSERT OR IGNORE INTO equipment VALUES(?,?,?,?)",('CELL-01','Workcell 01','Source fixture, target fixture and verification sensors','Operational'))
            if not db.execute('SELECT 1 FROM tickets WHERE id=?',('T-SEED-001',)).fetchone():
                from backend.diagnostics import analyze
                from backend.models import Cycle
                rows=[(0,'pre-pick',False,False,0,'source'),(3,'post-pick',True,True,65,'held'),(6,'transport',True,False,12,None),(9,'pre-place',True,False,12,'missing'),(12,'post-place',False,False,0,'missing')]
                result=analyze(Cycle(samples=[dict(t=t,phase=p,grip_command=g,object_present=o,pressure_kpa=v,verification=c,tcp=[2.7,.28,0],joints=[0,0,0]) for t,p,g,o,v,c in rows]))
                stamp='2026-10-30T12:00:00+00:00'
                db.execute('INSERT OR IGNORE INTO diagnoses VALUES(?,?,?)',(result['id'],json.dumps(result),stamp))
                db.execute('''INSERT INTO tickets(id,equipment_id,diagnosis_id,title,description,status,resolution_notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)''',('T-SEED-001','R-01',result['id'],'Historical grip loss','Seeded synthetic incident with computed diagnostic snapshot.','Resolved','Cup seal inspected and replaced; hold test passed.',stamp,stamp))
                db.executemany('INSERT INTO ticket_history(ticket_id,at,kind,body) VALUES(?,?,?,?)',[
                    ('T-SEED-001',stamp,'created','Open — seeded demonstration incident'),
                    ('T-SEED-001',stamp,'status','Open → Resolved: Cup seal inspected and replaced; hold test passed.'),
                ])
            db.execute('PRAGMA user_version=1')

    def equipment(self):
        with self.connection() as db:
            return [dict(row) for row in db.execute('''SELECT e.*,COUNT(t.id) AS ticket_count FROM equipment e LEFT JOIN tickets t ON t.equipment_id=e.id GROUP BY e.id ORDER BY e.id''')]

    def save_diagnosis(self, result):
        with self.connection(write=True) as db:
            db.execute('INSERT OR IGNORE INTO diagnoses VALUES(?,?,?)',(result['id'],json.dumps(result,allow_nan=False),now()))

    def create_ticket(self, data):
        with self.connection(write=True) as db:
            if not db.execute('SELECT 1 FROM equipment WHERE id=?',(data['equipment_id'],)).fetchone(): raise RepositoryError('Equipment not found',404)
            if data.get('diagnosis_id') and not db.execute('SELECT 1 FROM diagnoses WHERE id=?',(data['diagnosis_id'],)).fetchone(): raise RepositoryError('Diagnosis not found',404)
            ticket_id='T-'+(uuid5(NAMESPACE_URL,str(data['request_id'])).hex if data.get('request_id') else uuid4().hex[:16]);stamp=now()
            existing=db.execute('SELECT * FROM tickets WHERE id=?',(ticket_id,)).fetchone()
            if existing:
                if any(existing[key]!=data.get(key) for key in ('equipment_id','diagnosis_id','title','description')):
                    raise RepositoryError('Request ID already used for different ticket content',409)
                # The original transaction already committed; retry returns that ticket.
            else:
                db.execute('''INSERT INTO tickets(id,equipment_id,diagnosis_id,title,description,status,created_at,updated_at) VALUES(?,?,?,?,?,'Open',?,?)''',(ticket_id,data['equipment_id'],data.get('diagnosis_id'),data['title'],data['description'],stamp,stamp))
                db.execute('INSERT INTO ticket_history(ticket_id,at,kind,body) VALUES(?,?,?,?)',(ticket_id,stamp,'created','Open — '+data['title']))
        return self.ticket(ticket_id)

    def list_tickets(self, equipment_id=None):
        with self.connection() as db:
            return [dict(row) for row in db.execute('SELECT * FROM tickets WHERE (? IS NULL OR equipment_id=?) ORDER BY created_at DESC,id LIMIT 200',(equipment_id,equipment_id))]

    def ticket(self,ticket_id):
        with self.connection() as db:
            row=db.execute('SELECT * FROM tickets WHERE id=?',(ticket_id,)).fetchone()
            if row is None: raise RepositoryError('Ticket not found',404)
            diagnosis=db.execute('SELECT snapshot FROM diagnoses WHERE id=?',(row['diagnosis_id'],)).fetchone() if row['diagnosis_id'] else None
            history=[dict(h) for h in db.execute('SELECT * FROM ticket_history WHERE ticket_id=? ORDER BY seq',(ticket_id,))]
            return {'ticket':dict(row),'diagnosis':json.loads(diagnosis['snapshot']) if diagnosis else None,'history':history}

    def update_ticket(self,ticket_id,data):
        with self.connection(write=True) as db:
            row=db.execute('SELECT * FROM tickets WHERE id=?',(ticket_id,)).fetchone()
            if row is None: raise RepositoryError('Ticket not found',404)
            if row['version']!=data['expected_version']: raise RepositoryError('Ticket changed in another session. Reload before updating.',409)
            status=data.get('status') or row['status']
            transitions={'Open':{'In Progress','Resolved'},'In Progress':{'Open','Resolved'},'Resolved':{'Open'}}
            if status!=row['status'] and status not in transitions[row['status']]: raise RepositoryError('Invalid status transition',422)
            if status=='Resolved' and status!=row['status'] and not data.get('resolution_notes'): raise RepositoryError('Resolution notes required',422)
            if status==row['status'] and not data.get('note'): raise RepositoryError('Provide a note or a status change',422)
            stamp=now();resolution=data.get('resolution_notes') if status=='Resolved' else row['resolution_notes']
            db.execute('UPDATE tickets SET status=?,resolution_notes=?,version=version+1,updated_at=? WHERE id=?',(status,resolution or row['resolution_notes'],stamp,ticket_id))
            if status!=row['status']:
                db.execute('INSERT INTO ticket_history(ticket_id,at,kind,body) VALUES(?,?,?,?)',(ticket_id,stamp,'status',row['status']+' → '+status+(': '+data['resolution_notes'] if data.get('resolution_notes') else '')))
            if data.get('note'):
                db.execute('INSERT INTO ticket_history(ticket_id,at,kind,body) VALUES(?,?,?,?)',(ticket_id,stamp,'note',data['note']))
        return self.ticket(ticket_id)
