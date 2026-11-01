"""Local-only schema loader for disposable D1 contracts; no hosted commands."""
import asyncio
import sqlite3
from pathlib import Path
from cloudflare.test_support import BridgeBinding
from backend.d1_repository import D1Repository

async def apply_schema(binding,path=None):
    repo=D1Repository(binding)
    exists=await repo.query("SELECT name FROM sqlite_master WHERE type='table' AND name='phase_a_schema'")
    version=(await repo.query('SELECT MAX(version) AS v FROM phase_a_schema'))[0]['v'] if exists else 0
    if version not in (0,1,2):raise ValueError('Unsupported schema version')
    paths=[path] if path else list(sorted((Path(__file__).parent/'migrations').glob('*.sql')))[version:]
    for migration in paths:
        statements=[];part=''
        for line in migration.read_text().splitlines(True):
            part+=line
            if sqlite3.complete_statement(part):statements.append(binding.prepare(part));part=''
        if part.strip():raise ValueError('Incomplete migration statement')
        await binding.batch(statements)

async def main():
    binding=BridgeBinding();await apply_schema(binding);await D1Repository(binding).initialize();print('Local D1 schema v2 and synthetic seed applied; no remote resource used.')
if __name__=='__main__':asyncio.run(main())
