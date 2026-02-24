import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import api from "@/lib/api";
import { X, Upload, Save, FileSpreadsheet, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Budget {
  id?: string;
  budget_id?: string;
  name: string;
}

interface ImportDialogProps {
  budget: Budget;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportDialog({ budget, onClose, onSuccess }: ImportDialogProps) {
  const { t } = useTranslation();
  const [mapping, setMapping] = useState({ item_name: "", amount: "" });
  const [file, setFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const bId = budget.budget_id || budget.id;
        const res = await api.get(`/budgets/${bId}/import-setting`);
        if (res.data?.mapping_json) {
          setMapping(JSON.parse(res.data.mapping_json));
        }
      } catch (e) {
        console.error("Failed to fetch import setting", e);
      }
    };
    fetchSetting();
  }, [budget]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const bId = budget.budget_id || budget.id;

    try {
      // 1. 設定を自動保存
      await api.post(`/budgets/${bId}/import-setting`, {
        mapping_json: JSON.stringify(mapping)
      });

      // 2. CSVをインポート
      const formData = new FormData();
      formData.append("file", file);
      formData.append("overwrite", String(overwrite));

      const res = await api.post(`/budgets/${bId}/import-csv`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      alert(t('import_success', { count: res.data.count }));
      onSuccess();
    } catch {
      alert(t('import_dialog.import_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-ui-h2 font-bold mb-2 flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          {t('import_csv')}
        </h2>
        <p className="text-ui-base text-muted-foreground mb-6">{budget.name}</p>
        
        <form onSubmit={handleImport} className="space-y-6">
          <section className="space-y-3 p-4 bg-accent/20 rounded-lg border border-accent/20">
            <h3 className="text-ui-base font-bold flex items-center gap-2 text-primary">
              <Save className="h-4 w-4" /> {t('mapping_settings')}
            </h3>
            <p className="text-ui-tiny text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {t('import_dialog.setting_auto_save')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-ui-tiny uppercase font-bold text-muted-foreground">{t('column_item_name')}*</label>
                <input 
                  required
                  className="w-full p-2 text-ui-base rounded border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                  value={mapping.item_name}
                  onChange={(e) => setMapping({ ...mapping, item_name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-ui-tiny uppercase font-bold text-muted-foreground">{t('column_amount')}*</label>
                <input 
                  required
                  className="w-full p-2 text-ui-base rounded border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                  value={mapping.amount}
                  onChange={(e) => setMapping({ ...mapping, amount: e.target.value })}
                />
              </div>
            </div>
          </section>

          <div className="space-y-4">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center",
                isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-muted/30",
                file ? "bg-green-500/5 border-green-500/50" : ""
              )}
            >
              <input 
                type="file" 
                accept=".csv"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <Upload className={cn("h-10 w-10 mb-2 transition-colors", file ? "text-green-500" : "text-muted-foreground")} />
              {file ? (
                <div className="space-y-1">
                  <p className="text-ui-base font-bold text-foreground truncate max-w-[250px]">{file.name}</p>
                  <p className="text-ui-tiny text-green-600 font-medium">クリックまたはドラッグで変更</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-ui-base font-medium">{t('import_dialog.csv_file')}</p>
                  <p className="text-ui-tiny text-muted-foreground">CSVファイルをここにドラッグ＆ドロップ、またはクリックして選択</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 px-1">
              <input 
                type="checkbox" 
                id="overwrite"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
              />
              <label htmlFor="overwrite" className="text-ui-base select-none cursor-pointer">{t('overwrite_existing')}</label>
            </div>

            <button 
              type="submit"
              disabled={loading || !file}
              className="w-full bg-primary text-primary-foreground p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Upload className="h-5 w-5" />
              {loading ? t('import_dialog.importing') : t('import_dialog.save_and_import')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
