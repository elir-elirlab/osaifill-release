import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { actualExpenseApi } from "@/lib/api";
import { X, Plus, Trash2, Edit2, Check } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

interface Budget {
  budget_id: string;
  name: string;
}

interface ActualExpense {
  id: number;
  item_name: string;
  amount: number;
}

interface ActualExpenseSettingsProps {
  budget: Budget;
  onClose: () => void;
  onRefresh: () => void;
}

export function ActualExpenseSettings({ budget, onClose, onRefresh }: ActualExpenseSettingsProps) {
  const { t } = useTranslation();
  const { displayUnit } = useSettings();
  const [expenses, setExpenses] = useState<ActualExpense[]>([]);
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState("");
  const [editingAmount, setEditingAmount] = useState<number>(0);

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await actualExpenseApi.list(budget.budget_id);
      setExpenses(data);
    } catch (e) {
      console.error("Failed to fetch expenses", e);
    }
  }, [budget.budget_id]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchExpenses();
    });
  }, [fetchExpenses]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || amount === 0) return;
    try {
      await actualExpenseApi.create(budget.budget_id, {
        item_name: itemName,
        amount: Number(amount),
        unit: displayUnit
      });
      setItemName("");
      setAmount(0);
      fetchExpenses();
      onRefresh();
    } catch {
      alert(t('common.failed'));
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await actualExpenseApi.update(id, {
        item_name: editingItem,
        amount: Number(editingAmount),
        unit: displayUnit
      });
      setEditingId(null);
      fetchExpenses();
      onRefresh();
    } catch {
      alert(t('common.failed'));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('confirm_delete'))) {
      try {
        await actualExpenseApi.delete(id);
        fetchExpenses();
        onRefresh();
      } catch {
        alert(t('common.failed'));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-2xl rounded-xl shadow-lg border p-6 relative max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-ui-h2 font-bold mb-2">{t('actual')} ({t('budget')}: {budget.name})</h2>
        <p className="text-ui-base text-muted-foreground mb-6">{t('dashboard_view.actual_based')}</p>
        
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-[1fr,150px,auto] gap-3 mb-6 items-end">
          <div className="space-y-1">
            <label className="text-ui-tiny uppercase font-bold text-muted-foreground block mb-1">{t('common.item_name')}</label>
            <input required className="w-full p-2 rounded-md border bg-background text-ui-base" value={itemName} onChange={(e) => setItemName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-ui-tiny uppercase font-bold text-muted-foreground block mb-1">{t('common.amount')}</label>
            <input required type="number" className="w-full p-2 rounded-md border bg-background text-ui-base" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <button type="submit" className="bg-primary text-primary-foreground p-2 rounded-md hover:opacity-90 transition-opacity">
            <Plus className="h-6 w-6" />
          </button>
        </form>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {expenses.length === 0 ? (
            <p className="text-ui-base text-muted-foreground text-center py-8">{t('no_items')}</p>
          ) : (
            expenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between p-3 rounded-md bg-accent/20 border border-accent/30 group">
                {editingId === exp.id ? (
                  <div className="flex-1 flex flex-wrap gap-2">
                    <input className="flex-1 min-w-30 p-1 text-ui-base rounded border bg-background" value={editingItem} onChange={(e) => setEditingItem(e.target.value)} />
                    <input type="number" className="w-25 p-1 text-ui-base rounded border bg-background text-right" value={editingAmount} onChange={(e) => setEditingAmount(Number(e.target.value))} />
                    <div className="flex gap-1">
                      <button onClick={() => handleUpdate(exp.id)} className="text-primary hover:text-primary/80"><Check className="h-5 w-5" /></button>
                      <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="font-medium text-ui-base">{exp.item_name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-ui-base">{exp.amount.toLocaleString()} {displayUnit}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingId(exp.id); setEditingItem(exp.item_name); setEditingAmount(exp.amount); }} className="text-muted-foreground hover:text-primary"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(exp.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t flex justify-between items-center text-ui-base font-bold">
          <span>{t('dashboard_view.amount_paid')}</span>
          <span className="text-ui-h3 text-primary">{expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} {displayUnit}</span>
        </div>
      </div>
    </div>
  );
}
