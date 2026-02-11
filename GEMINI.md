# 開発仕様書：Osaifill（マルチソース予算管理アプリ）- 完全版 v0.2.0

## 1. プロジェクト概要
複数の予算源（財布）に対し、予定（お買い物リスト）と実績（CSV）を分離管理し、正確な「余り予測」を可視化する。
「予定」と「実績」をあえてマッチングさせず、ステータス管理によって計算対象を切り替える運用思想に基づきます。

## 2. 技術スタック
* **Backend**: FastAPI, SQLAlchemy, Pydantic, Python 3.10+
* **Database**: SQLite (file-based)
* **Frontend**: React (Vite), Tailwind CSS v4, shadcn/ui, Lucide React, Recharts (グラフ表示)
* **Features**: i18next (EN/JP), next-themes (Dark/Light)

## 3. データベースモデル (SQLAlchemy)

```python
class Member(Base):
    __tablename__ = "members"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True) # 担当者名マスタ

class Budget(Base):
    __tablename__ = "budgets"
    # IDはユーザー入力可。空の場合はUUID。
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    unit = Column(String, default="円")
    description = Column(Text)
    
    assignments = relationship("BudgetAssignment", back_populates="budget", cascade="all, delete-orphan")
    actual_expenses = relationship("ActualExpense", back_populates="budget", cascade="all, delete-orphan")
    import_setting = relationship("ImportSetting", back_populates="budget", uselist=False)

class Purchase(Base):
    __tablename__ = "purchases"
    id = Column(Integer, primary_key=True)
    member_name = Column(String) # 担当メンバー名
    category = Column(String) # 区分：固定費, 旅費, その他
    item_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    unit = Column(String, default="円")
    status = Column(String) # ステータス：書いただけ, 見積済み, 買い物中, 購入済み, 保留
    priority = Column(Integer, default=3) # 優先度
    note = Column(Text) # 備考
    
    assignments = relationship("BudgetAssignment", back_populates="purchase", cascade="all, delete-orphan")

class BudgetAssignment(Base):
    __tablename__ = "budget_assignments"
    id = Column(Integer, primary_key=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"))
    budget_id = Column(String, ForeignKey("budgets.id"))
    amount = Column(Float, nullable=False)
    
    purchase = relationship("Purchase", back_populates="assignments")
    budget = relationship("Budget", back_populates="assignments")

class ActualExpense(Base):
    __tablename__ = "actual_expenses"
    id = Column(Integer, primary_key=True)
    budget_id = Column(String, ForeignKey("budgets.id"))
    item_name = Column(String)
    amount = Column(Float, nullable=False)
    unit = Column(String, default="円")

class ImportSetting(Base):
    __tablename__ = "import_settings"
    budget_id = Column(String, ForeignKey("budgets.id"), primary_key=True)
    mapping_json = Column(Text) # CSV列マッピング
```

## 4. 業務ロジック・集計定義

### 4.1 支払額と予定額の定義
* **実績支払額**: `ActualExpense` の合計。
* **支払予定額 (個別)**: `実績支払額` + `Purchase(書いただけ, 見積済み)の割当合計`。
* **支払予定額 (全体)**: `固定費合計` + `Purchase(書いただけ, 見積済み)の総計`。
* **余り予測**: `予算総額` - `支払予定額`。

### 4.2 ダッシュボード表示項目
1. **予算別サマリ**:
   * [表] 名前、総額、支払額、余り
   * [表] 名前、総額、支払予定額、余り予測
2. **全体サマリ**:
   * [表] 総額、支払額、収支
   * [表] 総額、支払予定額、余り予測
3. **固定費分析**:
   * [表] 全体の総額、固定費、総額ー固定費（余り）
4. **旅費内訳**:
   * [表] 区分が「旅費」の全アイテム（ステータス不問）を表示し、その総額を計算。
5. **ビジュアライゼーション**:
   * 上記各サマリ項目に対し、円グラフ（総額に対する構成比や進捗）を表示。

### 4.3 CSV/Excel 入出力
* **実績（ActualExpense）**: 予算ごとにインポート（上書き/追加）。
* **お買い物リスト（Purchase）**: 全体インポート（上書き/追加）およびエクスポート。

## 5. UI/UX デザイン指針
* **初期設定**: メンバー登録、デフォルト単位の設定画面。
* **買い物リスト**: 行展開による予算分配、均等分配/100%割当補助ボタン。
* **視認性**: 「買い物中」「購入済み」アイテムはグレーアウトおよび打ち消し線。
