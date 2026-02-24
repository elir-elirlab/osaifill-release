from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime


# --- Dataset ---
class DatasetBase(BaseModel):
    name: str


class DatasetCreate(DatasetBase):
    pass


class DatasetUpdate(BaseModel):
    name: Optional[str] = None


class Dataset(DatasetBase):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Rollover (Migration) ---
class DatasetRollover(BaseModel):
    new_name: str
    source_dataset_id: Optional[str] = None
    carry_over_budget: bool = True
    carry_over_members: bool = True
    carry_over_settings: bool = True


# --- Member ---
class MemberBase(BaseModel):
    name: str
    dataset_id: Optional[str] = None


class MemberCreate(MemberBase):
    dataset_id: str


class MemberUpdate(BaseModel):
    name: Optional[str] = None


class Member(MemberBase):
    id: int
    dataset_id: str
    model_config = ConfigDict(from_attributes=True)


# --- BudgetAssignment ---
class BudgetAssignmentBase(BaseModel):
    budget_id: str
    amount: float


class BudgetAssignmentCreate(BudgetAssignmentBase):
    pass


class BudgetAssignment(BudgetAssignmentBase):
    id: int
    purchase_id: int
    model_config = ConfigDict(from_attributes=True)


# --- Purchase ---
class PurchaseBase(BaseModel):
    dataset_id: Optional[str] = None
    member_name: Optional[str] = None
    category: Optional[str] = None
    item_name: str
    amount: float
    unit: Optional[str] = "JPY"
    status: Optional[str] = "書いただけ"
    priority: Optional[int] = 3
    note: Optional[str] = None


class PurchaseCreate(PurchaseBase):
    dataset_id: str
    assignments: List[BudgetAssignmentCreate] = []


class PurchaseUpdate(BaseModel):
    member_name: Optional[str] = None
    category: Optional[str] = None
    item_name: Optional[str] = None
    amount: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[int] = None
    note: Optional[str] = None
    assignments: Optional[List[BudgetAssignmentCreate]] = None


class Purchase(PurchaseBase):
    id: int
    dataset_id: str
    assignments: List[BudgetAssignment] = []
    model_config = ConfigDict(from_attributes=True)


# --- ActualExpense ---
class ActualExpenseBase(BaseModel):
    budget_id: Optional[str] = None
    item_name: Optional[str] = None
    amount: float
    unit: Optional[str] = "JPY"


class ActualExpenseCreate(ActualExpenseBase):
    pass


class ActualExpense(ActualExpenseBase):
    id: int
    budget_id: str
    model_config = ConfigDict(from_attributes=True)


# --- ImportSetting ---
class ImportSettingBase(BaseModel):
    mapping_json: str


class ImportSettingCreate(ImportSettingBase):
    budget_id: str


class ImportSetting(ImportSettingBase):
    budget_id: str
    model_config = ConfigDict(from_attributes=True)


class PurchaseImportSettingBase(BaseModel):
    mapping_json: str


class PurchaseImportSettingCreate(PurchaseImportSettingBase):
    dataset_id: str


class PurchaseImportSetting(PurchaseImportSettingBase):
    dataset_id: str
    model_config = ConfigDict(from_attributes=True)


# --- Budget ---
class BudgetBase(BaseModel):
    id: Optional[str] = None
    dataset_id: Optional[str] = None
    name: str
    total_amount: float
    unit: Optional[str] = "JPY"
    description: Optional[str] = None


class BudgetCreate(BudgetBase):
    dataset_id: str


class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    total_amount: Optional[float] = None
    unit: Optional[str] = None
    description: Optional[str] = None


class BudgetMerge(BaseModel):
    source_budget_id: str
    target_budget_id: str


class Budget(BudgetBase):
    id: str
    dataset_id: str
    assignments: List[BudgetAssignment] = []
    actual_expenses: List[ActualExpense] = []
    import_setting: Optional[ImportSetting] = None
    model_config = ConfigDict(from_attributes=True)


# --- Dashboard Summary ---
class BudgetSummary(BaseModel):
    budget_id: str
    name: str
    total_amount: float
    actual_total: float
    planned_total: float
    remaining_forecast: float
    unit: str
    description: Optional[str] = None


class DashboardSummary(BaseModel):
    overall_actual_total: float
    overall_planned_total: float
    overall_remaining_forecast: float
    unassigned_planned_total: float
    fixed_cost_total: float
    fixed_cost_planned_total: float
    travel_planned_total: float
    other_planned_total: float
    travel_cost_total: float
    budgets: List[BudgetSummary]
    travel_items: List[Purchase]
