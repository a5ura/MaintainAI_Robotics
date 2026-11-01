-- OWNER-ONLY, explicit future operation. No password or database URL here.
-- Run only after migrations in a separately authorized database.
-- Fails if the role already exists: review existing grants, never reuse blindly.
CREATE ROLE maintainai_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
DO $$ BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO maintainai_runtime', current_database());
END $$;
GRANT USAGE ON SCHEMA public TO maintainai_runtime;
GRANT SELECT ON equipment,diagnoses,snapshot_manifests,snapshot_chunks,tickets,ticket_history,request_budgets,equipment_ticket_counts,postgres_schema TO maintainai_runtime;
GRANT INSERT ON diagnoses,snapshot_manifests,snapshot_chunks,tickets,ticket_history,request_budgets TO maintainai_runtime;
GRANT UPDATE ON tickets,request_budgets,equipment_ticket_counts TO maintainai_runtime;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO maintainai_runtime;
-- Assign a unique password separately using psql's \password prompt.
-- Do not grant DELETE, schema CREATE, table ownership or owner-role membership.
