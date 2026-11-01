"""Local-only schema loader for disposable D1 contracts; no hosted commands."""
import asyncio
import sqlite3
from pathlib import Path
from cloudflare.test_support import BridgeBinding
from backend.d1_repository import D1Repository

async def apply_schema(binding,path=None):
    repo=D1Repository(binding)
    if await repo.query("SELECT name FROM sqlite_master WHERE type='table' AND name='phase_a_schema'"):
        await repo.check_schema()
        return
    path=path or Path(__file__).parent/'migrations'/'0001_domain.sql'
    statements=[];part=''
    for line in path.read_text().splitlines(True):
        part+=line
        if sqlite3.complete_statement(part):statements.append(binding.prepare(part));part=''
    if part.strip():raise ValueError('Incomplete migration statement')
    await binding.batch(statements)

async def main():
    binding=BridgeBinding();await apply_schema(binding);await D1Repository(binding).initialize();print('Local D1 schema v1 and synthetic seed applied; no remote resource used.')
if __name__=='__main__':asyncio.run(main())
