from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict, cast
import csv
import io
import json
import os
from dotenv import load_dotenv

from . import models, schemas, database, crud

# .envファイルを親ディレクトリまで遡って検索
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from .database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware

# テーブルの作成
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Osaifill API",
    description="Multi-source budget management app backend with Dataset support",
    version="0.2.0",
)

# CORSの設定
allow_origins = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root() -> Dict[str, str]:
    return {"message": "Welcome to Osaifill API"}


@app.get("/api/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok"}


# --- Datasets ---

@app.get("/api/datasets", response_model=List[schemas.Dataset])
def read_datasets(db: Session = Depends(get_db)):
    return crud.get_datasets(db)


@app.post("/api/datasets", response_model=schemas.Dataset)
def create_dataset(dataset: schemas.DatasetCreate, db: Session = Depends(get_db)):
    return crud.create_dataset(db, dataset)


@app.put("/api/datasets/{dataset_id}", response_model=schemas.Dataset)
def update_dataset(dataset_id: str, dataset: schemas.DatasetUpdate, db: Session = Depends(get_db)):
    db_ds = crud.update_dataset(db, dataset_id, dataset)
    if not db_ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return db_ds


@app.delete("/api/datasets/{dataset_id}")
def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    success = crud.delete_dataset(db, dataset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return {"message": "Dataset deleted"}


@app.post("/api/datasets/rollover", response_model=schemas.Dataset)
def rollover_dataset(rollover: schemas.DatasetRollover, db: Session = Depends(get_db)):
    return crud.rollover_dataset(db, rollover)


# --- Members ---

@app.get("/api/members", response_model=List[schemas.Member])
def read_members(dataset_id: str, db: Session = Depends(get_db)):
    return crud.get_members(db, dataset_id)


@app.post("/api/members", response_model=schemas.Member)
def create_member(member: schemas.MemberCreate, db: Session = Depends(get_db)):
    return crud.create_member(db=db, member=member)


@app.put("/api/members/{member_id}", response_model=schemas.Member)
def update_member(member_id: int, member: schemas.MemberUpdate, db: Session = Depends(get_db)):
    db_member = crud.update_member(db, member_id, member)
    if not db_member:
        raise HTTPException(status_code=404, detail="Member not found")
    return db_member


@app.delete("/api/members/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db)):
    success = crud.delete_member(db, member_id)
    if not success:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Member deleted"}


# --- Dashboard ---
@app.get("/api/dashboard", response_model=schemas.DashboardSummary)
def get_dashboard(dataset_id: str, db: Session = Depends(get_db)):
    return crud.get_dashboard_summary(db, dataset_id)


# --- Budgets ---

@app.get("/api/budgets", response_model=List[schemas.Budget])
def read_budgets(dataset_id: str, db: Session = Depends(get_db)):
    return crud.get_budgets(db, dataset_id)


@app.post("/api/budgets", response_model=schemas.Budget)
def create_budget(budget: schemas.BudgetCreate, db: Session = Depends(get_db)):
    return crud.create_budget(db=db, budget=budget)


@app.put("/api/budgets/{budget_id}", response_model=schemas.Budget)
def update_budget(budget_id: str, budget: schemas.BudgetUpdate, db: Session = Depends(get_db)):
    db_budget = crud.update_budget(db, budget_id, budget)
    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return db_budget


@app.delete("/api/budgets/{budget_id}")
def delete_budget(budget_id: str, db: Session = Depends(get_db)):
    success = crud.delete_budget(db, budget_id)
    if not success:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deleted"}


@app.post("/api/budgets/merge", response_model=schemas.Budget)
def merge_budgets(merge_data: schemas.BudgetMerge, db: Session = Depends(get_db)):
    db_budget = crud.merge_budgets(db, merge_data)
    if not db_budget:
        raise HTTPException(status_code=404, detail="One or both budgets not found, or they belong to different datasets")
    return db_budget


# --- Purchases ---

@app.get("/api/purchases", response_model=List[schemas.Purchase])
def read_purchases(dataset_id: str, db: Session = Depends(get_db)):
    return crud.get_purchases(db, dataset_id)


@app.post("/api/purchases", response_model=schemas.Purchase)
def create_purchase(purchase: schemas.PurchaseCreate, db: Session = Depends(get_db)):
    return crud.create_purchase(db=db, purchase=purchase)


@app.post("/api/purchases/import", response_model=List[schemas.Purchase])
def import_purchases(dataset_id: str, purchases: List[schemas.PurchaseCreate], db: Session = Depends(get_db)):
    return crud.create_purchases_bulk(db, dataset_id, purchases)


@app.put("/api/purchases/{purchase_id}", response_model=schemas.Purchase)
def update_purchase(purchase_id: int, purchase: schemas.PurchaseUpdate, db: Session = Depends(get_db)):
    db_purchase = crud.update_purchase(db, purchase_id, purchase)
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return db_purchase


@app.patch("/api/purchases/{purchase_id}/status", response_model=schemas.Purchase)
def update_purchase_status(purchase_id: int, status: str, db: Session = Depends(get_db)):
    db_purchase = crud.update_purchase_status(db, purchase_id, status)
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return db_purchase


@app.delete("/api/purchases/{purchase_id}")
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    success = crud.delete_purchase(db, purchase_id)
    if not success:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return {"message": "Purchase deleted"}


# --- Purchase CSV Export/Import & Settings ---

@app.get("/api/datasets/{dataset_id}/purchase-import-setting", response_model=Optional[schemas.PurchaseImportSetting])
def get_purchase_import_setting(dataset_id: str, db: Session = Depends(get_db)):
    return crud.get_purchase_import_setting(db, dataset_id)


@app.post("/api/datasets/{dataset_id}/purchase-import-setting")
def save_purchase_import_setting(dataset_id: str, setting: schemas.PurchaseImportSettingBase, db: Session = Depends(get_db)):
    return crud.save_purchase_import_setting(db, dataset_id, setting.mapping_json)


@app.get("/api/purchases/export-csv")
def export_purchases_csv(dataset_id: str, db: Session = Depends(get_db)):
    purchases = crud.get_purchases(db, dataset_id)
    output = io.StringIO()
    output.write("\ufeff")
    writer = csv.writer(output)
    writer.writerow(["担当者", "区分", "アイテム名", "金額", "単位", "ステータス", "優先度", "備考", "対応お財布ID", "割当金額"])

    for p in purchases:
        if not p.assignments:
            writer.writerow([p.member_name, p.category, p.item_name, p.amount, p.unit, p.status, p.priority, p.note, "", ""])
        else:
            for asgn in p.assignments:
                writer.writerow([p.member_name, p.category, p.item_name, p.amount, p.unit, p.status, p.priority, p.note, asgn.budget_id, asgn.amount])

    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=purchases_{dataset_id}.csv"})


@app.post("/api/purchases/import-csv")
async def import_purchases_csv(dataset_id: str, file: UploadFile = File(...), overwrite: bool = Form(False), db: Session = Depends(get_db)):
    setting = crud.get_purchase_import_setting(db, dataset_id)
    if not setting:
        raise HTTPException(status_code=400, detail="Import setting not found for this dataset")

    try:
        mapping = json.loads(str(setting.mapping_json))
        # マッピング情報を事前にすべて取得します
        col_item_name = mapping.get("item_name")
        col_amount = mapping.get("amount")
        col_member = mapping.get("member_name")
        col_category = mapping.get("category")
        col_priority = mapping.get("priority")
        col_note = mapping.get("note")
        col_status = mapping.get("status")
        col_budget_id = mapping.get("budget_id")
        col_asgn_amount = mapping.get("asgn_amount")

        if not col_item_name or not col_amount:
            raise HTTPException(status_code=400, detail="Item name and amount columns are required in mapping")

        contents = await file.read()
        decoded_contents = contents.decode("utf-8-sig")
        df = io.StringIO(decoded_contents)
        
        # ヘッダーの前後空白やBOMを完全に除去
        raw_reader = csv.reader(df)
        headers = [h.strip().replace('\ufeff', '') for h in next(raw_reader)]
        # DictReaderで正規化したヘッダーを使用し、データ行から開始します
        reader = csv.DictReader(df, fieldnames=headers)

        if overwrite:
            crud.clear_all_purchases(db, dataset_id)
            # 既存データの削除を確定させ、セッションをクリーンにします
            db.commit()
            db.expire_all()

        def normalize_category(val: str) -> str:
            if not val: return "その他"
            v = val.strip().lower()
            if v in ["旅費", "travel", "travel cost", "travel_cost"]:
                return "旅費"
            if v in ["固定費", "fixed", "fixed cost", "fixed_cost"]:
                return "固定費"
            return "その他"

        def normalize_status(val: str) -> str:
            if not val: return "書いただけ"
            v = val.strip().lower()
            # 内部値: 書いただけ, 見積済み, 買い物中, 購入済み, 購入しない
            if v in ["書いただけ", "提案", "proposal", "written", "draft"]: return "書いただけ"
            if v in ["見積済み", "estimated", "見積済", "estimate"]: return "見積済み"
            if v in ["買い物中", "shopping", "in_progress", "買い物", "shop"]: return "買い物中"
            if v in ["購入済み", "purchased", "done", "購入済", "complete"]: return "購入済み"
            if v in ["購入しない", "not purchasing", "not_purchasing", "skip", "cancel"]: return "購入しない"
            return "書いただけ"

        def normalize_priority(val: Any) -> int:
            if val is None: return 3
            v = str(val).strip().lower()
            # 数値ならそのまま返す
            if v.isdigit():
                return int(v)
            # 日本語・英語のマッピング
            mapping = {
                "最高": 5, "highest": 5, "最優先": 5,
                "高": 4, "high": 4,
                "中": 3, "medium": 3, "normal": 3,
                "低": 2, "low": 2,
                "最低": 1, "lowest": 1
            }
            return mapping.get(v, 3)

        new_purchases = []
        for row in reader:
            item_name = row.get(col_item_name)
            if not item_name: continue
            
            amount_val = 0.0
            try:
                raw_amount = str(row.get(col_amount, "0")).replace(",", "")
                amount_val = float(raw_amount)
            except ValueError: pass

            priority_val = 3
            if col_priority:
                priority_val = normalize_priority(row.get(col_priority))

            category_val = "その他"
            if col_category:
                category_val = normalize_category(str(row.get(col_category, "")))

            status_val = "書いただけ"
            if col_status:
                status_val = normalize_status(str(row.get(col_status, "")))

            p_data = schemas.PurchaseCreate(
                dataset_id=dataset_id,
                member_name=str(row.get(col_member)).strip() if col_member and row.get(col_member) else None,
                category=category_val,
                item_name=str(item_name).strip(),
                amount=amount_val,
                unit="JPY", 
                status=status_val,
                priority=priority_val,
                note=str(row.get(col_note)).strip() if col_note and row.get(col_note) else None,
                assignments=[]
            )
            
            b_id = row.get(col_budget_id) if col_budget_id else None
            as_amount_raw = row.get(col_asgn_amount) if col_asgn_amount else None
            if b_id and as_amount_raw:
                try:
                    p_data.assignments.append(schemas.BudgetAssignmentCreate(
                        budget_id=str(b_id), 
                        amount=float(str(as_amount_raw).replace(",", ""))
                    ))
                except ValueError: pass
            new_purchases.append(p_data)

        crud.create_purchases_bulk(db, dataset_id, new_purchases)
        return {"count": len(new_purchases), "message": "Import successful"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


# --- Import & Actual Expenses ---

@app.get("/api/budgets/{budget_id}/import-setting", response_model=Optional[schemas.ImportSetting])
def get_import_setting(budget_id: str, db: Session = Depends(get_db)):
    return crud.get_import_setting(db, budget_id)


@app.post("/api/budgets/{budget_id}/import-setting")
def save_import_setting(budget_id: str, setting: schemas.ImportSettingBase, db: Session = Depends(get_db)):
    return crud.save_import_setting(db, budget_id, setting.mapping_json)


@app.post("/api/budgets/{budget_id}/import-csv")
async def import_csv(budget_id: str, file: UploadFile = File(...), overwrite: bool = Form(False), db: Session = Depends(get_db)):
    setting = crud.get_import_setting(db, budget_id)
    if not setting: raise HTTPException(status_code=400, detail="Import setting not found")

    try:
        mapping = json.loads(str(setting.mapping_json))
        name_col, amount_col = mapping.get("item_name"), mapping.get("amount")
        if not name_col or not amount_col: raise HTTPException(status_code=400, detail="Invalid mapping")

        contents = await file.read()
        decoded_contents = contents.decode("utf-8-sig")
        df = io.StringIO(decoded_contents)
        reader = csv.DictReader(df)

        expenses = []
        for row in reader:
            item_name, amount_str = row.get(name_col), row.get(amount_col)
            if item_name and amount_str:
                expenses.append(schemas.ActualExpenseCreate(budget_id=budget_id, item_name=str(item_name), amount=float(str(amount_str).replace(",", "")), unit="JPY"))

        crud.create_actual_expenses(db, budget_id, expenses, overwrite=overwrite)
        return {"count": len(expenses), "message": "Import successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@app.get("/api/budgets/{budget_id}/actual-expenses", response_model=List[schemas.ActualExpense])
def get_actual_expenses(budget_id: str, db: Session = Depends(get_db)):
    return crud.get_actual_expenses(db, budget_id)


@app.post("/api/budgets/{budget_id}/actual-expenses", response_model=schemas.ActualExpense)
def create_actual_expense(budget_id: str, expense: schemas.ActualExpenseCreate, db: Session = Depends(get_db)):
    expense_data = expense.model_dump()
    expense_data["budget_id"] = budget_id
    db_exp = models.ActualExpense(**expense_data)
    db.add(db_exp)
    db.commit()
    db.refresh(db_exp)
    return db_exp


@app.put("/api/actual-expenses/{expense_id}", response_model=schemas.ActualExpense)
def update_actual_expense(expense_id: int, expense: schemas.ActualExpenseCreate, db: Session = Depends(get_db)):
    db_exp = crud.update_actual_expense(db, expense_id, expense)
    if not db_exp: raise HTTPException(status_code=404, detail="Actual expense not found")
    return db_exp


@app.delete("/api/actual-expenses/{expense_id}")
def delete_actual_expense(expense_id: int, db: Session = Depends(get_db)):
    if not crud.delete_actual_expense(db, expense_id): raise HTTPException(status_code=404, detail="Actual expense not found")
    return {"message": "Actual expense deleted"}
