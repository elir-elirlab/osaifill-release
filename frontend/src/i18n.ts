import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "budget": "Budget",
      "planned": "Planned",
      "actual": "Actual",
      "forecast": "Forecast",
      "planned_unpaid": "Planned (Unpaid)",
      "register_budget": "Please register a budget.",
      "no_items": "No items found.",
      "confirm_delete": "Are you sure you want to delete this item?",
      "add_purchase": "Add Item",
      "add_budget": "Add Budget",
      "import_csv": "Import CSV",
      "mapping_settings": "Mapping Settings",
      "column_item_name": "Item Name Column",
      "column_amount": "Amount Column",
      "overwrite_existing": "Overwrite existing actual expenses",
      "import_success": "Imported {{count}} items successfully.",
      "settings": "Settings",
      "unit": "Unit",
      "default_unit": "¥",
      "category": "Category",
      "priority": "Priority",
      "priority_levels": {
        "1": "Lowest",
        "2": "Low",
        "3": "Medium",
        "4": "High",
        "5": "Highest"
      },
      "member": "Member",
      "note": "Note",
      "categories": {
        "fixed": "Fixed Cost",
        "travel": "Travel Cost",
        "other": "Other"
      },
      "status": {
        "written": "Proposal",
        "estimated": "Estimated",
        "shopping": "Shopping",
        "purchased": "Purchased",
        "pending": "Pending",
        "not_purchasing": "Not Purchasing"
      },
      "common": {
        "edit": "Edit",
        "delete": "Delete",
        "update": "Update",
        "save": "Save",
        "cancel": "Cancel",
        "import": "Import",
        "export": "Export",
        "name": "Name",
        "amount": "Amount",
        "unselected": "Unselected",
        "item_name": "Item Name",
        "status": "Status",
        "loading": "Loading...",
        "failed": "Failed",
        "success": "Success",
        "optional": "Optional"
      },
      "budget_card": {
        "import_actual": "Import Actuals",
        "edit_budget": "Edit Budget",
        "delete_budget": "Delete Budget"
      },
      "dashboard_view": {
        "overall_progress": "Overall Progress",
        "expense_structure": "Expense Structure (Planned)",
        "total_planned": "Total Planned",
        "summary_by_budget": "Summary by Budget",
        "actual_based": "Actual Based (Paid)",
        "forecast_based": "Forecast Based (Incl. Planned)",
        "budget_name": "Budget Name",
        "amount_paid": "Amount Paid",
        "remaining": "Remaining",
        "planned_amount": "Planned Amount",
        "remaining_forecast": "Remaining Forecast",
        "fixed_cost_analysis": "Fixed Cost Analysis",
        "total_budget_amount": "Total Budget",
        "total_fixed_costs": "Total Fixed Costs",
        "disposable_income": "Disposable Income (Total - Fixed)",
        "travel_cost_breakdown": "Travel Cost Breakdown",
        "no_travel_items": "No travel items found.",
        "no_member_assigned": "No member assigned",
        "total_travel_costs": "Total Travel Costs"
      },
      "settings_view": {
        "currency_notice": "※ This unit will be displayed after all amounts in the app."
      },
      "budget_form": {
        "edit_title": "Edit Budget",
        "add_title": "Add Budget",
        "id_label": "ID (Optional, auto-generated if empty)",
        "id_placeholder": "e.g., main-wallet",
        "total_amount": "Total Amount",
        "note_placeholder": "Notes (Optional)",
        "save_failed": "Failed to save budget."
      },
      "member_settings_view": {
        "title": "Member Management",
        "add_member": "Add Member",
        "new_member_placeholder": "New member name",
        "add_failed": "Failed to add member. Please check if the name is unique.",
        "update_failed": "Failed to update.",
        "no_members": "No members registered."
      },
      "import_dialog": {
        "importing": "Importing...",
        "save_and_import": "Save and Import",
        "import_failed": "Import failed. Please check settings and file format.",
        "csv_file": "CSV File",
        "setting_auto_save": "This setting will also be saved during import.",
        "column_member_name": "Member Column",
        "column_category": "Category Column",
        "column_priority": "Priority Column",
        "column_note": "Note Column",
        "column_status": "Status Column",
        "column_budget_id": "Budget ID Column",
        "column_asgn_amount": "Assignment Amount Column"
      },
      "purchase_form": {
        "select_budget_error": "Please select at least one budget.",
        "distribution_title": "Budget Selection & Distribution",
        "distribute_equally": "Distribute Equally",
        "edit_title": "Edit Item"
      },
      "purchase_list_view": {
        "title": "Purchase List",
        "confirm_overwrite": "Delete all existing items and overwrite? (Cancel to append)",
        "import_completed": "Import completed.",
        "budget_distribution": "Budget Distribution Details",
        "search_placeholder": "Keyword search (regex supported)...",
        "all_statuses": "All Statuses",
        "all_categories": "All Categories",
        "sort_added": "Date Added",
        "sort_amount": "Amount",
        "sort_priority": "Priority",
        "sort_category": "Category",
        "items_found": "{{count}} items found",
        "searching_for": "searching for \"{{query}}\"",
        "reset_filters": "Reset filters",
        "no_items_found": "No items match your criteria.",
        "clear_all_filters": "Clear all filters",
        "column_budget_id": "Budget ID",
        "column_assigned_amount": "Assigned Amount"
      },
      "welcome": {
        "title": "Welcome!",
        "subtitle": "Multi-source budget management app",
        "description": "Let's create a 'Period (Dataset)' to start managing your budget. You can manage it by year or by event.",
        "create_first": "Create First Period"
      }
    }
  },
  ja: {
    translation: {
      "dashboard": "ダッシュボード",
      "budget": "予算",
      "planned": "予定",
      "actual": "実績",
      "forecast": "余り予測",
      "planned_unpaid": "予定(未払)",
      "register_budget": "予算を登録してください。",
      "no_items": "アイテムがありません。",
      "confirm_delete": "本当に削除しますか？",
      "add_purchase": "アイテム追加",
      "add_budget": "予算の追加",
      "import_csv": "CSVインポート",
      "mapping_settings": "列マッピング設定",
      "column_item_name": "項目名の列名",
      "column_amount": "金額の列名",
      "overwrite_existing": "既存の実績データを上書きする",
      "import_success": "{{count}} 件のデータを取り込みました。",
      "settings": "設定",
      "unit": "単位",
      "default_unit": "¥",
      "category": "区分",
      "priority": "優先度",
      "priority_levels": {
        "1": "最低",
        "2": "低",
        "3": "中",
        "4": "高",
        "5": "最優先"
      },
      "member": "担当者",
      "note": "備考",
      "categories": {
        "fixed": "固定費",
        "travel": "旅費",
        "other": "その他"
      },
      "status": {
        "written": "提案",
        "estimated": "見積済み",
        "shopping": "買い物中",
        "purchased": "購入済み",
        "pending": "保留",
        "not_purchasing": "購入しない"
      },
      "common": {
        "edit": "編集",
        "delete": "削除",
        "update": "更新",
        "save": "保存",
        "cancel": "キャンセル",
        "import": "インポート",
        "export": "エクスポート",
        "name": "名前",
        "amount": "金額",
        "unselected": "未選択",
        "item_name": "アイテム名",
        "status": "ステータス",
        "loading": "読み込み中...",
        "failed": "失敗",
        "success": "成功",
        "optional": "任意"
      },
      "budget_card": {
        "import_actual": "実績インポート",
        "edit_budget": "予算を編集",
        "delete_budget": "予算を削除"
      },
      "dashboard_view": {
        "overall_progress": "全体予算の進捗",
        "expense_structure": "支出構成（予定）",
        "total_planned": "支払予定総額",
        "summary_by_budget": "予算別サマリ",
        "actual_based": "実績ベース（支払済）",
        "forecast_based": "予測ベース（予定含む）",
        "budget_name": "予算名",
        "amount_paid": "支払額",
        "remaining": "余り",
        "planned_amount": "予定額",
        "remaining_forecast": "余り予測",
        "fixed_cost_analysis": "固定費分析",
        "total_budget_amount": "全体の予算総額",
        "total_fixed_costs": "固定費合計",
        "disposable_income": "生活余力（総額 - 固定費）",
        "travel_cost_breakdown": "旅費内訳",
        "no_travel_items": "旅費に該当するアイテムはありません。",
        "no_member_assigned": "担当未設定",
        "total_travel_costs": "旅費合計"
      },
      "settings_view": {
        "currency_notice": "※ この単位はアプリ内の金額の後ろに表示されます。"
      },
      "budget_form": {
        "edit_title": "予算の編集",
        "add_title": "予算の追加",
        "id_label": "ID（任意・空欄で自動生成）",
        "id_placeholder": "例: main-wallet",
        "total_amount": "予算総額",
        "note_placeholder": "備考（任意）",
        "save_failed": "保存に失敗しました。"
      },
      "member_settings_view": {
        "title": "メンバー管理",
        "add_member": "メンバー追加",
        "new_member_placeholder": "新しいメンバー名",
        "add_failed": "メンバーの追加に失敗しました。名前が重複していないか確認してください。",
        "update_failed": "更新に失敗しました。",
        "no_members": "メンバーが登録されていません。"
      },
      "import_dialog": {
        "importing": "取り込み中...",
        "save_and_import": "保存してインポートを実行",
        "import_failed": "インポートに失敗しました。設定やファイル形式を確認してください。",
        "csv_file": "CSVファイル",
        "setting_auto_save": "インポート時にこの設定も保存されます。",
        "column_member_name": "担当者の列名",
        "column_category": "区分の列名",
        "column_priority": "優先度の列名",
        "column_note": "備考の列名",
        "column_status": "ステータスの列名",
        "column_budget_id": "対応予算IDの列名",
        "column_asgn_amount": "割当金額の列名"
      },
      "purchase_form": {
        "select_budget_error": "少なくとも1つの予算を選択してください。",
        "distribution_title": "予算の選択と分配",
        "distribute_equally": "均等に分ける",
        "edit_title": "アイテムの編集"
      },
      "purchase_list_view": {
        "title": "お買い物リスト",
        "confirm_overwrite": "既存のリストをすべて削除して上書きしますか？（キャンセルで追加インポート）",
        "import_completed": "インポートが完了しました。",
        "budget_distribution": "予算分配内訳",
        "search_placeholder": "キーワード検索 (正規表現可)...",
        "all_statuses": "すべてのステータス",
        "all_categories": "すべてのカテゴリ",
        "sort_added": "追加順",
        "sort_amount": "金額順",
        "sort_priority": "優先度順",
        "sort_category": "カテゴリ順",
        "items_found": "{{count}} 件のアイテムが見つかりました",
        "searching_for": " (\"{{query}}\" で検索中)",
        "reset_filters": "フィルターをリセット",
        "no_items_found": "条件に一致するアイテムが見つかりません。",
        "clear_all_filters": "すべてのフィルターをクリア",
        "column_budget_id": "対応予算ID",
        "column_assigned_amount": "割当金額"
      },
      "welcome": {
        "title": "ようこそ！",
        "subtitle": "マルチソース予算管理アプリ",
        "description": "まずは家計管理を開始する「期間（データセット）」を作成しましょう。<br/>1年ごとやイベントごとに分けて管理できます。",
        "create_first": "最初の期間を作成する"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ja",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
