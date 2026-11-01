"""CPython-only transport to real local Wrangler D1; NOT the Python runtime.

The same D1Repository runs in CPython for contracts. SQL is evaluated by Wrangler's
D1 binding, not a hand-written SQL mock. Never import this HTTP test bridge in Workers.
"""
import os
import httpx
from urllib.parse import urlsplit

class Statement:
    def __init__(self,binding,sql,params=()):self.binding,self.sql,self.params=binding,sql,params
    def bind(self,*params):return Statement(self.binding,self.sql,params)
    async def all(self):return (await self.binding.batch([self]))[0]

class BridgeBinding:
    def __init__(self,url=None):
        self.url=url or os.environ.get('D1_LOCAL_BRIDGE','http://127.0.0.1:8788/__contract/query')
        self.metadata=[];self.calls=0
        parsed=urlsplit(self.url)
        if parsed.scheme!='http' or parsed.hostname not in ('127.0.0.1','localhost') or parsed.username:
            raise ValueError('The contract bridge accepts loopback-only HTTP URLs')
    def prepare(self,sql):return Statement(self,sql)
    async def batch(self,statements):
        self.calls+=1
        async with httpx.AsyncClient(timeout=15) as client:
            r=await client.post(self.url,headers={'X-Local-Contract':'phase-a'},json={'statements':[dict(sql=s.sql,params=s.params) for s in statements]})
        if r.status_code!=200:raise RuntimeError('Local D1 batch failed: '+r.text[:400])
        results=r.json()['results'];self.metadata.extend(item.get('meta',{}) for item in results)
        return results
