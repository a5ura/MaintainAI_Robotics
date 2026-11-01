"""Async D1 binding adapter. No sqlite3, filesystem, implicit seed or fallback.

A mutation and its history commit as one statement via database triggers. Shared
Python domain rules are validated before a conditional versioned UPDATE.
"""
import json
import hashlib
from backend.snapshots import serialize,verify,CHUNK_BYTES
from backend.domain import RepositoryError,now,ticket_identity,check_reuse,prepare_update,seed_records

TICKET_COLUMNS='id,equipment_id,diagnosis_id,title,description,status,resolution_notes,version,created_at,updated_at'

def native(value):
    if isinstance(value,(dict,list)):
        return value
    # D1 results contain JSON values; stringify handles nested plain JS objects
    # without relying on JsProxy.to_py() default conversion semantics.
    from js import JSON
    return json.loads(JSON.stringify(value))

def binding_array(statements):
    try:
        from pyodide.ffi import to_js
    except ImportError:
        return statements  # CPython-only local transport
    return to_js(statements)

class D1Repository:
    def __init__(self,binding,*,protect_seed=True,daily_snapshot_bytes=None):
        if binding is None:raise RepositoryError('D1 binding unavailable; no local fallback',503)
        self.binding=binding;self.protect_seed=protect_seed;self.daily_snapshot_bytes=daily_snapshot_bytes

    def statement(self,sql,params=()):return self.binding.prepare(sql).bind(*params)
    async def query(self,sql,params=()):
        try:
            result=native(await self.statement(sql,params).all())
            if result.get('success') is False:raise RuntimeError('D1 query failed')
            return result.get('results',[])
        except RepositoryError:raise
        except Exception as exc:raise RepositoryError('D1 unavailable or storage quota exhausted; retry later',503) from exc

    async def batch(self,statements):
        try:
            result=native(await self.binding.batch(binding_array([self.statement(sql,params) for sql,params in statements])))
            if any(native(item).get('success') is False for item in result):raise RuntimeError('D1 batch failed')
            return result
        except Exception as exc:raise RepositoryError('D1 transaction failed; no partial mutation accepted',503) from exc

    async def check_schema(self):
        version=await self.query('SELECT MAX(version) AS version FROM phase_a_schema')
        if not version or version[0]['version']!=2:raise RepositoryError('Unsupported D1 schema version',503)
    async def initialize(self):
        await self.check_schema()
        seed=seed_records();stamp=seed['stamp'];d=seed['diagnosis']
        statements=[('INSERT OR IGNORE INTO equipment VALUES(?,?,?,?)',e) for e in seed['equipment']]
        statements += [
          ('INSERT OR IGNORE INTO diagnoses VALUES(?,?,?)',(d['id'],json.dumps(d,allow_nan=False),stamp)),
          ('''INSERT OR IGNORE INTO tickets(id,equipment_id,diagnosis_id,title,description,status,resolution_notes,created_at,updated_at,creation_note) VALUES(?,?,?,?,?,?,?,?,?,?)''',('T-SEED-001','R-01',d['id'],'Historical grip loss','Seeded synthetic incident with computed diagnostic snapshot.','Resolved',seed['resolution'],stamp,stamp,'Open — seeded demonstration incident')),
          ('''INSERT OR IGNORE INTO ticket_history(ticket_id,version,at,kind,body) VALUES(?,1,?,'status',?)''',('T-SEED-001',stamp,'Open → Resolved: '+seed['resolution'])),
        ]
        await self.batch(statements)

    async def reserve(self,kind,limit,day=None):
        day=day or now()[:10]
        if limit<1:raise RepositoryError('Demo request budget disabled',429)
        rows=await self.query('''INSERT INTO request_budgets(bucket,used) VALUES(?,1) ON CONFLICT(bucket) DO UPDATE SET used=used+1 WHERE used<? RETURNING used''',(day+':'+kind,limit))
        if not rows:raise RepositoryError('Daily shared demo budget exhausted; retry next UTC day',429)
        return rows[0]['used']

    async def equipment(self):
        return await self.query('SELECT e.*,COALESCE(c.total,0) AS ticket_count FROM equipment e LEFT JOIN equipment_ticket_counts c ON c.equipment_id=e.id ORDER BY e.id')

    async def save_diagnosis(self,result):
        # ASCII JSON is byte-safe when slicing TEXT; no base64 or BLOB interop.
        snapshot=serialize(result)
        digest=hashlib.sha256(snapshot.encode('ascii')).hexdigest()
        existing=await self.query('SELECT snapshot FROM diagnoses WHERE id=?',(result['id'],))
        if existing:
            stored=await self.load_diagnosis(result['id'])
            if serialize(stored)!=snapshot:
                raise RepositoryError('Diagnosis ID already used for different evidence',409)
            return
        chunks=[snapshot[i:i+CHUNK_BYTES] for i in range(0,len(snapshot),CHUNK_BYTES)]
        stamp=now();size=len(snapshot)+(len(chunks)+1)*16384
        statements=[('INSERT INTO diagnoses VALUES(?,?,?) ON CONFLICT(id) DO NOTHING',(result['id'],'{"chunked":1}',stamp)),
          ('INSERT INTO snapshot_manifests VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(diagnosis_id) DO NOTHING',(result['id'],'json-ascii-v1',1,len(snapshot),len(chunks),digest,stamp,size,stamp[:10],self.daily_snapshot_bytes))]
        statements += [('INSERT INTO snapshot_chunks VALUES(?,?,?) ON CONFLICT(diagnosis_id,chunk_index) DO NOTHING',(result['id'],index,content)) for index,content in enumerate(chunks)]
        try:await self.batch(statements)
        except RepositoryError as exc:
            cause=str(exc.__cause__)
            if 'snapshot_conflict' in cause:
                if serialize(await self.load_diagnosis(result['id']))==snapshot:return
                raise RepositoryError('Diagnosis ID already used for different evidence',409) from exc
            if 'snapshot_budget' in cause:raise RepositoryError('Daily evidence storage allowance exhausted; retry next UTC day',429) from exc
            raise

    async def load_diagnosis(self,diagnosis_id):
        manifests=await self.query('SELECT * FROM snapshot_manifests WHERE diagnosis_id=?',(diagnosis_id,))
        try:
            if not manifests:
                rows=await self.query('SELECT snapshot FROM diagnoses WHERE id=?',(diagnosis_id,))
                value=json.loads(rows[0]['snapshot'])
                if not isinstance(value,dict) or value.get('id')!=diagnosis_id or value.get('chunked')==1:raise ValueError('Missing or damaged manifest')
                return value
            m=manifests[0];chunks=[];index=0;length=0
            while True:
                rows=await self.query('SELECT chunk_index,content FROM snapshot_chunks WHERE diagnosis_id=? AND chunk_index>=? ORDER BY chunk_index LIMIT 16',(diagnosis_id,index))
                chunks.extend(rows)
                length+=sum(len(row['content']) for row in rows)
                if length>m['byte_length'] or len(chunks)>m['chunk_count']:raise ValueError('Integrity mismatch')
                if len(rows)<16:break
                index=rows[-1]['chunk_index']+1
            return verify(m,chunks)
        except (ValueError,KeyError,IndexError,TypeError,UnicodeError) as exc:
            raise RepositoryError('Diagnostic evidence is incomplete or damaged; operator recovery required',503) from exc

    async def create_ticket(self,data):
        if not await self.query('SELECT id FROM equipment WHERE id=?',(data['equipment_id'],)):raise RepositoryError('Equipment not found',404)
        if data.get('diagnosis_id') and not await self.query('SELECT id FROM diagnoses WHERE id=?',(data['diagnosis_id'],)):raise RepositoryError('Diagnosis not found',404)
        ticket_id=ticket_identity(data);stamp=now()
        # The primary key plus INSERT ... DO NOTHING handles races; the AFTER
        # INSERT history trigger runs only for the winner, in the same transaction.
        await self.query('''INSERT INTO tickets(id,equipment_id,diagnosis_id,title,description,status,created_at,updated_at,creation_note) VALUES(?,?,?,?,?,'Open',?,?,?) ON CONFLICT(id) DO NOTHING RETURNING id''',(ticket_id,data['equipment_id'],data.get('diagnosis_id'),data['title'],data['description'],stamp,stamp,'Open — '+data['title']))
        detail=await self.ticket(ticket_id);check_reuse(detail['ticket'],data)
        return detail

    async def list_tickets(self,equipment_id=None,after_created=None,after_id=None):
        prefix='equipment_id=? AND ' if equipment_id else ''
        base=[equipment_id] if equipment_id else []
        if after_created is None:
            return await self.query(f'SELECT {TICKET_COLUMNS} FROM tickets '+('WHERE equipment_id=? ' if equipment_id else '')+'ORDER BY created_at DESC,id LIMIT 200',base)
        # Two disjoint indexed ranges, each bounded before the final merge.
        sql=f"SELECT * FROM (SELECT {TICKET_COLUMNS} FROM tickets WHERE {prefix}created_at=? AND id>? ORDER BY created_at DESC,id LIMIT 200) UNION ALL SELECT * FROM (SELECT {TICKET_COLUMNS} FROM tickets WHERE {prefix}created_at<? ORDER BY created_at DESC,id LIMIT 200) ORDER BY created_at DESC,id LIMIT 200"
        return await self.query(sql,base+[after_created,after_id or '']+base+[after_created])

    async def ticket(self,ticket_id):
        # One D1 transactional batch gives a consistent ticket/snapshot/history read.
        results=await self.batch([
          (f'SELECT {TICKET_COLUMNS} FROM tickets WHERE id=?',(ticket_id,)),
          ('SELECT d.id FROM diagnoses d JOIN tickets t ON t.diagnosis_id=d.id WHERE t.id=?',(ticket_id,)),
          ('SELECT seq,ticket_id,at,kind,body FROM ticket_history WHERE ticket_id=? ORDER BY seq LIMIT 201',(ticket_id,)),
        ])
        rows=[native(item).get('results',[]) for item in results]
        if not rows[0]:raise RepositoryError('Ticket not found',404)
        detail={'ticket':rows[0][0],'diagnosis':await self.load_diagnosis(rows[0][0]['diagnosis_id']) if rows[0][0]['diagnosis_id'] else None,'history':rows[2][:200]}
        if len(rows[2])>200:detail['history_next_seq']=rows[2][199]['seq']
        return detail

    async def history_page(self,ticket_id,after_seq=0):
        rows=await self.query('SELECT seq,ticket_id,at,kind,body FROM ticket_history WHERE ticket_id=? AND seq>? ORDER BY seq LIMIT 201',(ticket_id,after_seq))
        return {'history':rows[:200],'next_seq':rows[199]['seq'] if len(rows)>200 else None}

    async def update_ticket(self,ticket_id,data):
        if self.protect_seed and ticket_id=='T-SEED-001':raise RepositoryError('Seed demonstration record is read-only',403)
        rows=await self.query(f'SELECT {TICKET_COLUMNS} FROM tickets WHERE id=?',(ticket_id,))
        if not rows:raise RepositoryError('Ticket not found',404)
        update=prepare_update(rows[0],data)
        changed=await self.query('''UPDATE tickets SET status=?,resolution_notes=?,version=version+1,updated_at=?,last_note=?,last_status_note=? WHERE id=? AND version=? RETURNING id''',(update['status'],update['resolution_notes'],update['at'],update['note'],update['status_event'],ticket_id,data['expected_version']))
        if not changed:raise RepositoryError('Ticket changed in another session. Reload before updating.',409)
        return await self.ticket(ticket_id)
