"""News & analysis endpoint tests."""

import pytest

API = "/api/v1"

USER = {
    "username": "news_user",
    "email": "news@test.com",
    "password": "StrongPass1",
    "role": "investor",
    "first_name": "News",
}


async def _auth_token(client) -> str:
    await client.post(f"{API}/auth/register", json=USER)
    r = await client.post(f"{API}/auth/login", json={"email": USER["email"], "password": USER["password"]})
    return r.json()["access_token"]


@pytest.mark.asyncio
async def test_news_list_requires_auth(client):
    r = await client.get(f"{API}/news/")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_news_list_empty_for_new_user(client):
    token = await _auth_token(client)
    r = await client.get(f"{API}/news/", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_news_create_requires_admin(client):
    """POST /news/ доступен только admin. Investor получает 403."""
    token = await _auth_token(client)
    r = await client.post(
        f"{API}/news/",
        json={"title": "x", "content": "y", "source": "t", "url": "https://t.local/1"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_analysis_list_empty(client):
    token = await _auth_token(client)
    r = await client.get(f"{API}/analysis/", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_analysis_count(client):
    token = await _auth_token(client)
    r = await client.get(f"{API}/analysis/count", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["total"] == 0
