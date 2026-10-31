import json
from copy import deepcopy
from pathlib import Path
import pytest
from backend.tests.test_diagnostics import client, run
from backend.kinematics import forward_kinematics

CONTRACT=json.loads((Path(__file__).resolve().parents[2]/'fixtures/scenarios.json').read_text())
def scenario(name): return deepcopy(CONTRACT[name])

@pytest.mark.parametrize('name,kind',[('normal',None),('drop','Dropped object'),('position','Positioning error'),('vision','Vision failure'),('stop','Unexpected robot stop')])
def test_frontend_evidence_contract(name,kind):
    d=run(scenario(name))
    assert d['status']==('normal' if kind is None else 'detected')
    assert d['failure']==kind
    assert all(row['kinematics']['valid'] for row in d['timeline'])
    ids={row['id'] for row in d['timeline']}
    for h in d['hypotheses']:
        assert set(h['support']+h['contradiction'])<=ids
        assert h['check']
    if kind: assert d['hypotheses'] and d['observations']

@pytest.mark.parametrize('name',['normal','drop','position','vision','stop'])
def test_selector_label_does_not_determine_diagnosis(name):
    p=scenario(name);first=run(p)
    p['scenario']='Made-up answer';p['seed']=999;p['samples'][0]['injected_failure']='Dropped object'
    assert run(p)==first

def test_multiple_independent_anomalies():
    p=scenario('position');p['samples'][-1]['vision']=scenario('vision')['samples'][-1]['vision']
    p['samples'][-1]['events']+=scenario('vision')['samples'][-1]['events']
    d=run(p)
    assert {a['kind'] for a in d['anomalies']}=={'Positioning error','Vision failure'}

def test_failed_camera_is_not_a_drop_even_if_verification_says_missing():
    p=scenario('drop');p['samples'][-1]['vision']=scenario('vision')['samples'][-1]['vision'];p['samples'][-1]['placement']=None
    assert run(p)['failure']=='Vision failure'

def test_independent_absence_can_confirm_drop_alongside_camera_fault():
    p=scenario('drop');p['samples'][-1]['vision']=scenario('vision')['samples'][-1]['vision']
    assert {a['kind'] for a in run(p)['anomalies']}=={'Dropped object','Vision failure'}

@pytest.mark.parametrize('offset,detected',[(.019,False),(.02,False),(.02001,True)])
def test_position_tolerance(offset,detected):
    p=scenario('position');p['samples'][-1]['placement']['observed']=list(p['samples'][-1]['placement']['target']);p['samples'][-1]['placement']['observed'][0]+=offset
    d=run(p)
    assert bool(d['anomalies'])==detected
    if not detected: assert d['status']=='inconclusive'  # offset verification without confirmed anomaly

def test_unreliable_camera_position_is_inconclusive():
    p=scenario('position');p['samples'][-1]['placement']['source']='camera';p['samples'][-1]['vision']=None
    assert run(p)['status']=='inconclusive'

@pytest.mark.parametrize('confidence,age,fault',[(.49,0,True),(.5,0,False),(.98,1,False),(.98,1.001,True)])
def test_vision_thresholds(confidence,age,fault):
    p=scenario('normal');p['samples'][-1]['vision']['confidence']=confidence;p['samples'][-1]['vision']['acquired_t']=12-age
    d=run(p)
    assert (d['failure']=='Vision failure')==fault
    assert d['status']==('detected' if fault else 'normal')

@pytest.mark.parametrize('name',['position','vision','stop'])
def test_new_faults_do_not_override_corrupt_kinematics(name):
    p=scenario(name);p['samples'][0]['tcp'][0]+=.01
    d=run(p)
    assert d['status']=='inconclusive' and d['failure'] is None and not d['hypotheses']

def test_stop_with_continued_motion_is_inconclusive():
    p=scenario('stop');row=deepcopy(p['samples'][-1]);row['t']=7;row['joints'][0]+=.1;row['tcp']=forward_kinematics(row['joints']);row['events']=[];p['samples'].append(row)
    assert run(p)['status']=='inconclusive'

def test_stop_requires_interruption_event():
    p=scenario('stop');p['samples'][-1]['events']=[]
    assert run(p)['status']=='inconclusive'

@pytest.mark.parametrize('case',['future','event_time','gate','placement','vision'])
def test_conflicting_evidence(case):
    p=scenario('normal');row=p['samples'][-1]
    if case=='future': row['vision']['acquired_t']=13
    if case=='event_time': row['events']=[dict(t=4,source='camera',code='CAMERA_TIMEOUT',message='late event')]
    if case=='gate': row['events']=[dict(t=12,source='safety',code='SAFETY_GATE_OPEN',message='gate opened')]
    if case=='placement': row['verification']='missing'
    if case=='vision': row['vision']['object_detected']=False
    assert run(p)['status']=='inconclusive'

def test_payload_and_event_limits():
    p=scenario('normal');p['samples'][0]['events']=[dict(t=0,source='camera',code='LOW_LIGHT',message='x')]*17
    assert client.post('/api/diagnose',json=p).status_code==422
    assert client.post('/api/diagnose',content=b'x'*(2*1024*1024+1)).status_code==413
