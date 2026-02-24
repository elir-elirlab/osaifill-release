from sqlalchemy.orm import Session
from . import models, schemas
import uuid
import json
from typing import List, Optional, cast, Any


# --- Dataset CRUD ---
def get_datasets(db: Session) -> List[models.Dataset]:
    return db.query(models.Dataset).order_by(models.Dataset.created_at.desc()).all()


def create_dataset(db: Session, dataset: schemas.DatasetCreate) -> models.Dataset:
    db_dataset = models.Dataset(name=dataset.name)
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    return db_dataset


def update_dataset(db: Session, dataset_id: str, dataset: schemas.DatasetUpdate) -> Optional[models.Dataset]:
    db_dataset = db.query(models.Dataset).filter(models.Dataset.id == dataset_id).first()
    if db_dataset and dataset.name:
        db_dataset.name = dataset.name
        db.commit()
        db.refresh(db_dataset)
    return db_dataset


def delete_dataset(db: Session, dataset_id: str) -> bool:
    db_dataset = db.query(models.Dataset).filter(models.Dataset.id == dataset_id).first()
    if db_dataset:
        db.delete(db_dataset)
        db.commit()
        return True
    return False


# --- Dataset Rollover (Migration) ---
def rollover_dataset(db: Session, rollover: schemas.DatasetRollover) -> models.Dataset:
    # 1. 新しいデータセットを作成
    new_ds = models.Dataset(name=rollover.new_name)
    db.add(new_ds)
    db.flush() # ID確定

    # 2. メンバーのコピー
    if rollover.carry_over_members and rollover.source_dataset_id:
        old_members = db.query(models.Member).filter(models.Member.dataset_id == rollover.source_dataset_id).all()
        for m in old_members:
            new_m = models.Member(dataset_id=new_ds.id, name=m.name)
            db.add(new_m)

    # 3. 予算の繰り越し（金額の合算のみ行います）
    carry_over_amount = 0.0
    if rollover.source_dataset_id:
        old_budgets = db.query(models.Budget).filter(models.Budget.dataset_id == rollover.source_dataset_id).all()
        
        for ob in old_budgets:
            # 実績ベースの余りを計算
            actual_paid = sum(ae.amount for ae in ob.actual_expenses)
            remaining = ob.total_amount - actual_paid
            carry_over_amount += max(0, remaining)

    # 4. 繰り越し予算の作成（合算された一つの予算として登録します）
    if rollover.carry_over_budget and carry_over_amount > 0:
        rollover_budget = models.Budget(
            dataset_id=new_ds.id,
            name="前年度繰越",
            total_amount=carry_over_amount,
            unit="JPY",
            description=f"旧データセット {rollover.source_dataset_id} からの繰り越し分です。"
        )
        db.add(rollover_budget)

    db.commit()
    db.refresh(new_ds)
    return new_ds


# --- Member CRUD ---
def get_members(db: Session, dataset_id: str) -> List[models.Member]:
    return db.query(models.Member).filter(models.Member.dataset_id == dataset_id).all()


def create_member(db: Session, member: schemas.MemberCreate) -> models.Member:
    db_member = models.Member(dataset_id=member.dataset_id, name=member.name)
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member


def delete_member(db: Session, member_id: int) -> bool:
    db_member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if db_member:
        db.delete(db_member)
        db.commit()
        return True
    return False


def update_member(db: Session, member_id: int, member: schemas.MemberUpdate) -> Optional[models.Member]:
    db_member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if db_member and member.name is not None:
        db_member.name = member.name
        db.commit()
        db.refresh(db_member)
    return db_member


# --- Budget CRUD ---
def get_budgets(db: Session, dataset_id: str) -> List[models.Budget]:
    return db.query(models.Budget).filter(models.Budget.dataset_id == dataset_id).all()


def get_budget(db: Session, budget_id: str) -> Optional[models.Budget]:
    return db.query(models.Budget).filter(models.Budget.id == budget_id).first()


def create_budget(db: Session, budget: schemas.BudgetCreate) -> models.Budget:
    db_budget = models.Budget(
        id=budget.id or str(uuid.uuid4()),
        dataset_id=budget.dataset_id,
        name=budget.name,
        total_amount=budget.total_amount,
        unit=budget.unit,
        description=budget.description,
    )
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget


def update_budget(db: Session, budget_id: str, budget: schemas.BudgetUpdate) -> Optional[models.Budget]:
    db_budget = get_budget(db, budget_id)
    if db_budget:
        update_data = budget.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_budget, key, value)
        db.commit()
        db.refresh(db_budget)
    return db_budget


def delete_budget(db: Session, budget_id: str) -> bool:
    db_budget = get_budget(db, budget_id)
    if db_budget:
        db.delete(db_budget)
        db.commit()
        return True
    return False


def merge_budgets(db: Session, merge_data: schemas.BudgetMerge) -> Optional[models.Budget]:
    source_budget = db.query(models.Budget).filter(models.Budget.id == merge_data.source_budget_id).first()
    target_budget = db.query(models.Budget).filter(models.Budget.id == merge_data.target_budget_id).first()
    
    if not source_budget or not target_budget:
        return None
        
    if source_budget.dataset_id != target_budget.dataset_id:
        return None

    # 1. 総額の合算
    target_budget.total_amount += source_budget.total_amount
    
    # 2. BudgetAssignment の移動と合算
    source_assignments = db.query(models.BudgetAssignment).filter(models.BudgetAssignment.budget_id == source_budget.id).all()
    for sa in source_assignments:
        existing_ta = db.query(models.BudgetAssignment).filter(
            models.BudgetAssignment.budget_id == target_budget.id,
            models.BudgetAssignment.purchase_id == sa.purchase_id
        ).first()
        
        if existing_ta:
            existing_ta.amount += sa.amount
            db.delete(sa)
        else:
            sa.budget_id = target_budget.id
            
    # 3. ActualExpense の移動
    db.query(models.ActualExpense).filter(models.ActualExpense.budget_id == source_budget.id).update(
        {models.ActualExpense.budget_id: target_budget.id}
    )
    
    # 4. ImportSetting (統合先に設定がなく、統合元にある場合は引き継ぐ)
    if not target_budget.import_setting and source_budget.import_setting:
        # SQLAlchemyの関係上、直接移動させるのは難しいため、新しいものを作成するか
        # 既存のものを更新します
        db_setting = models.ImportSetting(
            budget_id=target_budget.id,
            mapping_json=source_budget.import_setting.mapping_json
        )
        db.add(db_setting)

    # 5. 統合元の削除
    db.delete(source_budget)
    
    db.commit()
    db.refresh(target_budget)
    return target_budget


# --- Purchase CRUD ---
def get_purchases(db: Session, dataset_id: str) -> List[models.Purchase]:
    return db.query(models.Purchase).filter(models.Purchase.dataset_id == dataset_id).all()


def create_purchase(db: Session, purchase: schemas.PurchaseCreate) -> models.Purchase:
    db_purchase = models.Purchase(
        dataset_id=purchase.dataset_id,
        member_name=purchase.member_name,
        category=purchase.category,
        item_name=purchase.item_name,
        amount=purchase.amount,
        unit=purchase.unit,
        status=purchase.status,
        priority=purchase.priority,
        note=purchase.note,
    )
    db.add(db_purchase)
    db.flush()

    for assignment in purchase.assignments:
        db_assignment = models.BudgetAssignment(
            purchase_id=db_purchase.id,
            budget_id=assignment.budget_id,
            amount=assignment.amount,
        )
        db.add(db_assignment)

    db.commit()
    db.refresh(db_purchase)
    return db_purchase


def create_purchases_bulk(db: Session, dataset_id: str, purchases: List[schemas.PurchaseCreate]) -> List[models.Purchase]:
    db_purchases = []
    for p_data in purchases:
        db_purchase = models.Purchase(
            dataset_id=dataset_id,
            member_name=p_data.member_name,
            category=p_data.category,
            item_name=p_data.item_name,
            amount=p_data.amount,
            unit=p_data.unit,
            status=p_data.status,
            priority=p_data.priority,
            note=p_data.note,
        )
        db.add(db_purchase)
        db.flush()

        for assignment in p_data.assignments:
            db_assignment = models.BudgetAssignment(
                purchase_id=db_purchase.id,
                budget_id=assignment.budget_id,
                amount=assignment.amount,
            )
            db.add(db_assignment)
        db_purchases.append(db_purchase)

    db.commit()
    return db_purchases


def update_purchase_status(db: Session, purchase_id: int, status: str) -> Optional[models.Purchase]:
    db_purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if db_purchase:
        db_purchase.status = status
        db.commit()
        db.refresh(db_purchase)
    return db_purchase


def update_purchase(db: Session, purchase_id: int, purchase: schemas.PurchaseUpdate) -> Optional[models.Purchase]:
    db_purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if not db_purchase:
        return None

    update_data = purchase.model_dump(exclude_unset=True)
    assignments_data = update_data.pop("assignments", None)

    for key, value in update_data.items():
        setattr(db_purchase, key, value)

    if assignments_data is not None:
        db.query(models.BudgetAssignment).filter(models.BudgetAssignment.purchase_id == purchase_id).delete()
        for asgn in assignments_data:
            db_asgn = models.BudgetAssignment(
                purchase_id=purchase_id,
                budget_id=asgn["budget_id"],
                amount=asgn["amount"],
            )
            db.add(db_asgn)

    db.commit()
    db.refresh(db_purchase)
    return db_purchase


def delete_purchase(db: Session, purchase_id: int) -> bool:
    db_purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if db_purchase:
        db.delete(db_purchase)
        db.commit()
        return True
    return False


def clear_all_purchases(db: Session, dataset_id: str) -> bool:
    # 削除処理を確実に行うために、まず関連する BudgetAssignment を削除します
    # (cascade設定がありますが、念のための明示的削除です)
    purchase_ids = [p.id for p in db.query(models.Purchase.id).filter(models.Purchase.dataset_id == dataset_id).all()]
    if purchase_ids:
        db.query(models.BudgetAssignment).filter(models.BudgetAssignment.purchase_id.in_(purchase_ids)).delete(synchronize_session='fetch')
    
    # 次に Purchase 本体を削除します
    db.query(models.Purchase).filter(models.Purchase.dataset_id == dataset_id).delete(synchronize_session='fetch')
    db.flush()
    return True


# --- Dashboard & Summary ---
def get_dashboard_summary(db: Session, dataset_id: str) -> schemas.DashboardSummary:
    budgets = db.query(models.Budget).filter(models.Budget.dataset_id == dataset_id).all()
    all_purchases = db.query(models.Purchase).filter(models.Purchase.dataset_id == dataset_id).all()

    budget_summaries: List[schemas.BudgetSummary] = []
    overall_actual_total = 0.0

    for b in budgets:
        # 実績支払額の合計（CSV等からインポートされた確定支出）
        actual_total = sum(ae.amount for ae in b.actual_expenses)
        
        # 予算別の予定額（未払の予定のみを抽出）
        # 運用思想：ステータスが「書いただけ」「見積済み」のものを純粋な「予定」とみなします
        planned_total = float(sum(
            asgn.amount
            for asgn in b.assignments
            if asgn.purchase.status in ["書いただけ", "見積済み"]
        ))
        
        # 予算別の余り予測（予算総額 - すでに支払った実績 - これから発生する予定）
        remaining_forecast = float(b.total_amount) - actual_total - planned_total

        budget_summaries.append(
            schemas.BudgetSummary(
                budget_id=cast(str, b.id),
                name=cast(str, b.name),
                total_amount=cast(float, b.total_amount),
                actual_total=float(actual_total),
                planned_total=planned_total,
                remaining_forecast=remaining_forecast,
                unit=cast(str, b.unit),
                description=cast(Optional[str], b.description),
            )
        )
        overall_actual_total += float(actual_total)

    # 各カテゴリー別の予定額計算（未払分のみ）
    fixed_cost_planned_total = float(
        sum(
            p.amount
            for p in all_purchases
            if p.category == "固定費" and p.status in ["書いただけ", "見積済み"]
        )
    )
    travel_planned_total = float(
        sum(
            p.amount
            for p in all_purchases
            if p.category == "旅費" and p.status in ["書いただけ", "見積済み"]
        )
    )
    other_planned_total = float(
        sum(
            p.amount
            for p in all_purchases
            if p.category not in ["固定費", "旅費"] and p.status in ["書いただけ", "見積済み"]
        )
    )

    # 全体の予定合計額
    overall_planned_total = (
        fixed_cost_planned_total + travel_planned_total + other_planned_total
    )

    # 未割当の予定額計算
    unassigned_planned_total = float(
        sum(
            max(0.0, p.amount - sum(asgn.amount for asgn in p.assignments))
            for p in all_purchases
            if p.status in ["書いただけ", "見積済み"]
        )
    )

    # 固定費分析用の総額（ステータスに関わらず、ただし「購入しない」は除外）
    fixed_cost_total = float(
        sum(
            p.amount
            for p in all_purchases
            if p.category == "固定費" and p.status != "購入しない"
        )
    )
    
    # 全体の余り予測（全予算の総額 - 全実績 - 全未払予定）
    overall_remaining_forecast = (
        float(sum(b.total_amount for b in budgets))
        - overall_actual_total
        - overall_planned_total
    )

    travel_purchases = [p for p in all_purchases if p.category == "旅費" and p.status != "購入しない"]
    travel_cost_total = float(sum(p.amount for p in travel_purchases))

    return schemas.DashboardSummary(
        overall_actual_total=overall_actual_total,
        overall_planned_total=overall_planned_total,
        overall_remaining_forecast=overall_remaining_forecast,
        unassigned_planned_total=unassigned_planned_total,
        fixed_cost_total=fixed_cost_total,
        fixed_cost_planned_total=fixed_cost_planned_total,
        travel_planned_total=travel_planned_total,
        other_planned_total=other_planned_total,
        travel_cost_total=travel_cost_total,
        budgets=budget_summaries,
        travel_items=cast(List[schemas.Purchase], travel_purchases),
    )


def get_purchase_import_setting(db: Session, dataset_id: str) -> Optional[models.PurchaseImportSetting]:
    return db.query(models.PurchaseImportSetting).filter(models.PurchaseImportSetting.dataset_id == dataset_id).first()


def save_purchase_import_setting(db: Session, dataset_id: str, mapping_json: str) -> models.PurchaseImportSetting:
    db_setting = get_purchase_import_setting(db, dataset_id)
    if db_setting:
        db_setting.mapping_json = mapping_json
    else:
        db_setting = models.PurchaseImportSetting(dataset_id=dataset_id, mapping_json=mapping_json)
        db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting


# --- ActualExpense & ImportSetting ---
def get_import_setting(db: Session, budget_id: str) -> Optional[models.ImportSetting]:
    return db.query(models.ImportSetting).filter(models.ImportSetting.budget_id == budget_id).first()


def save_import_setting(db: Session, budget_id: str, mapping_json: str) -> models.ImportSetting:
    db_setting = get_import_setting(db, budget_id)
    if db_setting:
        db_setting.mapping_json = mapping_json
    else:
        db_setting = models.ImportSetting(budget_id=budget_id, mapping_json=mapping_json)
        db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting


def create_actual_expenses(db: Session, budget_id: str, expenses: List[schemas.ActualExpenseCreate], overwrite: bool = False) -> bool:
    if overwrite:
        db.query(models.ActualExpense).filter(models.ActualExpense.budget_id == budget_id).delete()

    for exp in expenses:
        db_exp = models.ActualExpense(
            budget_id=budget_id,
            item_name=exp.item_name,
            amount=exp.amount,
            unit=exp.unit,
        )
        db.add(db_exp)

    db.commit()
    return True


def get_actual_expenses(db: Session, budget_id: str) -> List[models.ActualExpense]:
    return db.query(models.ActualExpense).filter(models.ActualExpense.budget_id == budget_id).all()


def delete_actual_expense(db: Session, expense_id: int) -> bool:
    db_exp = db.query(models.ActualExpense).filter(models.ActualExpense.id == expense_id).first()
    if db_exp:
        db.delete(db_exp)
        db.commit()
        return True
    return False


def update_actual_expense(db: Session, expense_id: int, expense: schemas.ActualExpenseCreate) -> Optional[models.ActualExpense]:
    db_exp = db.query(models.ActualExpense).filter(models.ActualExpense.id == expense_id).first()
    if db_exp:
        for key, value in expense.model_dump().items():
            setattr(db_exp, key, value)
        db.commit()
        db.refresh(db_exp)
    return db_exp
