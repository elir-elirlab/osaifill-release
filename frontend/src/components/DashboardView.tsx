import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from "recharts";
import { useSettings } from "@/context/SettingsContext";
import { AlertTriangle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportDashboardToZip } from "@/lib/exportUtils";

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

interface DashboardViewProps {
  summary: DashboardSummary;
}

// 役割に応じた固定色
const COLORS_PROGRESS = ["#10b981", "#3b82f6", "#94a3b8"]; // 実績, 予定(未払), 余り
const COLORS_CATEGORY = ["#ef4444", "#f59e0b", "#8b5cf6"]; // 固定費, 旅費, その他

export function DashboardView({ summary }: DashboardViewProps) {
  const { t } = useTranslation();
  const { displayUnit } = useSettings();
  const hideBanner = import.meta.env.VITE_HIDE_UNASSIGNED_BANNER === "true";

  if (!summary) return null;

  const handleExport = async () => {
    await exportDashboardToZip(summary, displayUnit, t);
  };

  const overallBudgetTotal = summary.budgets.reduce((acc: number, b: BudgetSummary) => acc + b.total_amount, 0);
  
  // 円グラフ用のセグメント計算（重なりを排除）
  const actual = summary.overall_actual_total;
  // 予定（未払分） = 総予定額
  const plannedUnpaid = Math.max(0, summary.overall_planned_total);
  const unassigned = summary.unassigned_planned_total || 0;
  const remaining = Math.max(0, summary.overall_remaining_forecast);
  
  const overallData = [
    { name: t('actual'), value: actual },
    { name: t('planned_unpaid'), value: plannedUnpaid },
    { name: t('forecast'), value: remaining }
  ];

  // 支出構成（予定ベース）
  const categoryData = [
    { name: t('categories.fixed'), value: summary.fixed_cost_planned_total },
    { name: t('categories.travel'), value: summary.travel_planned_total },
    { name: t('categories.other'), value: summary.other_planned_total }
  ];

  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <hr className="border-t border-border opacity-50" />
        <div className="flex items-center justify-between">
          <div className="relative">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-full" />
            <h2 className="text-ui-h1 font-bold tracking-tight pl-2">{t('dashboard_view.summary')}</h2>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors text-ui-base font-medium border shadow-sm"
          >
            <Download className="h-4 w-4" />
            {t('common.export')} (ZIP)
          </button>
        </div>
      </div>

      {/* 警告バナー */}
      {unassigned > 0 && !hideBanner && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-destructive text-destructive-foreground p-2 rounded-full shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-ui-base font-bold text-destructive">
              {t('purchase_list_view.unassigned_warning', { 
                amount: unassigned.toLocaleString(), 
                unit: displayUnit 
              })}
            </p>
          </div>
        </div>
      )}

      {/* ビジュアルチャート */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 全体進捗グラフ */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-ui-tiny font-bold mb-4 border-l-4 border-primary pl-3">{t('dashboard_view.overall_progress')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overallData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5} dataKey="value"
                  animationDuration={800}
                >
                  {overallData.map((_, index) => (
                    <Cell key={`cell-progress-${index}`} fill={COLORS_PROGRESS[index % COLORS_PROGRESS.length]} />
                  ))}
                  <Label 
                    value={`${overallBudgetTotal.toLocaleString()} ${displayUnit}`} 
                    position="center" 
                    fill="currentColor"
                    className="text-ui-tiny font-bold"
                  />
                </Pie>
                <Tooltip formatter={(value: number | string | undefined) => typeof value === 'number' ? `${value.toLocaleString()} ${displayUnit}` : value} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-ui-tiny mt-4 uppercase font-bold tracking-wider">
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground">{t('actual')}</span>
              <span className="text-green-600">{actual.toLocaleString()} {displayUnit}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground">{t('dashboard_view.total_planned')}</span>
              <span className="text-blue-600">{summary.overall_planned_total.toLocaleString()} {displayUnit}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground">{t('forecast')}</span>
              <span className={cn(
                "flex items-center gap-1 font-bold",
                summary.overall_remaining_forecast <= 0 ? "text-destructive" : "text-primary"
              )}>
                {summary.overall_remaining_forecast <= 0 && <AlertTriangle className="h-3.5 w-3.5" />}
                {summary.overall_remaining_forecast.toLocaleString()} {displayUnit}
              </span>
            </div>
          </div>
        </div>

        {/* 支出構成グラフ */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-ui-tiny font-bold mb-4 border-l-4 border-orange-500 pl-3">{t('dashboard_view.expense_structure')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5} dataKey="value"
                  animationDuration={800}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-category-${index}`} fill={COLORS_CATEGORY[index % COLORS_CATEGORY.length]} />
                  ))}
                  <Label 
                    value={`${summary.overall_planned_total.toLocaleString()} ${displayUnit}`} 
                    position="center" 
                    fill="currentColor"
                    className="text-ui-tiny font-bold"
                  />
                </Pie>
                <Tooltip formatter={(value: number | string | undefined) => typeof value === 'number' ? `${value.toLocaleString()} ${displayUnit}` : value} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-ui-tiny mt-4 uppercase font-bold tracking-wider">
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground">{t('categories.fixed')}</span>
              <span className="text-red-600">{summary.fixed_cost_planned_total.toLocaleString()} {displayUnit}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground">{t('categories.travel')}</span>
              <span className="text-orange-600">{summary.travel_planned_total.toLocaleString()} {displayUnit}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground">{t('categories.other')}</span>
              <span className="text-purple-600">{summary.other_planned_total.toLocaleString()} {displayUnit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 予算別サマリテーブル */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-primary rounded-full"></div>
          <h3 className="text-ui-base font-bold">{t('dashboard_view.summary_by_budget')}</h3>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-2">
          {/* 実績ベース */}
          <div className="space-y-4">
            <h4 className="text-ui-base font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              {t('dashboard_view.actual_based')}
            </h4>
            <div className="border rounded-lg overflow-hidden bg-card">
              <table className="w-full text-ui-base">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="p-3 text-left">{t('dashboard_view.budget_name')}</th>
                    <th className="p-3 text-right">{t('dashboard_view.amount_paid')}</th>
                    <th className="p-3 text-right">{t('dashboard_view.remaining')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {summary.budgets.map((b: BudgetSummary) => (
                    <tr key={b.budget_id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{b.name}</td>
                      <td className="p-3 text-right font-mono text-green-600 font-bold">{b.actual_total.toLocaleString()} {displayUnit}</td>
                      <td className="p-3 text-right font-mono text-primary">{(b.total_amount - b.actual_total).toLocaleString()} {displayUnit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 予測ベース */}
          <div className="space-y-4">
            <h4 className="text-ui-base font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              {t('dashboard_view.forecast_based')}
            </h4>
            <div className="border rounded-lg overflow-hidden bg-card">
              <table className="w-full text-ui-base">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="p-3 text-left">{t('dashboard_view.budget_name')}</th>
                    <th className="p-3 text-right">{t('dashboard_view.planned_amount')}</th>
                    <th className="p-3 text-right">{t('dashboard_view.remaining_forecast')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {summary.budgets.map((b: BudgetSummary) => (
                    <tr key={b.budget_id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{b.name}</td>
                      <td className="p-3 text-right font-mono text-blue-600 font-bold">{b.planned_total.toLocaleString()} {displayUnit}</td>
                      <td className="p-3 text-right font-mono text-primary font-bold underline decoration-2">{b.remaining_forecast.toLocaleString()} {displayUnit}</td>
                    </tr>
                  ))}
                  {unassigned > 0 && (
                    <tr className="bg-destructive/5 hover:bg-destructive/10 transition-colors">
                      <td className="p-3 font-medium text-destructive">{t('purchase_list_view.unassigned_amount')}</td>
                      <td className="p-3 text-right font-mono text-destructive font-bold">{unassigned.toLocaleString()} {displayUnit}</td>
                      <td className="p-3 text-right font-mono text-muted-foreground">-</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 固定費と旅費の分析 */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <h3 className="text-ui-base font-bold flex items-center gap-2">
            <span className="h-6 w-1 bg-red-500 rounded-full"></span>
            {t('dashboard_view.fixed_cost_analysis')}
          </h3>
          <div className="border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-ui-base">
              <tbody className="divide-y">
                <tr>
                  <td className="p-4 text-muted-foreground">{t('dashboard_view.total_budget_amount')}</td>
                  <td className="p-4 text-right font-bold">{overallBudgetTotal.toLocaleString()} {displayUnit}</td>
                </tr>
                <tr>
                  <td className="p-4 text-muted-foreground">{t('dashboard_view.total_fixed_costs')}</td>
                  <td className="p-4 text-right text-destructive font-bold">{summary.fixed_cost_total.toLocaleString()} {displayUnit}</td>
                </tr>
                <tr className="bg-accent/10">
                  <td className="p-4 font-bold">{t('dashboard_view.disposable_income')}</td>
                  <td className="p-4 text-right font-bold text-primary text-ui-tiny">{(overallBudgetTotal - summary.fixed_cost_total).toLocaleString()} {displayUnit}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-ui-base font-bold flex items-center gap-2">
            <span className="h-6 w-1 bg-orange-500 rounded-full"></span>
            {t('dashboard_view.travel_cost_breakdown')}
          </h3>
          <div className="border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-ui-base">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 text-left">{t('common.item_name')}</th>
                  <th className="p-3 text-right">{t('common.amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summary.travel_items.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-muted-foreground">{t('dashboard_view.no_travel_items')}</td>
                  </tr>
                ) : (
                  summary.travel_items.map((item: Purchase) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="font-medium">{item.item_name}</div>
                        <div className="text-ui-tiny text-muted-foreground">
                          {item.member_name || t('dashboard_view.no_member_assigned')} / {
                            item.status === "書いただけ" ? t('status.written') :
                            item.status === "見積済み" ? t('status.estimated') :
                            item.status === "買い物中" ? t('status.shopping') :
                            item.status === "購入済み" ? t('status.purchased') :
                            item.status === "購入しない" ? t('status.not_purchasing') :
                            t('status.pending')
                          }
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono">{item.amount.toLocaleString()} {displayUnit}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {summary.travel_items.length > 0 && (
                <tfoot className="bg-muted/30 border-t font-bold text-primary">
                  <tr>
                    <td className="p-3 text-left">{t('dashboard_view.total_travel_costs')}</td>
                    <td className="p-3 text-right font-mono">{summary.travel_cost_total.toLocaleString()} {displayUnit}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
