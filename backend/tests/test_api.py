import pytest
import json

def test_read_main(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Osaifill API"}

def test_member_crud(client):
    # データセット作成
    ds_id = client.post("/api/datasets", json={"name": "Test DS"}).json()["id"]
    
    # メンバー作成
    res = client.post("/api/members", json={"dataset_id": ds_id, "name": "お嬢様"})
    assert res.status_code == 200
    m_id = res.json()["id"]
    
    # 取得
    res = client.get(f"/api/members?dataset_id={ds_id}")
    assert any(m["name"] == "お嬢様" for m in res.json())
    
    # 更新
    res = client.put(f"/api/members/{m_id}", json={"name": "真・お嬢様"})
    assert res.status_code == 200
    assert res.json()["name"] == "真・お嬢様"
    
    # 削除
    client.delete(f"/api/members/{m_id}")
    res = client.get(f"/api/members?dataset_id={ds_id}")
    assert not any(m["id"] == m_id for m in res.json())

def test_create_budget(client):
    ds_id = client.post("/api/datasets", json={"name": "Test DS"}).json()["id"]
    response = client.post(
        "/api/budgets",
        json={"dataset_id": ds_id, "name": "生活費", "total_amount": 100000, "unit": "円"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "生活費"
    assert "id" in data
    b_id = data["id"]

    # 更新
    res = client.put(f"/api/budgets/{b_id}", json={"total_amount": 120000})
    assert res.status_code == 200
    assert res.json()["total_amount"] == 120000

def test_advanced_dashboard_calculation(client):
    # 0. データセット作成
    ds_id = client.post("/api/datasets", json={"name": "Calc DS"}).json()["id"]
    
    # 1. 予算作成
    client.post("/api/budgets", json={"dataset_id": ds_id, "id": "w-1", "name": "財布1", "total_amount": 10000})
    
    # 2. 購入予定追加 (固定費)
    res = client.post(
        "/api/purchases",
        json={
            "dataset_id": ds_id,
            "item_name": "家賃",
            "amount": 5000,
            "category": "固定費",
            "status": "書いただけ",
            "assignments": [{"budget_id": "w-1", "amount": 5000}]
        }
    )
    p_id = res.json()["id"]
    
    # 購入アイテムの更新（金額変更と割当削除）
    res = client.put(
        f"/api/purchases/{p_id}",
        json={
            "amount": 6000,
            "assignments": [] # 割当を空にする
        }
    )
    assert res.status_code == 200
    assert res.json()["amount"] == 6000
    assert len(res.json()["assignments"]) == 0
    
    # 3. 購入予定追加 (旅費)
    client.post(
        "/api/purchases",
        json={
            "dataset_id": ds_id,
            "item_name": "新幹線",
            "amount": 3000,
            "category": "旅費",
            "status": "見積済み",
            "assignments": [{"budget_id": "w-1", "amount": 3000}]
        }
    )
    
    # 4. ダッシュボード確認
    response = client.get(f"/api/dashboard?dataset_id={ds_id}")
    assert response.status_code == 200
    data = response.json()
    
    # 固定費合計 = 6000 (5000から更新された)
    assert data["fixed_cost_total"] == 6000
    # 旅費合計 = 3000
    assert data["travel_cost_total"] == 3000
    assert len(data["travel_items"]) == 1
    
    # 全体の支払予定額 = 固定費(6000) + 変動費予定(旅費3000) = 9000
    assert data["overall_planned_total"] == 9000
    assert data["overall_remaining_forecast"] == 1000 # 10000 - 9000

def test_csv_import(client):
    ds_id = client.post("/api/datasets", json={"name": "CSV DS"}).json()["id"]
    client.post("/api/budgets", json={"dataset_id": ds_id, "id": "w-csv", "name": "CSV予算", "total_amount": 5000})
    client.post(
        "/api/budgets/w-csv/import-setting",
        json={"mapping_json": '{"item_name": "内容", "amount": "支払額"}'}
    )
    
    csv_content = "内容,支払額\nコーヒー,500\nランチ,1200\n"
    files = {"file": ("test.csv", csv_content, "text/csv")}
    response = client.post("/api/budgets/w-csv/import-csv", files=files, data={"overwrite": "true"})
    
    assert response.status_code == 200
    assert response.json()["count"] == 2
    
    response = client.get(f"/api/dashboard?dataset_id={ds_id}")
    data = response.json()
    budget_summary = next(b for b in data["budgets"] if b["budget_id"] == "w-csv")
    assert budget_summary["actual_total"] == 1700

def test_purchase_csv_import_export(client):
    ds_id = client.post("/api/datasets", json={"name": "Export DS"}).json()["id"]
    client.post("/api/budgets", json={"dataset_id": ds_id, "id": "b-1", "name": "予算1", "total_amount": 10000})
    
    # マッピング設定を追加
    client.post(
        f"/api/datasets/{ds_id}/purchase-import-setting",
        json={"mapping_json": json.dumps({
            "item_name": "アイテム名",
            "amount": "金額",
            "member_name": "担当者",
            "category": "区分",
            "priority": "優先度",
            "note": "備考",
            "budget_id": "対応予算ID",
            "asgn_amount": "割当金額"
        })}
    )
    
    # CSVインポートのシミュレーション
    csv_content = "担当者,区分,アイテム名,金額,単位,ステータス,優先度,備考,対応予算ID,割当金額\n麗子,その他,お茶,150,円,書いただけ,3,美味しい,b-1,150\n"
    files = {"file": ("purchases.csv", csv_content, "text/csv")}
    res = client.post(f"/api/purchases/import-csv?dataset_id={ds_id}", files=files, data={"overwrite": "true"})
    
    assert res.status_code == 200
    assert res.json()["count"] == 1
    
    # エクスポートの確認
    res = client.get(f"/api/purchases/export-csv?dataset_id={ds_id}")
    assert res.status_code == 200
    assert "お茶" in res.text
    assert "麗子" in res.text
