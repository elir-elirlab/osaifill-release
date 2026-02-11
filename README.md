# Osaifill

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Osaifill** is a multi-source household account book application designed to bridge the gap between planned shopping lists and actual expenses. It visualizes "Remaining Forecasts" across multiple budgets (wallets) through a unique status-based calculation logic.

---

## 🌟 Key Features

- **Period (Dataset) Management**: Separate your data by year, month, or event. Easily switch between current and archived household data.
- **Dynamic Rollover**: Transition to a new period while carrying over members, CSV mapping settings, and combined remaining balances.
- **Smart Shopping List**: Powerful search (regex supported), filtering, and sorting to handle large lists efficiently.
- **Visual Analytics**: Real-time progress tracking with stacked progress bars and interactive charts (Recharts).
- **Advanced CSV Import/Export**: 
  - Drag & Drop support for CSV files.
  - Custom column mapping that remembers your settings per dataset.
  - Localization support for exported files.
- **Highly Customizable**:
  - Global display unit settings (USD, JPY, etc.).
  - Centralized font size control (Semantic UI sizing).
  - Dark/Light mode support.
- **Multi-language**: Full support for English and Japanese.

---

## ⚙️ Setup

### 1. Environment Configuration
Copy the `.env.example` to `.env` and adjust the settings if necessary.

```bash
cp .env.example .env
```

### 2. Run with Docker (Recommended)
Docker Compose will automatically handle the database persistence by mounting `./backend` to the container.

```bash
docker compose up -d --build
```
Access the app at `http://localhost:8080`.

### 3. Manual Setup (Development)

**Backend (FastAPI):**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install .
uvicorn osaifill.main:app --reload
```

**Frontend (React/Vite):**
```bash
cd frontend
npm install
npm run dev
```
Access the dev server at `http://localhost:5173`.

---

## 💡 Getting Started
1. On first launch, create your first **Period (Dataset)** (e.g., "Fiscal Year 2025").
2. Go to **Settings** to register **Members** and set your preferred **Display Unit**.
3. Create **Budgets** (Wallets) and start adding items to your **Purchase List**!

---

## 🛠️ Tech Stack
- **Backend**: FastAPI, SQLAlchemy, Pydantic, SQLite (Python 3.10+)
- **Frontend**: React (Vite), Tailwind CSS v4, Lucide React, Recharts
- **Infrastructure**: Docker, Docker Compose

---

## 📄 License
This project is licensed under the [MIT License](./LICENSE).

---
---

# Osaifill (おさいふぃる) - 日本語

複数の予算源（財布）に対し、予定（お買い物リスト）と実績（CSV）を分離管理し、正確な「余り予測」を可視化するマルチソース家計簿アプリです。

## 🌟 主な機能

- **期間（データセット）管理**: 年度、月、イベントごとにデータを完全に分離。過去の家計データの閲覧・編集もスムーズです。
- **データ繰り越し（Rollover）**: メンバー、CSVマッピング設定、および実績ベースの余り予算をまとめて新しい期間へ引き継げます。
- **高度なお買い物リスト**: 正規表現対応の検索、ステータス・カテゴリ絞り込み、柔軟なソート機能を搭載。
- **直感的なダッシュボード**: 実績と予定を色分けしたプログレスバーや円グラフで、家計状況をリアルタイムに可視化。
- **CSVインポート/エクスポート**: 
  - ドラッグ＆ドロップ対応。
  - 柔軟な列マッピング設定（自動保存機能付き）。
  - 表示言語（日本語/英語）に合わせた多言語出力。
- **カスタマイズ性**:
  - 自由な表示単位設定（JPY, USD, 円 など）。
  - フォントサイズの一括設定（Semantic UI sizing）。
  - ダーク/ライトモード対応。

## ⚙️ セットアップ

### 1. 環境設定
`.env.example` を `.env` にコピーして必要に応じて編集してください。

```bash
cp .env.example .env
```

### 2. Docker で起動 (推奨)
データベース（`backend/osaifill.db`）はホストマシンと共有されるため、コンテナを削除してもデータは維持されます。

```bash
docker compose up -d --build
```
`http://localhost:8080` でアクセス可能です。

### 3. 手動起動 (開発用)

**バックエンド:** `backend` ディレクトリで `pip install .` 後、`uvicorn` を起動。
**フロントエンド:** `frontend` ディレクトリで `npm install` 後、`npm run dev` を起動。

## 💡 はじめに
1. 起動後、まず最初の **管理期間（データセット）** を作成します（例：「2025年度」など）。
2. 「設定」から **メンバー** の登録と **表示単位** を設定してください。
3. **予算** を作成し、「お買い物リスト」に予定を登録していきましょう。

---

## 📄 ライセンス
本プロジェクトは [MIT License](./LICENSE) のもとで公開されています。
