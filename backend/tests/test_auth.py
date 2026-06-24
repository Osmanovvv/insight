"""
Auth endpoint tests: register → login → refresh.
"""

import pytest

API = "/api/v1/auth"

USER = {
    "username": "test_user",
    "email": "test@example.com",
    "password": "StrongPass1",
    "role": "investor",
    "first_name": "Test",
}


@pytest.mark.asyncio
async def test_register_success(client):
    r = await client.post(f"{API}/register", json=USER)
    assert r.status_code == 201, r.text
    data = r.json()
    assert "user_id" in data


@pytest.mark.asyncio
async def test_register_duplicate(client):
    await client.post(f"{API}/register", json=USER)
    r = await client.post(f"{API}/register", json=USER)
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_register_weak_password(client):
    bad = {**USER, "password": "weak"}
    r = await client.post(f"{API}/register", json=bad)
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post(f"{API}/register", json=USER)
    r = await client.post(f"{API}/login", json={"email": USER["email"], "password": USER["password"]})
    assert r.status_code == 200, r.text
    tokens = r.json()
    assert "access_token" in tokens and "refresh_token" in tokens


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post(f"{API}/register", json=USER)
    r = await client.post(f"{API}/login", json={"email": USER["email"], "password": "WrongPass1"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_refresh_flow(client):
    await client.post(f"{API}/register", json=USER)
    r = await client.post(f"{API}/login", json={"email": USER["email"], "password": USER["password"]})
    refresh_token = r.json()["refresh_token"]
    r2 = await client.post(f"{API}/refresh", json={"refresh_token": refresh_token})
    assert r2.status_code == 200
    assert "access_token" in r2.json()
