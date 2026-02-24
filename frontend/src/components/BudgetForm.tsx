import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { budgetApi } from "@/lib/api";
import { X } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

interface Budget {
  id?: string;
  budget_id?: string;
  name: string;
  total_amount: number;
  unit: string;
  description?: string;
}

interface BudgetFormProps {
  datasetId: string;
  budget?: Budget | null; // 編集時は既存データが渡される
  onClose: () => void;
  onSuccess: () => void;
}

export function BudgetForm({ datasetId, budget, onClose, onSuccess }: BudgetFormProps) {
  const { t } = useTranslation();
  const { displayUnit } = useSettings();
  const [id, setId] = useState(() => budget ? (budget.id || budget.budget_id || "") : "");
  const [name, setName] = useState(() => budget ? (budget.name || "") : "");
  const [amount, setAmount] = useState<number>(() => budget ? (budget.total_amount || 0) : 0);
  const [unit, setUnit] = useState(() => budget ? (budget.unit || displayUnit) : displayUnit);
  const [description, setDescription] = useState(() => budget ? (budget.description || "") : "");

  // budgetが変更された場合に同期（本来はkeyを切り替えてコンポーネントを再マウントすべきですが、既存の挙動を維持）
  useEffect(() => {
    if (budget) {
      Promise.resolve().then(() => {
        setId(budget.id || budget.budget_id || "");
        setName(budget.name || "");
        setAmount(budget.total_amount || 0);
        setUnit(budget.unit || displayUnit);
        setDescription(budget.description || "");
      });
    }
  }, [budget, displayUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      dataset_id: datasetId,
      name,
      total_amount: amount,
      unit,
      description
    };

    try {
      if (budget) {
        await budgetApi.update(id, data);
      } else {
        await budgetApi.create({ ...data, id: id || undefined });
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save budget", error);
      alert(t('budget_form.save_failed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-ui-h2 font-bold mb-6">
          {budget ? t('budget_form.edit_title') : t('budget_form.add_title')}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-ui-base font-medium">{t('budget_form.id_label')}</label>
            <input 
              className="w-full p-2 rounded-md border bg-background disabled:opacity-50 text-ui-base"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder={t('budget_form.id_placeholder')}
              disabled={!!budget}
            />
          </div>

          <div className="space-y-2">
            <label className="text-ui-base font-medium">{t('common.name')}</label>
            <input 
              required
              className="w-full p-2 rounded-md border bg-background text-ui-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-ui-base font-medium">{t('budget_form.total_amount')}</label>
            <input 
              required
              type="number"
              className="w-full p-2 rounded-md border bg-background text-ui-base"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-ui-base font-medium">{t('unit')}</label>
            <input 
              className="w-full p-2 rounded-md border bg-background text-ui-base"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-ui-base font-medium">{t('note')} ({t('common.optional')})</label>
            <textarea 
              className="w-full p-2 rounded-md border bg-background h-20 text-ui-base"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('budget_form.note_placeholder')}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-primary text-primary-foreground p-3 rounded-md font-bold hover:opacity-90 transition-opacity"
          >
            {budget ? t('common.update') : t('common.save')}
          </button>
        </form>
      </div>
    </div>
  );
}
