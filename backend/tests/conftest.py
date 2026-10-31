import pytest
from backend.app import app
from backend.maintenance import get_repository
from backend.repository import Repository

@pytest.fixture(autouse=True)
def isolated_database(tmp_path):
    repository=Repository(tmp_path/'test.sqlite3')
    app.dependency_overrides[get_repository]=lambda:repository
    yield repository
    app.dependency_overrides.clear()
