"""Async D1 binding adapter. No sqlite3, filesystem, implicit seed or fallback.

A mutation and its history commit as one statement via database triggers. Shared
Python domain rules are validated before a conditional versioned UPDATE.
"""
import json
from backend.async_repository import AsyncMaintenanceRepository,TICKET_COLUMNS
from backend.domain import RepositoryError


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

class D1Repository(AsyncMaintenanceRepository):
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
