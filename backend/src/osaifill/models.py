import uuid
from sqlalchemy import Column, String, Float, ForeignKey, Text, Integer, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    members = relationship("Member", back_populates="dataset", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="dataset", cascade="all, delete-orphan")
    purchases = relationship("Purchase", back_populates="dataset", cascade="all, delete-orphan")
    purchase_import_setting = relationship("PurchaseImportSetting", back_populates="dataset", uselist=False, cascade="all, delete-orphan")

class PurchaseImportSetting(Base):
    __tablename__ = "purchase_import_settings"
    dataset_id = Column(String, ForeignKey("datasets.id"), primary_key=True)
    mapping_json = Column(Text) # 列名マッピング保存用
    
    dataset = relationship("Dataset", back_populates="purchase_import_setting")

class Member(Base):
    __tablename__ = "members"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    name = Column(String, nullable=False)
    
    dataset = relationship("Dataset", back_populates="members")

class Budget(Base):
    __tablename__ = "budgets"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    name = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    unit = Column(String, default="JPY")
    description = Column(Text)
    
    dataset = relationship("Dataset", back_populates="budgets")
    assignments = relationship("BudgetAssignment", back_populates="budget", cascade="all, delete-orphan")
    actual_expenses = relationship("ActualExpense", back_populates="budget", cascade="all, delete-orphan")
    import_setting = relationship("ImportSetting", back_populates="budget", uselist=False, cascade="all, delete-orphan")

class Purchase(Base):
    __tablename__ = "purchases"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    member_name = Column(String)
    category = Column(String) # 固定費, 旅費, その他
    item_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    unit = Column(String, default="JPY")
    status = Column(String) # 書いただけ, 見積済み, 買い物中, 購入済み, 保留
    priority = Column(Integer, default=3)
    note = Column(Text)
    
    dataset = relationship("Dataset", back_populates="purchases")
    assignments = relationship("BudgetAssignment", back_populates="purchase", cascade="all, delete-orphan")

class BudgetAssignment(Base):
    __tablename__ = "budget_assignments"
    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=False)
    budget_id = Column(String, ForeignKey("budgets.id"), nullable=False)
    amount = Column(Float, nullable=False)
    
    purchase = relationship("Purchase", back_populates="assignments")
    budget = relationship("Budget", back_populates="assignments")

class ActualExpense(Base):
    __tablename__ = "actual_expenses"
    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(String, ForeignKey("budgets.id"), nullable=False)
    item_name = Column(String)
    amount = Column(Float, nullable=False)
    unit = Column(String, default="JPY")
    
    budget = relationship("Budget", back_populates="actual_expenses")

class ImportSetting(Base):
    __tablename__ = "import_settings"
    budget_id = Column(String, ForeignKey("budgets.id"), primary_key=True)
    mapping_json = Column(Text) # 列名マッピング保存用
    
    budget = relationship("Budget", back_populates="import_setting")
