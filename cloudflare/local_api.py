"""CPython ASGI + real emulated D1 for local contracts/browser tests ONLY.

This is deliberately labelled separately from a Python Worker. No hosted binding,
CPython sqlite3 adapter, or production records are used.
"""
from types import SimpleNamespace
from cloudflare.application import create_worker_app
from cloudflare.test_support import BridgeBinding

class BoundLocalApp:
    def __init__(self,binding=None,**settings):
        self.env=SimpleNamespace(DB=binding or BridgeBinding(),**settings)
        self.inner=create_worker_app()
    async def __call__(self,scope,receive,send):
        if scope['type']=='http':scope={**scope,'env':self.env}
        await self.inner(scope,receive,send)
app=BoundLocalApp()
