"""Offline demo data maintenance. No public destructive route; dry-run by default."""
import argparse
import sqlite3
from datetime import datetime,timedelta,timezone
from pathlib import Path

def backup(database,output):
    database,output=Path(database),Path(output)
    if not database.is_file(): raise ValueError('Database does not exist')
    if output.exists(): raise ValueError('Backup destination already exists; choose a new file')
    output.parent.mkdir(parents=True,exist_ok=True)
    # Reserve without overwriting existing files; SQLite's backup API is consistent.
    with output.open('xb'): pass
    try:
        with sqlite3.connect(database) as source,sqlite3.connect(output) as target: source.backup(target)
    except Exception:
        output.unlink();raise

def prune(database,days=30,apply=False,backup_path=None):
    if days<1: raise ValueError('Retention must be at least one day')
    if not Path(database).is_file(): raise ValueError('Database does not exist')
    cutoff=(datetime.now(timezone.utc)-timedelta(days=days)).isoformat()
    with sqlite3.connect(database,timeout=5) as db:
        db.execute('PRAGMA foreign_keys=ON')
        # Take a write reservation before backing up so another writer cannot
        # change records between the backup and pruning transaction.
        db.execute('BEGIN IMMEDIATE')
        ids=[r[0] for r in db.execute("SELECT id FROM tickets WHERE status='Resolved' AND updated_at<? AND id!='T-SEED-001'",(cutoff,))]
        if apply:
            if not backup_path: raise ValueError('An explicit new --backup file is required for --apply')
            # This independent read connection sees the committed pre-prune state.
            backup(database,backup_path)
            for ticket_id in ids:
                db.execute('DELETE FROM ticket_history WHERE ticket_id=?',(ticket_id,))
                db.execute('DELETE FROM tickets WHERE id=?',(ticket_id,))
            db.execute('DELETE FROM diagnoses WHERE created_at<? AND id NOT IN (SELECT diagnosis_id FROM tickets WHERE diagnosis_id IS NOT NULL)',(cutoff,))
        return {'applied':apply,'resolved_tickets_eligible':len(ids),'cutoff':cutoff}

def main():
    p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='command',required=True)
    b=sub.add_parser('backup');b.add_argument('--database',required=True);b.add_argument('--output',required=True)
    d=sub.add_parser('prune');d.add_argument('--database',required=True);d.add_argument('--days',type=int,default=30);d.add_argument('--apply',action='store_true');d.add_argument('--backup')
    a=p.parse_args()
    if a.command=='backup':backup(a.database,a.output);print('Consistent backup created; existing files were not overwritten.')
    else:print(prune(a.database,a.days,a.apply,a.backup))
if __name__=='__main__':main()
