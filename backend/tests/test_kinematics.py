import json
from math import pi
from pathlib import Path
import pytest
from pydantic import ValidationError
from backend.app import Sample
from backend.kinematics import forward_kinematics, TCP_TOLERANCE_M, JOINT_LIMITS
from backend.tests.test_diagnostics import client, fixture, run

GOLDEN_POSES = json.loads((Path(__file__).resolve().parents[2] / 'fixtures/kinematics.json').read_text())

@pytest.mark.parametrize('pose', GOLDEN_POSES)
def test_shared_golden_poses(pose):
    assert forward_kinematics(pose['joints']) == pytest.approx(pose['tcp'], abs=1e-8)
    p=fixture(True)
    for row in p['samples']:
        row.update(pose)
    assert run(p)['status']=='detected'

@pytest.mark.parametrize('drop', [False,True])
def test_inconsistent_tcp_cannot_produce_confident_diagnosis(drop):
    p=fixture(drop);p['samples'][2]['tcp'][0] += .01
    d=run(p)
    assert d['status']=='inconclusive' and d['failure'] is None
    assert not d['hypotheses']
    bad=d['timeline'][2]
    assert not bad['kinematics']['valid']
    assert bad['kinematics']['error_m']==pytest.approx(.01)
    assert any('E3' in w for w in d['warnings'])

@pytest.mark.parametrize('index',range(3))
@pytest.mark.parametrize('side',[0,1])
def test_joint_limit_boundary_and_violation(index,side):
    p=fixture(True)
    for row in p['samples']:
        row['joints'][index]=JOINT_LIMITS[index][side]
        row['tcp']=list(forward_kinematics(row['joints']))
    assert run(p)['status']=='detected'
    row=p['samples'][2]
    row['joints'][index] += -.000001 if side==0 else .000001
    d=run(p)
    assert d['status']=='inconclusive' and d['failure'] is None
    assert any('outside' in w for w in d['warnings'])

@pytest.mark.parametrize('offset,valid',[(0,True),(TCP_TOLERANCE_M/2,True),(TCP_TOLERANCE_M,True),(TCP_TOLERANCE_M+1e-8,False)])
def test_tcp_tolerance_boundary(offset,valid):
    p=fixture(True);p['samples'][2]['tcp'][0]+=offset
    d=run(p)
    assert d['timeline'][2]['kinematics']['valid']==valid
    assert d['status']==('detected' if valid else 'inconclusive')

def test_tolerance_is_euclidean_not_per_axis():
    p=fixture(True)
    p['samples'][2]['tcp']=[2.70008,.28008,0]
    assert run(p)['status']=='inconclusive'

@pytest.mark.parametrize('field',['joints','tcp'])
@pytest.mark.parametrize('value',[float('nan'),float('inf'),-float('inf')])
def test_nonfinite_vectors_return_422(field,value):
    p=fixture(True);p['samples'][2][field][0]=value
    # Raw non-standard JSON also must fail gracefully, not crash error encoding.
    response=client.post('/api/diagnose',content=json.dumps(p),headers={'Content-Type':'application/json'})
    assert response.status_code==422
    assert response.json()['detail']

@pytest.mark.parametrize('field',['joints','tcp'])
def test_wrong_vector_dimension_is_invalid_payload(field):
    p=fixture(True);p['samples'][2][field]=[0,0]
    assert client.post('/api/diagnose',json=p).status_code==422

@pytest.mark.parametrize('field',['joints','tcp'])
def test_extreme_finite_values_do_not_overflow_response(field):
    p=fixture(True);p['samples'][2][field]=[1.7e308]*3
    d=run(p)
    assert d['status']=='inconclusive'
