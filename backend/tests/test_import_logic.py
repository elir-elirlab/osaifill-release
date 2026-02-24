import pytest
import json
import io

def setup_dataset_and_mapping(client):
    """テスト用のデータセットとフル項目のマッピング設定を準備するユーティリティ"""
    ds_id = client.post("/api/datasets", json={"name": "Import Test DS"}).json()["id"]
    
    # 全項目を網羅したマッピング設定
    mapping = {
        "item_name": "アイテム名",
        "amount": "金額",
        "member_name": "担当者",
        "category": "区分",
        "status": "ステータス",
        "priority": "優先度",
        "note": "備考",
        "budget_id": "対応予算ID",
        "asgn_amount": "割当金額"
    }
    client.post(
        f"/api/datasets/{ds_id}/purchase-import-setting",
        json={"mapping_json": json.dumps(mapping)}
    )
    return ds_id

def test_purchase_full_import(client):
    """全項目を含むインポートの正常系テスト"""
    ds_id = setup_dataset_and_mapping(client)
    
    # 予算も作成しておく（割当用）
    client.post("/api/budgets", json={
        "dataset_id": ds_id, "id": "test-wallet", "name": "テスト財布", "total_amount": 100000
    })
    
    # フル項目のCSVデータ
    # 内部値への正規化: "提案" -> "書いただけ", "その他" -> "その他"
    csv_rows = [
        "アイテム名,金額,担当者,区分,ステータス,優先度,備考,対応予算ID,割当金額",
        "高級キーボード,30000,麗子,その他,提案,5,自分へのご褒美,test-wallet,30000"
    ]
    csv_content = "\n".join(csv_rows) + "\n"
    
    files = {"file": ("full_test.csv", csv_content, "text/csv")}
    res = client.post(f"/api/purchases/import-csv?dataset_id={ds_id}", files=files)
    assert res.status_code == 200
    
    # 取得して検証
    items = client.get(f"/api/purchases?dataset_id={ds_id}").json()
    assert len(items) == 1
    item = items[0]
    
    assert item["item_name"] == "高級キーボード"
    assert item["amount"] == 30000.0
    assert item["member_name"] == "麗子"
    assert item["category"] == "その他"
    assert item["status"] == "書いただけ"
    assert item["priority"] == 5
    assert item["note"] == "自分へのご褒美"
    assert len(item["assignments"]) == 1
    assert item["assignments"][0]["budget_id"] == "test-wallet"
    assert item["assignments"][0]["amount"] == 30000.0

def test_purchase_append_import(client):
    """非破壊インポート（追加）のフル項目テスト"""
    ds_id = setup_dataset_and_mapping(client)
    
    # 予算作成
    client.post("/api/budgets", json={
        "dataset_id": ds_id, "id": "wallet-a", "name": "財布A", "total_amount": 50000
    })
    
    # 1. 既存アイテムを1つ作成
    client.post("/api/purchases", json={
        "dataset_id": ds_id,
        "item_name": "既存アイテム",
        "amount": 1000,
        "category": "固定費",
        "status": "書いただけ"
    })
    
    # 2. フル項目のCSVデータをインポート (overwrite=false)
    csv_rows = [
        "アイテム名,金額,担当者,区分,ステータス,優先度,備考,対応予算ID,割当金額",
        "追加アイテム,2000,担当B,旅費,見積済み,4,追加分メモ,wallet-a,2000"
    ]
    csv_content = "\n".join(csv_rows) + "\n"
    files = {"file": ("append_test.csv", csv_content, "text/csv")}
    res = client.post(f"/api/purchases/import-csv?dataset_id={ds_id}", files=files, data={"overwrite": "false"})
    assert res.status_code == 200
    
    # 3. 検証：合計2つになっていること
    items = client.get(f"/api/purchases?dataset_id={ds_id}").json()
    assert len(items) == 2
    
    # 追加アイテムの詳細検証
    added = next(i for i in items if i["item_name"] == "追加アイテム")
    assert added["member_name"] == "担当B"
    assert added["category"] == "旅費"
    assert added["status"] == "見積済み"
    assert len(added["assignments"]) == 1
    assert added["assignments"][0]["budget_id"] == "wallet-a"

def test_purchase_overwrite_import(client):
    """破壊的インポート（上書き）のフル項目テスト"""
    ds_id = setup_dataset_and_mapping(client)
    
    # 1. 既存アイテムを作成
    client.post("/api/purchases", json={
        "dataset_id": ds_id,
        "item_name": "消えるアイテム",
        "amount": 100,
        "status": "書いただけ"
    })
    
    # 2. CSVインポート (overwrite=true)
    csv_rows = [
        "アイテム名,金額,区分,ステータス",
        "新しいアイテム,500,固定費,見積済み"
    ]
    csv_content = "\n".join(csv_rows) + "\n"
    files = {"file": ("overwrite_test.csv", csv_content, "text/csv")}
    res = client.post(f"/api/purchases/import-csv?dataset_id={ds_id}", files=files, data={"overwrite": "true"})
    assert res.status_code == 200
    
    # 3. 検証：古いアイテムが消え、新しいアイテムのみが存在すること
    items = client.get(f"/api/purchases?dataset_id={ds_id}").json()
    assert len(items) == 1
    assert items[0]["item_name"] == "新しいアイテム"
    assert items[0]["category"] == "固定費"
    assert items[0]["status"] == "見積済み"
    assert not any(i["item_name"] == "消えるアイテム" for i in items)

def test_purchase_import_category_normalization(client):
    """カテゴリ名の多言語正規化テスト"""
    ds_id = setup_dataset_and_mapping(client)
    csv_content = "アイテム名,金額,区分\nチケット,1000,Travel Cost\n家賃,50000,固定費\n"
    files = {"file": ("test.csv", csv_content, "text/csv")}
    client.post(f"/api/purchases/import-csv?dataset_id={ds_id}", files=files)
    
    items = client.get(f"/api/purchases?dataset_id={ds_id}").json()
    assert next(i for i in items if i["item_name"] == "チケット")["category"] == "旅費"
    assert next(i for i in items if i["item_name"] == "家賃")["category"] == "固定費"

def test_purchase_import_status_normalization(client):
    """ステータス名の多言語正規化テスト"""
    ds_id = setup_dataset_and_mapping(client)
    csv_content = "アイテム名,金額,ステータス\nPC,100000,Estimated\nマウス,5000,提案\n"
    files = {"file": ("test.csv", csv_content, "text/csv")}
    client.post(f"/api/purchases/import-csv?dataset_id={ds_id}", files=files)
    
    items = client.get(f"/api/purchases?dataset_id={ds_id}").json()
    assert next(i for i in items if i["item_name"] == "PC")["status"] == "見積済み"
    assert next(i for i in items if i["item_name"] == "マウス")["status"] == "書いただけ"
