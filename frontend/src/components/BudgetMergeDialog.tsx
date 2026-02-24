import { useState } from "react";
import { useTranslation } from "react-i18next";
import { budgetApi } from "@/lib/api";
import { X, GitMerge } from "lucide-react";

interface Budget {
  budget_id: string;
  name: string;
}

interface BudgetMergeDialogProps {
  sourceBudget: Budget;
  allBudgets: Budget[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BudgetMergeDialog({ sourceBudget, allBudgets, onClose, onSuccess }: BudgetMergeDialogProps) {
  const { t } = useTranslation();
  const [targetBudgetId, setTargetBudgetId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTargets = allBudgets.filter(b => b.budget_id !== sourceBudget.budget_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBudgetId) return;

    const targetBudget = availableTargets.find(b => b.budget_id === targetBudgetId);
    if (!confirm(t('budget_merge.confirm', { source: sourceBudget.name, target: targetBudget?.name }))) {
      return;
    }

    setIsSubmitting(true);
    try {
      await budgetApi.merge(sourceBudget.budget_id, targetBudgetId);
      alert(t('budget_merge.success'));
      onSuccess();
    } catch (error) {
      console.error("Failed to merge budgets", error);
      alert(t('budget_merge.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-ui-h2 font-bold mb-2 flex items-center gap-2">
          <GitMerge className="h-6 w-6 text-primary" />
          {t('budget_merge.title')}
        </h2>
        
        <p className="text-ui-base text-muted-foreground mb-6">
          {t('budget_merge.description', { source: sourceBudget.name })}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-ui-base font-medium">{t('budget_merge.select_target')}</label>
            <select
              required
              className="w-full p-2 rounded-md border bg-background text-ui-base h-11"
              value={targetBudgetId}
              onChange={(e) => setTargetBudgetId(e.target.value)}
            >
              <option value="">{t('common.unselected')}</option>
              {availableTargets.map(b => (
                <option key={b.budget_id} value={b.budget_id}>
                  {b.name} ({b.budget_id})
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit"
            disabled={!targetBudgetId || isSubmitting}
            className="w-full bg-primary text-primary-foreground p-3 rounded-md font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <GitMerge className="h-5 w-5" />
            {isSubmitting ? t('common.loading') : t('budget_merge.merge_button')}
          </button>
        </form>
      </div>
    </div>
  );
}
