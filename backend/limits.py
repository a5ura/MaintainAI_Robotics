"""Bound request bodies before JSON parsing. No extra runtime dependencies."""
from starlette.responses import JSONResponse

class BodyLimitMiddleware:
    def __init__(self, app, max_bytes): self.app,self.max_bytes=app,max_bytes
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http": return await self.app(scope,receive,send)
        chunks=[];size=0
        while True:
            message=await receive()
            if message["type"] == "http.disconnect": return
            size+=len(message.get("body",b""))
            if size>self.max_bytes:
                return await JSONResponse({"detail":"Request exceeds 2 MiB limit"},status_code=413)(scope,receive,send)
            chunks.append(message)
            if not message.get("more_body",False): break
        index=0
        async def replay():
            nonlocal index
            if index<len(chunks):
                result=chunks[index];index+=1;return result
            return await receive()
        await self.app(scope,replay,send)
