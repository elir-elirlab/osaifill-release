import { useTranslation } from "react-i18next";
import { Trash2, Upload, Settings, ReceiptJapaneseYen, GitMerge } from "lucide-react";
import { budgetApi } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";

interface Budget {
  budget_id: string;
  name: string;
  total_amount: number;
  actual_total: number;
  planned_total: number;
  remaining_forecast: number;
  unit: string;
  description?: string;
}

interface BudgetCardProps {
  budget: Budget;
  onRefresh: () => void;
  onImport: (budget: Budget) => void;
  onEditActual: (budget: Budget) => void;
  onEdit: (budget: Budget) => void;
  onMerge: (budget: Budget) => void;
}

export function BudgetCard({ budget, onRefresh, onImport, onEditActual, onEdit, onMerge }: BudgetCardProps) {
  const { t } = useTranslation();
  const { displayUnit } = useSettings();
  const actualRate = (budget.actual_total / budget.total_amount) * 100;
  const plannedRate = (budget.planned_total / budget.total_amount) * 100;
  const totalUsageRate = actualRate + plannedRate;
  const isOver = totalUsageRate > 100;

  const handleDelete = async () => {
    if (confirm(t('confirm_delete'))) {
      await budgetApi.delete(budget.budget_id);
      onRefresh();
    }
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm relative group">
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onEditActual(budget)}
          className="p-2 text-muted-foreground hover:text-primary"
          title={t('actual')}
        >
          <ReceiptJapaneseYen className="h-4 w-4" />
        </button>
        <button 
          onClick={() => onImport(budget)}
          className="p-2 text-muted-foreground hover:text-primary"
          title={t('budget_card.import_actual')}
        >
          <Upload className="h-4 w-4" />
        </button>
        <button 
          onClick={() => onEdit(budget)}
          className="p-2 text-muted-foreground hover:text-primary"
          title={t('budget_card.edit_budget')}
        >
          <Settings className="h-4 w-4" />
        </button>
        <button 
          onClick={() => onMerge(budget)}
          className="p-2 text-muted-foreground hover:text-primary"
          title={t('budget_card.merge_budget')}
        >
          <GitMerge className="h-4 w-4" />
        </button>
        <button 
          onClick={handleDelete}
          className="p-2 text-muted-foreground hover:text-destructive"
          title={t('budget_card.delete_budget')}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="p-6 flex flex-col space-y-2">
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ui-h3">{budget.name}</h3>
            <span className="text-ui-base text-muted-foreground font-bold">
              {Math.round(totalUsageRate)}%
            </span>
          </div>
          <span className="text-ui-base text-muted-foreground font-mono opacity-70">
            ID: {budget.budget_id}
          </span>
          {budget.description && (
            <p className="text-ui-sm text-muted-foreground mt-1 italic line-clamp-2" title={budget.description}>
              {budget.description}
            </p>
          )}
        </div>
        
        <div className={`text-2xl font-bold ${budget.remaining_forecast < 0 ? 'text-destructive' : ''}`}>
          {budget.remaining_forecast.toLocaleString()} {displayUnit}
          <span className="text-ui-base font-normal text-muted-foreground ml-2">
            / {budget.total_amount.toLocaleString()} {displayUnit}
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden flex relative">
          {/* 実績セグメント（緑） */}
          <div 
            className="h-full bg-green-500 transition-all duration-500 ease-out"
            style={{ width: `${Math.min(actualRate, 100)}%` }}
          />
          {/* 予定セグメント（青） */}
          {!isOver ? (
            <div 
              className="h-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(plannedRate, 100 - actualRate)}%` }}
            />
          ) : (
            /* 超過分（赤・実績を超えた部分から） */
            <div 
              className="h-full bg-destructive transition-all duration-500 ease-out flex-1"
            />
          )}
        </div>

        <div className="flex justify-between text-ui-base text-muted-foreground pt-1">
          <button 
            onClick={() => onEditActual(budget)}
            className="hover:text-primary transition-colors underline decoration-dotted underline-offset-4"
          >
            {t('actual')}: {budget.actual_total.toLocaleString()} {displayUnit}
          </button>
          <span>{t('planned')}: {budget.planned_total.toLocaleString()} {displayUnit}</span>
        </div>
      </div>
    </div>
  );
}
