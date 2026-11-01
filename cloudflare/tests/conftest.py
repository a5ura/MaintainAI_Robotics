import asyncio
import pytest
from backend.repository import Repository
from backend.d1_repository import D1Repository
from cloudflare.test_support import BridgeBinding

@pytest.fixture(params=['sqlite','d1'])
def adapter(request,tmp_path):
    if request.param=='sqlite':return Repository(tmp_path/'contract.sqlite3')
    binding=BridgeBinding();repo=D1Repository(binding)
    async def reset():
        await repo.batch([(f'DELETE FROM {table}',()) for table in ('ticket_history','tickets','diagnoses','equipment','request_budgets')])
        await repo.initialize()
    asyncio.run(reset())
    return repo
