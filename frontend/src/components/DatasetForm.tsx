import { useState } from "react";
import { useTranslation } from "react-i18next";
import { datasetApi } from "@/lib/api";
import { X, Copy, Users, Settings as SettingsIcon, Wallet } from "lucide-react";
import { useDatasets } from "@/context/DatasetContext";

interface DatasetFormProps {
  onClose: () => void;
  onSuccess: (newId: string) => void;
}

export function DatasetForm({ onClose, onSuccess }: DatasetFormProps) {
  const { t } = useTranslation();
  const { datasets, activeDatasetId } = useDatasets();
  const [name, setName] = useState("");
  const [sourceId, setSourceId] = useState<string | null>(activeDatasetId);
  const [carryBudget, setCarryBudget] = useState(true);
  const [carryMembers, setCarryMembers] = useState(true);
  const [carrySettings, setCarrySettings] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      const newDs = await datasetApi.rollover({
        new_name: name,
        source_dataset_id: sourceId,
        carry_over_budget: carryBudget,
        carry_over_members: carryMembers,
        carry_over_settings: carrySettings
      });
      onSuccess(newDs.id);
    } catch (error) {
      console.error("Failed to create dataset", error);
      alert(t('common.failed'));
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
        
        <h2 className="text-ui-h2 font-bold mb-6">{t('dataset.create_title')}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-ui-base font-medium">{t('dataset.name_label')}</label>
            <input 
              required
              className="w-full p-2 rounded-md border bg-background text-ui-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('dataset.name_placeholder')}
              autoFocus
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-ui-base font-bold flex items-center gap-2">
              <Copy className="h-4 w-4" />
              {t('dataset.carry_over_options')}
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-ui-small text-muted-foreground">{t('dataset.source_label')}</label>
                <select 
                  className="p-1 text-ui-small rounded border bg-background"
                  value={sourceId || ""}
                  onChange={(e) => setSourceId(e.target.value || null)}
                >
                  <option value="">{t('dataset.no_carry_over')}</option>
                  {datasets.map(ds => (
                    <option key={ds.id} value={ds.id}>{ds.name}</option>
                  ))}
                </select>
              </div>

              {sourceId && (
                <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={carryMembers} onChange={e => setCarryMembers(e.target.checked)} className="h-4 w-4" />
                    <span className="text-ui-base group-hover:text-primary transition-colors flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" /> {t('dataset.carry_members')}
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={carrySettings} onChange={e => setCarrySettings(e.target.checked)} className="h-4 w-4" />
                    <span className="text-ui-base group-hover:text-primary transition-colors flex items-center gap-2">
                      <SettingsIcon className="h-3.5 w-3.5" /> {t('dataset.carry_settings')}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={carryBudget} onChange={e => setCarryBudget(e.target.checked)} className="h-4 w-4" />
                    <span className="text-ui-base group-hover:text-primary transition-colors flex items-center gap-2">
                      <Wallet className="h-3.5 w-3.5" /> {t('dataset.carry_budget')}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground p-3 rounded-md font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? t('dataset.creating') : t('dataset.create_button')}
          </button>
        </form>
      </div>
    </div>
  );
}
