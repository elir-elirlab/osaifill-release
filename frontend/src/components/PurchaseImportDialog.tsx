import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { purchaseApi } from "@/lib/api";
import { X, Settings, FileSpreadsheet, AlertCircle, Upload } from "lucide-react";
import { useDatasets } from "@/context/DatasetContext";
import { cn } from "@/lib/utils";

interface PurchaseImportDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function PurchaseImportDialog({ onClose, onSuccess }: PurchaseImportDialogProps) {
  const { t } = useTranslation();
  const { activeDatasetId } = useDatasets();
  const [file, setFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mapping, setMapping] = useState({
    item_name: "アイテム名",
    amount: "金額",
    member_name: "担当者",
    category: "区分",
    priority: "優先度",
    note: "備考",
    status: "ステータス",
    budget_id: "対応お財布ID",
    asgn_amount: "割当金額"
  });

  useEffect(() => {
    const fetchSetting = async () => {
      if (!activeDatasetId) return;
      try {
        const setting = await purchaseApi.getImportSetting(activeDatasetId);
        if (setting && setting.mapping_json) {
          const savedMapping = JSON.parse(setting.mapping_json);
          // 保存された設定とデフォルトの設定をマージします
          setMapping(prev => ({
            ...prev,
            ...savedMapping
          }));
        }
      } catch (e) {
        console.error("Failed to fetch import setting", e);
      }
    };
    fetchSetting();
  }, [activeDatasetId]);

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
    if (!file || !activeDatasetId) return;

    setIsImporting(true);
    try {
      // 1. 設定を保存
      await purchaseApi.saveImportSetting(activeDatasetId, JSON.stringify(mapping));
      
      // 2. インポート実行
      await purchaseApi.importCsv(activeDatasetId, file, overwrite);
      
      onSuccess();
    } catch {
      alert(t('import_dialog.import_failed'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-2xl rounded-xl shadow-lg border p-6 relative max-h-[95vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-ui-h2 font-bold mb-6 flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          {t('import_csv')}
        </h2>
        
        <form onSubmit={handleImport} className="space-y-6 overflow-y-auto pr-2">
          <div className="space-y-4 bg-accent/10 p-4 rounded-lg border border-accent/20">
            <h3 className="text-ui-base font-bold flex items-center gap-2 text-primary">
              <Settings className="h-4 w-4" />
              {t('mapping_settings')}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-ui-tiny uppercase font-bold text-muted-foreground">{t('column_item_name')}*</label>
                <input required className="w-full p-2 text-ui-base rounded border bg-background focus:ring-2 focus:ring-primary/20 outline-none" value={mapping.item_name} onChange={e => setMapping({...mapping, item_name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-ui-tiny uppercase font-bold text-muted-foreground">{t('column_amount')}*</label>
                <input required className="w-full p-2 text-ui-base rounded border bg-background focus:ring-2 focus:ring-primary/20 outline-none" value={mapping.amount} onChange={e => setMapping({...mapping, amount: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-ui-tiny uppercase font-bold text-muted-foreground">{t('import_dialog.column_member_name')}</label>
                <input className="w-full p-2 text-ui-base rounded border bg-background focus:ring-2 focus:ring-primary/20 outline-none" value={mapping.member_name} onChange={e => setMapping({...mapping, member_name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-ui-tiny uppercase font-bold text-muted-foreground">{t('import_dialog.column_category')}</label>
                <input className="w-full p-2 text-ui-base rounded border bg-background focus:ring-2 focus:ring-primary/20 outline-none" value={mapping.category} onChange={e => setMapping({...mapping, category: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-ui-tiny uppercase font-bold text-muted-foreground">{t('import_dialog.column_priority')}</label>
                <input className="w-full p-2 text-ui-base rounded border bg-background focus:ring-2 focus:ring-primary/20 outline-none" value={mapping.priority} onChange={e => setMapping({...mapping, priority: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-ui-tiny uppercase font-bold text-muted-foreground">{t('import_dialog.column_note')}</label>
                <input className="w-full p-2 text-ui-base rounded border bg-background focus:ring-2 focus:ring-primary/20 outline-none" value={mapping.note} onChange={e => setMapping({...mapping, note: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-ui-tiny uppercase font-bold text-muted-foreground">{t('import_dialog.column_status')}</label>
                <input className="w-full p-2 text-ui-base rounded border bg-background focus:ring-2 focus:ring-primary/20 outline-none" value={mapping.status} onChange={e => setMapping({...mapping, status: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-ui-tiny uppercase font-bold text-muted-foreground">{t('import_dialog.column_budget_id')}</label>
                <input className="w-full p-2 text-ui-base rounded border bg-background focus:ring-2 focus:ring-primary/20 outline-none" value={mapping.budget_id} onChange={e => setMapping({...mapping, budget_id: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-ui-tiny uppercase font-bold text-muted-foreground">{t('import_dialog.column_asgn_amount')}</label>
                <input className="w-full p-2 text-ui-base rounded border bg-background focus:ring-2 focus:ring-primary/20 outline-none" value={mapping.asgn_amount} onChange={e => setMapping({...mapping, asgn_amount: e.target.value})} />
              </div>
            </div>
            <p className="text-ui-tiny text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {t('import_dialog.setting_auto_save')}
            </p>
          </div>

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
                  <p className="text-ui-base font-bold text-foreground truncate max-w-full px-4">{file.name}</p>
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
                checked={overwrite} 
                onChange={(e) => setOverwrite(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="overwrite" className="text-ui-base select-none cursor-pointer">{t('purchase_list_view.confirm_overwrite')}</label>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isImporting || !file}
            className="w-full bg-primary text-primary-foreground p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            <Upload className="h-5 w-5" />
            {isImporting ? t('import_dialog.importing') : t('import_dialog.save_and_import')}
          </button>
        </form>
      </div>
    </div>
  );
}
