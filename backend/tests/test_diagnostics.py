import pytest
from fastapi.testclient import TestClient
from backend.app import app
client = TestClient(app)

def fixture(drop=False):
    rows = [(0,"pre-pick",False,False,0,"source"),(3,"post-pick",True,True,65,"held"),(6,"transport",True,not drop,12 if drop else 65,None),(9,"pre-place",True,not drop,12 if drop else 65,"missing" if drop else "held"),(12,"post-place",False,False,0,"missing" if drop else "target")]
    return {"samples":[dict(t=t,phase=p,grip_command=g,object_present=o,pressure_kpa=v,verification=c,tcp=[1,1,0],joints=[0,0,0]) for t,p,g,o,v,c in rows]}

def run(payload):
    response=client.post("/api/diagnose",json=payload)
    assert response.status_code==200
    return response.json()

def test_drop_uses_temporal_evidence():
    d=run(fixture(True))
    assert d["status"]=="detected"
    assert d["hypotheses"][0]["cause"]=="Insufficient vacuum / seal loss"
    assert d["hypotheses"][1]["contradiction"]
    ids={e["id"] for e in d["timeline"]}
    assert all(set(h["support"]+h["contradiction"])<=ids for h in d["hypotheses"])
    assert all(len(h["support"]) == len(set(h["support"])) for h in d["hypotheses"])

def test_normal_cycle():
    assert run(fixture())["status"]=="normal"

@pytest.mark.parametrize("index",[0,1,2,3,4])
def test_missing_sensor_is_inconclusive(index):
    p=fixture(True);p["samples"][index]["object_present"]=None
    assert run(p)["status"]=="inconclusive"

def test_no_pick_proof_no_drop_conclusion():
    p=fixture(True);p["samples"][1]["verification"]=None
    assert run(p)["status"]=="inconclusive"

def test_contradiction():
    p=fixture(True);p["samples"][-1]["object_present"]=True
    assert run(p)["status"]=="inconclusive"

def test_loss_then_target_requires_review():
    p=fixture(True);p["samples"][-1]["verification"]="target"
    assert run(p)["status"]=="inconclusive"

def test_temporal_disorder():
    p=fixture(True);p["samples"][1]["t"]=10
    assert run(p)["status"]=="inconclusive"

def test_duplicate_time():
    p=fixture(True);p["samples"][2]["t"]=3
    assert run(p)["status"]=="inconclusive"

def test_sorting_and_repeatability():
    p=fixture(True);p["samples"].reverse()
    assert run(p)==run(fixture(True))

@pytest.mark.parametrize("payload",[{}, {"samples":[]}, {"samples":[{"t":-1}]}, {"samples":[{"phase":"unknown"}]}])
def test_invalid_payload(payload):
    assert client.post("/api/diagnose",json=payload).status_code==422

def test_different_sessions_have_no_shared_state():
    assert run(fixture(True))["status"]=="detected"
    assert run(fixture())["status"]=="normal"

def test_health():
    assert client.get("/api/health").json()=={"status":"ok"}
