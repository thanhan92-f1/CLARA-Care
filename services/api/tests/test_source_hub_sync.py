from fastapi.testclient import TestClient

from clara_api.main import app

client = TestClient(app)


def _login(email: str) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "secret"})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_source_hub_sync_davidrug_uses_structured_api(monkeypatch) -> None:
    token = _login("alice@research.clara")

    def _fake_http_post_json(url: str, *, payload: dict[str, object]) -> dict[str, object]:
        assert url.endswith("/api/services/app/soDangKy/GetAllPublicServerPaging")
        assert payload["filterText"] == "panadol"
        assert payload["KichHoat"] is True
        return {
            "result": {
                "totalCount": 1,
                "items": [
                    {
                        "id": 55750,
                        "tenThuoc": "Panadol Extra",
                        "soDangKy": "539100184523",
                        "thongTinThuocCoBan": {
                            "hoatChatChinh": "Paracetamol, Caffeine",
                            "dangBaoChe": "Viên nén",
                            "hamLuong": "500mg + 65mg",
                        },
                        "congTyDangKy": {
                            "tenCongTyDangKy": "Công ty TNHH GlaxoSmithKline",
                        },
                        "thongTinDangKyThuoc": {
                            "ngayCapSoDangKy": "2023-07-14T00:00:00+07:00",
                        },
                    }
                ],
            }
        }

    monkeypatch.setattr(
        "clara_api.api.v1.endpoints.research._http_post_json",
        _fake_http_post_json,
    )

    sync_response = client.post(
        "/api/v1/research/source-hub/sync",
        headers={"Authorization": f"Bearer {token}"},
        json={"source": "davidrug", "query": "panadol", "limit": 5},
    )
    assert sync_response.status_code == 200
    payload = sync_response.json()
    assert payload["source"] == "davidrug"
    assert payload["fetched"] == 1
    assert len(payload["records"]) == 1
    record = payload["records"][0]
    assert record["id"] == "davidrug:55750"
    assert record["title"] == "Panadol Extra"
    assert record["metadata"]["so_dang_ky"] == "539100184523"
    assert "Paracetamol" in (record["snippet"] or "")

    list_response = client.get(
        "/api/v1/research/source-hub/records",
        headers={"Authorization": f"Bearer {token}"},
        params={"source": "davidrug"},
    )
    assert list_response.status_code == 200
    rows = list_response.json()["records"]
    assert len(rows) >= 1
    assert rows[0]["source"] == "davidrug"


def test_source_hub_sync_davidrug_returns_warning_when_empty(monkeypatch) -> None:
    token = _login("alice@research.clara")

    def _fake_http_post_json(_url: str, *, payload: dict[str, object]) -> dict[str, object]:
        assert payload["filterText"] == "does-not-exist"
        return {"result": {"totalCount": 0, "items": []}}

    monkeypatch.setattr(
        "clara_api.api.v1.endpoints.research._http_post_json",
        _fake_http_post_json,
    )

    response = client.post(
        "/api/v1/research/source-hub/sync",
        headers={"Authorization": f"Bearer {token}"},
        json={"source": "davidrug", "query": "does-not-exist", "limit": 3},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["fetched"] == 0
    assert payload["warnings"]
    assert "không có kết quả" in payload["warnings"][0].lower()
