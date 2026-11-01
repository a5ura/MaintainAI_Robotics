"""SQLite adapter; HTTP/rules depend on this boundary, not on a global cycle."""
import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from backend.domain import RepositoryError,now,ticket_identity,check_reuse,prepare_update,seed_records

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
            seed=seed_records()
            for equipment in seed['equipment']:
                db.execute("INSERT OR IGNORE INTO equipment VALUES(?,?,?,?)",equipment)
            if not db.execute('SELECT 1 FROM tickets WHERE id=?',('T-SEED-001',)).fetchone():
                result,stamp=seed['diagnosis'],seed['stamp']
                db.execute('INSERT OR IGNORE INTO diagnoses VALUES(?,?,?)',(result['id'],json.dumps(result),stamp))
                db.execute("INSERT INTO tickets(id,equipment_id,diagnosis_id,title,description,status,resolution_notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)",('T-SEED-001','R-01',result['id'],'Historical grip loss','Seeded synthetic incident with computed diagnostic snapshot.','Resolved',seed['resolution'],stamp,stamp))
                db.executemany('INSERT INTO ticket_history(ticket_id,at,kind,body) VALUES(?,?,?,?)',[
                    ('T-SEED-001',stamp,'created','Open — seeded demonstration incident'),
                    ('T-SEED-001',stamp,'status','Open → Resolved: '+seed['resolution']),
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
            ticket_id=ticket_identity(data);stamp=now()
            existing=db.execute('SELECT * FROM tickets WHERE id=?',(ticket_id,)).fetchone()
            if existing:
                check_reuse(existing,data)
                # The original transaction already committed; retry returns that ticket.
            else:
                db.execute('''INSERT INTO tickets(id,equipment_id,diagnosis_id,title,description,status,created_at,updated_at) VALUES(?,?,?,?,?,'Open',?,?)''',(ticket_id,data['equipment_id'],data.get('diagnosis_id'),data['title'],data['description'],stamp,stamp))
                db.execute('INSERT INTO ticket_history(ticket_id,at,kind,body) VALUES(?,?,?,?)',(ticket_id,stamp,'created','Open — '+data['title']))
        return self.ticket(ticket_id)

    def list_tickets(self,equipment_id=None,after_created=None,after_id=None):
        conditions=[];params=[]
        if equipment_id:conditions.append('equipment_id=?');params.append(equipment_id)
        if after_created is not None:
            conditions.append('(created_at<? OR (created_at=? AND id>?))');params.extend((after_created,after_created,after_id or ''))
        with self.connection() as db:
            return [dict(row) for row in db.execute('SELECT * FROM tickets '+('WHERE '+' AND '.join(conditions)+' ' if conditions else '')+'ORDER BY created_at DESC,id LIMIT 200',params)]

    def history_page(self,ticket_id,after_seq=0):
        with self.connection() as db:
            rows=[dict(row) for row in db.execute('SELECT * FROM ticket_history WHERE ticket_id=? AND seq>? ORDER BY seq LIMIT 201',(ticket_id,after_seq))]
            return {'history':rows[:200],'next_seq':rows[199]['seq'] if len(rows)>200 else None}

    def ticket(self,ticket_id):
        with self.connection() as db:
            row=db.execute('SELECT * FROM tickets WHERE id=?',(ticket_id,)).fetchone()
            if row is None: raise RepositoryError('Ticket not found',404)
            diagnosis=db.execute('SELECT snapshot FROM diagnoses WHERE id=?',(row['diagnosis_id'],)).fetchone() if row['diagnosis_id'] else None
            history=[dict(h) for h in db.execute('SELECT * FROM ticket_history WHERE ticket_id=? ORDER BY seq LIMIT 201',(ticket_id,))]
            detail={'ticket':dict(row),'diagnosis':json.loads(diagnosis['snapshot']) if diagnosis else None,'history':history[:200]}
            if len(history)>200:detail['history_next_seq']=history[199]['seq']
            return detail

    def update_ticket(self,ticket_id,data):
        with self.connection(write=True) as db:
            row=db.execute('SELECT * FROM tickets WHERE id=?',(ticket_id,)).fetchone()
            if row is None: raise RepositoryError('Ticket not found',404)
            update=prepare_update(row,data)
            db.execute('UPDATE tickets SET status=?,resolution_notes=?,version=version+1,updated_at=? WHERE id=?',(update['status'],update['resolution_notes'],update['at'],ticket_id))
            for kind,body in [('status',update['status_event']),('note',update['note'])]:
                if body:db.execute('INSERT INTO ticket_history(ticket_id,at,kind,body) VALUES(?,?,?,?)',(ticket_id,update['at'],kind,body))
        return self.ticket(ticket_id)
