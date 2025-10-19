from fastapi.testclient import TestClient
import pytest

from src.app import app, activities


@pytest.fixture(autouse=True)
def reset_activities():
    # Make a shallow copy of participants for each activity so tests can modify safely
    original = {k: v["participants"][:] for k, v in activities.items()}
    yield
    # restore
    for k in activities:
        activities[k]["participants"] = original[k][:]


def test_get_activities():
    client = TestClient(app)
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    client = TestClient(app)
    activity = "Chess Club"
    email = "teststudent@mergington.edu"

    # make sure not present
    assert email not in activities[activity]["participants"]

    # signup
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

    # signing up again should fail
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400

    # unregister
    resp3 = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp3.status_code == 200
    assert email not in activities[activity]["participants"]

    # unregistering again should fail
    resp4 = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp4.status_code == 400
