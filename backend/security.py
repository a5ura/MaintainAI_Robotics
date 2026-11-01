"""Optional single-process demo write budgets. Do not trust forwarded IP headers."""
import math
import threading
import time
from starlette.responses import JSONResponse

class DemoWriteLimit:
    def __init__(self,app,per_peer=20,total=120,window=60,clock=time.monotonic):
        self.app,self.per_peer,self.total,self.window,self.clock=app,per_peer,total,window,clock
        self.peers={};self.started=clock();self.count=0;self.lock=threading.Lock()
    async def __call__(self,scope,receive,send):
        if scope['type']!='http' or scope['method'] not in ('POST','PATCH') or not scope['path'].startswith('/api/'):
            return await self.app(scope,receive,send)
        peer=(scope.get('client') or ('unknown',0))[0]
        with self.lock:
            now=self.clock()
            if now-self.started>=self.window:
                self.started=now;self.count=0;self.peers.clear()
            count=self.peers.get(peer,0)
            allowed=self.count<self.total and count<self.per_peer and (peer in self.peers or len(self.peers)<4096)
            if allowed:self.count+=1;self.peers[peer]=count+1
            retry=max(1,math.ceil(self.window-(now-self.started)))
        if not allowed:
            return await JSONResponse({'detail':'Demo write limit reached. Retry after the indicated interval.'},status_code=429,headers={'Retry-After':str(retry)})(scope,receive,send)
        return await self.app(scope,receive,send)
