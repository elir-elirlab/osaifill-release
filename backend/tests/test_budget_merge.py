import pytest
import json

def test_budget_merge(client):
    # 1. Setup Dataset and Budgets
    ds_id = client.post("/api/datasets", json={"name": "Merge Test DS"}).json()["id"]
    
    # Budget A (Target)
    res_a = client.post(
        "/api/budgets",
        json={"dataset_id": ds_id, "id": "budget-a", "name": "予算A", "total_amount": 10000}
    )
    b_a_id = res_a.json()["id"]
    
    # Budget B (Source)
    res_b = client.post(
        "/api/budgets",
        json={"dataset_id": ds_id, "id": "budget-b", "name": "予算B", "total_amount": 5000}
    )
    b_b_id = res_b.json()["id"]
    
    # 2. Add Assignments to both
    # Purchase 1: Assigned only to A
    client.post(
        "/api/purchases",
        json={
            "dataset_id": ds_id,
            "item_name": "Item 1",
            "amount": 1000,
            "assignments": [{"budget_id": b_a_id, "amount": 1000}]
        }
    )
    
    # Purchase 2: Assigned to both A and B
    res_p2 = client.post(
        "/api/purchases",
        json={
            "dataset_id": ds_id,
            "item_name": "Item 2",
            "amount": 2000,
            "assignments": [
                {"budget_id": b_a_id, "amount": 500},
                {"budget_id": b_b_id, "amount": 1500}
            ]
        }
    )
    p2_id = res_p2.json()["id"]
    
    # 3. Add Actual Expense to B
    client.post(
        f"/api/budgets/{b_b_id}/actual-expenses",
        json={"item_name": "Actual B", "amount": 300}
    )
    
    # 4. Perform Merge (B into A)
    res_merge = client.post(
        "/api/budgets/merge",
        json={"source_budget_id": b_b_id, "target_budget_id": b_a_id}
    )
    assert res_merge.status_code == 200
    merged_budget = res_merge.json()
    
    # Total amount should be summed: 10000 + 5000 = 15000
    assert merged_budget["total_amount"] == 15000
    
    # 5. Verify Budget B is deleted
    res_b_get = client.get(f"/api/budgets?dataset_id={ds_id}")
    assert not any(b["id"] == b_b_id for b in res_b_get.json())
    
    # 6. Verify Assignments are updated/merged
    # Purchase 2 assignments should be merged into one for Budget A
    res_p2_get = client.get(f"/api/purchases?dataset_id={ds_id}")
    p2_data = next(p for p in res_p2_get.json() if p["id"] == p2_id)
    assert len(p2_data["assignments"]) == 1
    assert p2_data["assignments"][0]["budget_id"] == b_a_id
    assert p2_data["assignments"][0]["amount"] == 2000 # 500 + 1500
    
    # 7. Verify Actual Expense is moved
    res_ae = client.get(f"/api/budgets/{b_a_id}/actual-expenses")
    assert any(ae["item_name"] == "Actual B" and ae["amount"] == 300 for ae in res_ae.json())
