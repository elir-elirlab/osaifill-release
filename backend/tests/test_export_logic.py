import pytest
import json

def test_purchase_export_data_structure(client):
    """エクスポートに必要なデータ構造が正しく取得できるかのテスト"""
    # 1. データセットと予算を作成
    ds_id = client.post("/api/datasets", json={"name": "Export Test"}).json()["id"]
    client.post("/api/budgets", json={
        "dataset_id": ds_id, "id": "b-test", "name": "テスト財布", "total_amount": 5000
    })
    
    # 2. 割当付きのアイテムを作成
    purchase_data = {
        "dataset_id": ds_id,
        "item_name": "エクスポート用アイテム",
        "amount": 1000,
        "category": "旅費",
        "status": "見積済み",
        "priority": 4,
        "note": "テスト備考",
        "assignments": [{"budget_id": "b-test", "amount": 1000}]
    }
    client.post("/api/purchases", json=purchase_data)
    
    # 3. データを取得して構造を検証
    res = client.get(f"/api/purchases?dataset_id={ds_id}")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    
    item = items[0]
    assert item["item_name"] == "エクスポート用アイテム"
    assert item["status"] == "見積済み"
    assert len(item["assignments"]) == 1
    assert item["assignments"][0]["budget_id"] == "b-test"

def test_export_csv_content_validation(client):
    """CSVエクスポート（バックエンドAPI経由）の整合性テスト"""
    # フロントエンドで生成するようになったため、バックエンドの旧エンドポイントも
    # 最低限のデータを正しく返すことを確認します。
    ds_id = client.post("/api/datasets", json={"name": "CSV Content Test"}).json()["id"]
    
    client.post("/api/purchases", json={
        "dataset_id": ds_id,
        "item_name": "CSV Item",
        "amount": 500,
        "status": "書いただけ"
    })
    
    # バックエンドのエクスポートAPI（現在は互換性のために残っている想定）
    res = client.get(f"/api/purchases/export-csv?dataset_id={ds_id}")
    assert res.status_code == 200
    # UTF-8-SIGのBOMを除去して確認
    content = res.text.lstrip('\ufeff')
    assert "CSV Item" in content
    assert "500" in content
    # 現在のバックエンド実装にステータスが含まれているか確認
    assert "書いただけ" in content
