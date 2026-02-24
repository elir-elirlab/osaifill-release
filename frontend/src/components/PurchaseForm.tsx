import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { purchaseApi, memberApi } from "@/lib/api";
import { X, Calculator, AlertTriangle } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

interface Budget {
  id?: string;
  budget_id?: string;
  name: string;
}

interface BudgetAssignment {
  budget_id: string;
  amount: number;
}

interface Purchase {
  id: number;
  item_name: string;
  amount: number;
  unit?: string;
  category?: string;
  member_name?: string;
  priority: number;
  note?: string;
  assignments: BudgetAssignment[];
}

interface Member {
  id: number;
  name: string;
}

interface PurchaseFormProps {
  datasetId: string;
  purchase?: Purchase | null; // 編集時は既存データ
  budgets: Budget[];
  onClose: () => void;
  onSuccess: () => void;
}

export function PurchaseForm({ datasetId, purchase, budgets, onClose, onSuccess }: PurchaseFormProps) {
  const { t } = useTranslation();
  const { displayUnit } = useSettings();
  const [itemName, setItemName] = useState(() => purchase?.item_name || "");
  const [amount, setAmount] = useState<number>(() => purchase?.amount || 0);
  const [unit, setUnit] = useState(() => purchase?.unit || displayUnit);
  const [category, setCategory] = useState(() => purchase?.category || "その他");
  const [memberName, setMemberName] = useState(() => purchase?.member_name || "");
  const [priority, setPriority] = useState<number>(() => purchase?.priority || 3);
  const [note, setNote] = useState(() => purchase?.note || "");
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>(() => 
    purchase?.assignments?.map(as => as.budget_id) || []
  );
  const [assignments, setAssignments] = useState<{ [key: string]: number }>(() => {
    const asgns: { [key: string]: number } = {};
    purchase?.assignments?.forEach(as => {
      asgns[as.budget_id] = as.amount;
    });
    return asgns;
  });
  const [members, setMembers] = useState<Member[]>([]);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await memberApi.list(datasetId);
      setMembers(data);
    } catch (e) {
      console.error("Failed to fetch members", e);
    }
  }, [datasetId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchMembers();
    });
  }, [fetchMembers]);

  useEffect(() => {
    if (purchase) {
      Promise.resolve().then(() => {
        setItemName(purchase.item_name || "");
        setAmount(purchase.amount || 0);
        setUnit(purchase.unit || displayUnit);
        setCategory(purchase.category || "その他");
        setMemberName(purchase.member_name || "");
        setPriority(purchase.priority || 3);
        setNote(purchase.note || "");
        
        const selIds: string[] = [];
        const asgns: { [key: string]: number } = {};
        purchase.assignments?.forEach((as) => {
          selIds.push(as.budget_id);
          asgns[as.budget_id] = as.amount;
        });
        setSelectedBudgets(selIds);
        setAssignments(asgns);
      });
    }
  }, [purchase, displayUnit]);

  const toggleBudget = (id: string) => {
    if (!id) return;
    setSelectedBudgets(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const distributeEqually = () => {
    if (selectedBudgets.length === 0) return;
    const share = amount / selectedBudgets.length;
    const newAssignments: { [key: string]: number } = {};
    selectedBudgets.forEach(id => {
      newAssignments[id] = share;
    });
    setAssignments(newAssignments);
  };

  const assignFull = (id: string) => {
    if (!id) return;
    setSelectedBudgets([id]);
    setAssignments({ [id]: amount });
  };

  const assignmentSum = selectedBudgets.reduce((sum, id) => sum + (assignments[id] || 0), 0);
  const isAmountMismatched = Math.abs(assignmentSum - amount) > 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      dataset_id: datasetId,
      item_name: itemName,
      amount: Number(amount),
      unit,
      category,
      member_name: memberName || undefined,
      priority,
      note,
      assignments: selectedBudgets.map(id => ({
        budget_id: id,
        amount: Number(assignments[id] || 0)
      }))
    };

    try {
      if (purchase) {
        await purchaseApi.update(purchase.id, data);
      } else {
        await purchaseApi.create({ ...data, status: "書いただけ" });
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save purchase", error);
      alert(t('budget_form.save_failed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-2xl rounded-xl shadow-lg border p-6 relative max-h-[95vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-ui-base font-bold mb-6">
          {purchase ? t('purchase_form.edit_title') : t('add_purchase')}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-ui-base font-medium">{t('member')}</label>
                <select className="w-full p-2 rounded-md border bg-background text-ui-base" value={memberName} onChange={(e) => setMemberName(e.target.value)}>
                  <option value="">{t('common.unselected')}</option>
                  {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-ui-base font-medium">{t('common.item_name')}</label>
                <input required className="w-full p-2 rounded-md border bg-background text-ui-base" value={itemName} onChange={(e) => setItemName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-ui-base font-medium">{t('common.amount')}</label>
                  <input required type="number" className="w-full p-2 rounded-md border bg-background text-ui-base" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <label className="text-ui-base font-medium">{t('unit')}</label>
                  <input className="w-full p-2 rounded-md border bg-background text-ui-base" value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-ui-base font-medium">{t('category')}</label>
                  <select className="w-full p-2 rounded-md border bg-background text-ui-base" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="その他">{t('categories.other')}</option>
                    <option value="固定費">{t('categories.fixed')}</option>
                    <option value="旅費">{t('categories.travel')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-ui-base font-medium">{t('priority')}</label>
                  <select className="w-full p-2 rounded-md border bg-background text-ui-base" value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
                    {[1,2,3,4,5].map(p => (
                      <option key={p} value={p}>{t(`priority_levels.${p}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-ui-base font-medium">{t('note')}</label>
                <textarea className="w-full p-2 rounded-md border bg-background h-20 text-ui-base" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-ui-base font-medium">{t('purchase_form.distribution_title')}</label>
                <button type="button" onClick={distributeEqually} className="text-ui-base flex items-center gap-1 text-primary hover:underline">
                  <Calculator className="h-3 w-3" />
                  {t('purchase_form.distribute_equally')}
                </button>
              </div>
              <div className="grid gap-2 overflow-y-auto max-h-100 pr-2 text-ui-base">
                {isAmountMismatched && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="text-ui-small">
                      <p className="font-bold">{t('purchase_list_view.amount_mismatch', { sum: assignmentSum.toLocaleString(), amount: amount.toLocaleString() })}</p>
                    </div>
                  </div>
                )}
                {budgets.map((b) => {
                  const bId = (b.id || b.budget_id) as string;
                  if (!bId) return null;
                  return (
                    <div key={bId} className="flex flex-col p-3 border rounded-md bg-accent/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={selectedBudgets.includes(bId)} onChange={() => toggleBudget(bId)} className="h-4 w-4" />
                          <span className="text-ui-base font-medium">{b.name}</span>
                        </div>
                        <button type="button" onClick={() => assignFull(bId)} className="text-ui-tiny bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80">100%</button>
                      </div>
                      {selectedBudgets.includes(bId) && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-ui-base text-muted-foreground">{t('common.amount')}:</span>
                          <input type="number" className="flex-1 text-right p-1 text-ui-base rounded border bg-background" value={assignments[bId] || 0} onChange={(e) => setAssignments({...assignments, [bId]: Number(e.target.value)})} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-primary text-primary-foreground p-3 rounded-md font-bold hover:opacity-90 transition-opacity">
            {purchase ? t('common.update') : t('common.save')}
          </button>
        </form>
      </div>
    </div>
  );
}
