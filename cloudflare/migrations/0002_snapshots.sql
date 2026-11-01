-- Additive migration: legacy inline diagnoses remain readable.
CREATE TABLE snapshot_manifests(
 diagnosis_id TEXT PRIMARY KEY REFERENCES diagnoses(id) ON DELETE CASCADE,
 format TEXT NOT NULL CHECK(format='json-ascii-v1'),schema_version INTEGER NOT NULL CHECK(schema_version=1),
 byte_length INTEGER NOT NULL CHECK(byte_length>0),chunk_count INTEGER NOT NULL CHECK(chunk_count>0),
 sha256 TEXT NOT NULL CHECK(length(sha256)=64),created_at TEXT NOT NULL,
 storage_bytes INTEGER NOT NULL CHECK(storage_bytes>=byte_length),budget_day TEXT NOT NULL,budget_limit INTEGER
);
CREATE TABLE snapshot_chunks(diagnosis_id TEXT NOT NULL REFERENCES snapshot_manifests(diagnosis_id) ON DELETE CASCADE,chunk_index INTEGER NOT NULL CHECK(chunk_index>=0),content TEXT NOT NULL CHECK(length(CAST(content AS BLOB))<=262144),PRIMARY KEY(diagnosis_id,chunk_index));
CREATE TRIGGER manifest_conflict BEFORE INSERT ON snapshot_manifests WHEN EXISTS(SELECT 1 FROM snapshot_manifests WHERE diagnosis_id=NEW.diagnosis_id AND (sha256!=NEW.sha256 OR byte_length!=NEW.byte_length OR chunk_count!=NEW.chunk_count)) BEGIN SELECT RAISE(ABORT,'snapshot_conflict'); END;
CREATE TRIGGER manifest_budget AFTER INSERT ON snapshot_manifests WHEN NEW.budget_limit IS NOT NULL BEGIN
 INSERT INTO request_budgets(bucket,used) VALUES(NEW.budget_day||':snapshot-bytes',NEW.storage_bytes) ON CONFLICT(bucket) DO UPDATE SET used=used+NEW.storage_bytes;
 SELECT CASE WHEN (SELECT used FROM request_budgets WHERE bucket=NEW.budget_day||':snapshot-bytes')>NEW.budget_limit THEN RAISE(ABORT,'snapshot_budget') END;
END;
CREATE TRIGGER immutable_manifest BEFORE UPDATE ON snapshot_manifests BEGIN SELECT RAISE(ABORT,'immutable_snapshot'); END;
CREATE TRIGGER immutable_chunk BEFORE UPDATE ON snapshot_chunks BEGIN SELECT RAISE(ABORT,'immutable_snapshot'); END;
-- Only whole unreferenced diagnosis removal may cascade. Direct partial deletion is forbidden.
CREATE TRIGGER no_partial_manifest BEFORE DELETE ON snapshot_manifests WHEN EXISTS(SELECT 1 FROM diagnoses WHERE id=OLD.diagnosis_id) BEGIN SELECT RAISE(ABORT,'immutable_snapshot'); END;
CREATE TRIGGER no_partial_chunk BEFORE DELETE ON snapshot_chunks WHEN EXISTS(SELECT 1 FROM snapshot_manifests WHERE diagnosis_id=OLD.diagnosis_id) BEGIN SELECT RAISE(ABORT,'immutable_snapshot'); END;
CREATE INDEX tickets_global_page ON tickets(created_at DESC,id);
CREATE INDEX tickets_equipment_page ON tickets(equipment_id,created_at DESC,id);
CREATE TABLE equipment_ticket_counts(equipment_id TEXT PRIMARY KEY REFERENCES equipment(id) ON DELETE CASCADE,total INTEGER NOT NULL DEFAULT 0);
INSERT INTO equipment_ticket_counts SELECT e.id,COUNT(t.id) FROM equipment e LEFT JOIN tickets t ON t.equipment_id=e.id GROUP BY e.id;
CREATE TRIGGER equipment_count_insert AFTER INSERT ON equipment BEGIN INSERT INTO equipment_ticket_counts VALUES(NEW.id,0); END;
CREATE TRIGGER count_ticket_insert AFTER INSERT ON tickets BEGIN UPDATE equipment_ticket_counts SET total=total+1 WHERE equipment_id=NEW.equipment_id; END;
CREATE TRIGGER count_ticket_delete AFTER DELETE ON tickets BEGIN UPDATE equipment_ticket_counts SET total=total-1 WHERE equipment_id=OLD.equipment_id; END;
INSERT INTO phase_a_schema VALUES(2);
CREATE TRIGGER chunk_index_bound BEFORE INSERT ON snapshot_chunks WHEN NEW.chunk_index>=(SELECT chunk_count FROM snapshot_manifests WHERE diagnosis_id=NEW.diagnosis_id) BEGIN SELECT RAISE(ABORT,'chunk_index_out_of_range'); END;
CREATE TRIGGER chunk_content_conflict BEFORE INSERT ON snapshot_chunks WHEN EXISTS(SELECT 1 FROM snapshot_chunks WHERE diagnosis_id=NEW.diagnosis_id AND chunk_index=NEW.chunk_index AND content!=NEW.content) BEGIN SELECT RAISE(ABORT,'immutable_snapshot'); END;
CREATE TRIGGER manifest_requires_stub BEFORE INSERT ON snapshot_manifests WHEN (SELECT snapshot FROM diagnoses WHERE id=NEW.diagnosis_id)!='{"chunked":1}' BEGIN SELECT RAISE(ABORT,'snapshot_conflict'); END;
