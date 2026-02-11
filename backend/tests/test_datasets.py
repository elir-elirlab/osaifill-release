import pytest
import json

def test_dataset_crud(client):
    # 1. データセットの作成
    res = client.post("/api/datasets", json={"name": "2025年度"})
    assert res.status_code == 200
    ds_id = res.json()["id"]
    assert res.json()["name"] == "2025年度"

    # 2. 一覧取得
    res = client.get("/api/datasets")
    assert res.status_code == 200
    assert any(d["id"] == ds_id for d in res.json())

    # 3. 名前更新
    res = client.put(f"/api/datasets/{ds_id}", json={"name": "2025年度（確定）"})
    assert res.status_code == 200
    assert res.json()["name"] == "2025年度（確定）"

    # 4. 削除
    res = client.delete(f"/api/datasets/{ds_id}")
    assert res.status_code == 200
    res = client.get("/api/datasets")
    assert not any(d["id"] == ds_id for d in res.json())

def test_dataset_isolation(client):
    # データセットAとBを作成
    ds_a = client.post("/api/datasets", json={"name": "Dataset A"}).json()["id"]
    ds_b = client.post("/api/datasets", json={"name": "Dataset B"}).json()["id"]

    # データセットAにメンバーを追加
    client.post("/api/members", json={"dataset_id": ds_a, "name": "User A"})

    # データセットAのメンバー取得 -> 1人
    res_a = client.get(f"/api/members?dataset_id={ds_a}")
    assert len(res_a.json()) == 1
    assert res_a.json()[0]["name"] == "User A"

    # データセットBのメンバー取得 -> 0人 (分離されている)
    res_b = client.get(f"/api/members?dataset_id={ds_b}")
    assert len(res_b.json()) == 0

def test_dataset_rollover(client):
    # 1. 旧データセットの準備
    old_ds = client.post("/api/datasets", json={"name": "2024年度"}).json()["id"]
    
    # メンバー追加
    client.post("/api/members", json={"dataset_id": old_ds, "name": "担当者1"})
    
    # 予算1: 10000円中 3000円使用 -> 7000円余り
    res_b1 = client.post("/api/budgets", json={
        "dataset_id": old_ds, "id": "b1", "name": "生活費", "total_amount": 10000
    })
    client.post("/api/budgets/b1/actual-expenses", json={"item_name": "食費", "amount": 3000})
    
    # インポート設定も追加
    client.post("/api/budgets/b1/import-setting", json={"mapping_json": '{"a": "b"}'})

    # 予算2: 5000円中 5000円使用 -> 0円余り
    client.post("/api/budgets", json={
        "dataset_id": old_ds, "id": "b2", "name": "娯楽費", "total_amount": 5000
    })
    client.post("/api/budgets/b2/actual-expenses", json={"item_name": "ゲーム", "amount": 5000})

    # 2. 繰り越し（Rollover）実行
    rollover_data = {
        "new_name": "2025年度",
        "source_dataset_id": old_ds,
        "carry_over_budget": True,
        "carry_over_members": True,
        "carry_over_settings": True
    }
    res = client.post("/api/datasets/rollover", json=rollover_data)
    assert res.status_code == 200
    new_ds_id = res.json()["id"]

    # 3. 検証：メンバーが引き継がれているか
    res_members = client.get(f"/api/members?dataset_id={new_ds_id}")
    assert len(res_members.json()) == 1
    assert res_members.json()[0]["name"] == "担当者1"

    # 4. 検証：余り予算（7000円 + 0円 = 7000円）が引き継がれているか
    res_budgets = client.get(f"/api/budgets?dataset_id={new_ds_id}")
    budgets = res_budgets.json()
    
    # 「前年度繰越」予算を探す
    carry_over_b = next((b for b in budgets if b["name"] == "前年度繰越"), None)
    assert carry_over_b is not None
    assert carry_over_b["total_amount"] == 7000.0

    # 5. 検証：以前の予算カード自体は引き継がれていないこと
    life_budget = next((b for b in budgets if b["name"] == "生活費"), None)
    assert life_budget is None

