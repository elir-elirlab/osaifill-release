import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { memberApi } from "@/lib/api";
import { X, UserPlus, Trash2, Edit2, Check, Coins } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

interface Member {
  id: number;
  name: string;
}

interface MemberSettingsProps {
  datasetId: string;
  onClose: () => void;
}

export function MemberSettings({ datasetId, onClose }: MemberSettingsProps) {
  const { t } = useTranslation();
  const { displayUnit, setDisplayUnit } = useSettings();
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const unitPresets = ["JPY", "USD", "EUR", "GBP", "円"];
  const [customUnit, setCustomUnit] = useState(displayUnit);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    try {
      await memberApi.create({ dataset_id: datasetId, name: newName });
      setNewName("");
      fetchMembers();
    } catch {
      alert(t('member_settings_view.add_failed'));
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingName) return;
    try {
      await memberApi.update(id, { name: editingName });
      setEditingId(null);
      fetchMembers();
    } catch {
      alert(t('member_settings_view.update_failed'));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('confirm_delete'))) {
      await memberApi.delete(id);
      fetchMembers();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border p-6 relative max-h-[95vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-ui-h2 font-bold mb-6">{t('member_settings_view.title')}</h2>
        
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input 
            className="flex-1 p-2 rounded-md border bg-background text-ui-base"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('member_settings_view.new_member_placeholder')}
          />
          <button 
            type="submit"
            className="bg-primary text-primary-foreground p-2 rounded-md hover:opacity-90 transition-opacity"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        </form>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 mb-8 border-b pb-4">
          {members.length === 0 ? (
            <p className="text-ui-base text-muted-foreground text-center py-4">{t('member_settings_view.no_members')}</p>
          ) : (
            members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-md bg-accent/20">
                {editingId === m.id ? (
                  <div className="flex-1 flex gap-2">
                    <input 
                      className="flex-1 p-1 text-ui-base rounded border bg-background"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                    <button onClick={() => handleUpdate(m.id)} className="text-primary hover:text-primary/80">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-ui-base">{m.name}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditingId(m.id); setEditingName(m.name); }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(m.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-2">
          <h3 className="text-ui-h3 font-bold mb-4 flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            {t('settings')}
          </h3>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {unitPresets.map(s => (
                <button
                  key={s}
                  onClick={() => { setDisplayUnit(s); setCustomUnit(s); }}
                  className={cn(
                    "px-3 py-1 rounded-full border text-ui-base transition-all",
                    displayUnit === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:border-primary"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 p-2 rounded-md border bg-background text-ui-base"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder={t('unit')}
              />
              <button
                onClick={() => setDisplayUnit(customUnit)}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 text-ui-base font-bold"
              >
                {t('common.save')}
              </button>
            </div>
            <p className="text-ui-tiny text-muted-foreground">
              {t('settings_view.currency_notice')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
