import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { TFunction } from "i18next";

interface BudgetSummary {
  budget_id: string;
  name: string;
  total_amount: number;
  actual_total: number;
  planned_total: number;
  remaining_forecast: number;
}

interface Purchase {
  id: number;
  item_name: string;
  amount: number;
  member_name?: string;
  category?: string;
  status: string;
}

interface DashboardSummary {
  overall_actual_total: number;
  overall_planned_total: number;
  overall_remaining_forecast: number;
  unassigned_planned_total: number;
  fixed_cost_total: number;
  fixed_cost_planned_total: number;
  travel_planned_total: number;
  other_planned_total: number;
  travel_cost_total: number;
  budgets: BudgetSummary[];
  travel_items: Purchase[];
}

const escapeCSV = (val: unknown): string => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportDashboardToZip = async (summary: DashboardSummary, unit: string, t: TFunction) => {
  const zip = new JSZip();
  const bom = "\ufeff";

  // 1. 全体サマリ
  const overallBudgetTotal = summary.budgets.reduce((acc, b) => acc + b.total_amount, 0);
  let overallCsv = bom + [t('export.item'), t('export.amount_with_unit', { unit })].map(escapeCSV).join(",") + "\n";
  overallCsv += [ t('export.overall_total'), overallBudgetTotal ].map(escapeCSV).join(",") + "\n";
  overallCsv += [ t('export.actual_paid'), summary.overall_actual_total ].map(escapeCSV).join(",") + "\n";
  overallCsv += [ t('export.planned_amount'), summary.overall_planned_total ].map(escapeCSV).join(",") + "\n";
  overallCsv += [ t('export.forecast_remaining'), summary.overall_remaining_forecast ].map(escapeCSV).join(",") + "\n";
  overallCsv += [ t('export.unassigned_planned'), summary.unassigned_planned_total ].map(escapeCSV).join(",") + "\n";
  zip.file("overall_summary.csv", overallCsv);

  // 2. お財布別サマリ
  let budgetCsv = bom + [
    t('export.wallet_id'), 
    t('export.wallet_name'), 
    t('export.total'), 
    t('export.actual_paid'), 
    t('export.actual_based_remaining'), 
    t('export.planned_amount'), 
    t('export.forecast_remaining')
  ].map(escapeCSV).join(",") + "\n";
  
  summary.budgets.forEach(b => {
    budgetCsv += [
      b.budget_id, 
      b.name, 
      b.total_amount, 
      b.actual_total, 
      b.total_amount - b.actual_total, 
      b.planned_total, 
      b.remaining_forecast
    ].map(escapeCSV).join(",") + "\n";
  });
  zip.file("wallet_summaries.csv", budgetCsv);

  // 3. 固定費分析
  let fixedCostCsv = bom + [t('export.item'), t('export.amount_with_unit', { unit })].map(escapeCSV).join(",") + "\n";
  fixedCostCsv += [ t('export.overall_total'), overallBudgetTotal ].map(escapeCSV).join(",") + "\n";
  fixedCostCsv += [ t('export.fixed_cost_total'), summary.fixed_cost_total ].map(escapeCSV).join(",") + "\n";
  fixedCostCsv += [ t('export.disposable_income'), overallBudgetTotal - summary.fixed_cost_total ].map(escapeCSV).join(",") + "\n";
  zip.file("fixed_costs.csv", fixedCostCsv);

  // 4. 旅費内訳
  let travelCsv = bom + [
    t('common.item_name'), 
    t('export.member'), 
    t('common.status'), 
    t('export.amount_with_unit', { unit })
  ].map(escapeCSV).join(",") + "\n";
  
  summary.travel_items.forEach(item => {
    // ステータスの翻訳
    const statusText = item.status === "書いただけ" ? t('status.written') :
                       item.status === "見積済み" ? t('status.estimated') :
                       item.status === "買い物中" ? t('status.shopping') :
                       item.status === "購入済み" ? t('status.purchased') :
                       item.status === "購入しない" ? t('status.not_purchasing') :
                       t('status.pending');

    travelCsv += [
      item.item_name, 
      item.member_name || t('dashboard_view.no_member_assigned'), 
      statusText, 
      item.amount
    ].map(escapeCSV).join(",") + "\n";
  });
  
  if (summary.travel_items.length > 0) {
    travelCsv += [ t('export.summary'), "", "", summary.travel_cost_total ].map(escapeCSV).join(",") + "\n";
  }
  zip.file("travel_items.csv", travelCsv);

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `osaifill_dashboard_export_${new Date().toISOString().split('T')[0]}.zip`);
};
