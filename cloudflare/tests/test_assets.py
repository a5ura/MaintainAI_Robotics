"""Real workerd Static Assets test, independently of the blocked Python VM."""
from pathlib import Path
import httpx

def test_static_build_assets_and_spa_navigation():
    with httpx.Client(base_url='http://127.0.0.1:8788',timeout=15) as client:
        index=client.get('/')
        assert index.status_code==200
        assert index.content==Path('frontend/dist/index.html').read_bytes()
        assert client.get('/maintenance/example').content==index.content
        for file in Path('frontend/dist/assets').iterdir():
            response=client.get('/assets/'+file.name)
            assert response.status_code==200
            assert response.content==file.read_bytes()
        assert client.get('/__contract/query').status_code==404
        assert client.post('/__contract/query',json={'statements':[]}).status_code==404
