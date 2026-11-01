"""Python Workers entry point. Never deploy during Phase A."""
from workers import asgi
from cloudflare.application import create_worker_app
app=create_worker_app()
Default=asgi.entrypoint(app)
