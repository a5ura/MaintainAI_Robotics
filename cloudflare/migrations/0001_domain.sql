-- D1 statements are transactional; no BEGIN/COMMIT or local sqlite3 connection.
CREATE TABLE phase_a_schema(version INTEGER PRIMARY KEY);
INSERT INTO phase_a_schema(version) VALUES(1);
CREATE TABLE equipment(id TEXT PRIMARY KEY,name TEXT NOT NULL,description TEXT NOT NULL,status TEXT NOT NULL);
CREATE TABLE diagnoses(id TEXT PRIMARY KEY,snapshot TEXT NOT NULL CHECK(json_valid(snapshot)),created_at TEXT NOT NULL);
CREATE TABLE tickets(
 id TEXT PRIMARY KEY,equipment_id TEXT NOT NULL REFERENCES equipment(id),diagnosis_id TEXT REFERENCES diagnoses(id),
 title TEXT NOT NULL,description TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('Open','In Progress','Resolved')),
 resolution_notes TEXT NOT NULL DEFAULT '',version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
 creation_note TEXT NOT NULL,last_note TEXT,last_status_note TEXT
);
CREATE TABLE ticket_history(seq INTEGER PRIMARY KEY AUTOINCREMENT,ticket_id TEXT NOT NULL REFERENCES tickets(id),version INTEGER NOT NULL,at TEXT NOT NULL,kind TEXT NOT NULL,body TEXT NOT NULL,UNIQUE(ticket_id,version,kind));
CREATE INDEX ticket_history_ticket ON ticket_history(ticket_id,seq);
CREATE INDEX tickets_equipment_created ON tickets(equipment_id,created_at);
CREATE TABLE request_budgets(bucket TEXT PRIMARY KEY,used INTEGER NOT NULL CHECK(used>=0));
CREATE TRIGGER ticket_created AFTER INSERT ON tickets BEGIN
 INSERT INTO ticket_history(ticket_id,version,at,kind,body) VALUES(NEW.id,NEW.version,NEW.created_at,'created',NEW.creation_note);
END;
CREATE TRIGGER ticket_updated AFTER UPDATE OF version ON tickets BEGIN
 SELECT CASE WHEN NEW.version!=OLD.version+1 THEN RAISE(ABORT,'invalid_version_step') END;
 INSERT INTO ticket_history(ticket_id,version,at,kind,body) SELECT NEW.id,NEW.version,NEW.updated_at,'status',NEW.last_status_note WHERE NEW.last_status_note IS NOT NULL;
 INSERT INTO ticket_history(ticket_id,version,at,kind,body) SELECT NEW.id,NEW.version,NEW.updated_at,'note',NEW.last_note WHERE NEW.last_note IS NOT NULL;
END;
CREATE TRIGGER immutable_diagnoses BEFORE UPDATE ON diagnoses BEGIN
 SELECT RAISE(ABORT,'immutable_diagnosis');
END;
