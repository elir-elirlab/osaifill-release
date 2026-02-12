import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Trash2, CheckCircle2, Circle, Download, Upload, Tag, User, AlertCircle, Settings, FileText, ShoppingCart, Search, Filter, ArrowUpDown, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { purchaseApi } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";
import { useDatasets } from "@/context/DatasetContext";
import { PurchaseImportDialog } from "./PurchaseImportDialog";

interface Purchase {
  id: number;
  item_name: string;
  amount: number;
  unit: string;
  status: string;
  category: string;
  member_name: string;
  priority: number;
  note: string;
  assignments: { budget_id: string; amount: number }[];
}

interface PurchaseListProps {
  purchases: Purchase[];
  onRefresh: () => void;
  onEdit: (purchase: Purchase) => void;
}

export function PurchaseList({ purchases, onRefresh, onEdit }: PurchaseListProps) {
  const { t } = useTranslation();
  const { displayUnit } = useSettings();
  const { activeDatasetId } = useDatasets();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // 検索・フィルター・ソートの状態管理
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"id" | "amount" | "priority" | "category">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // フィルタリングと検索の適用
  const filteredItems = useMemo(() => {
    return purchases.filter(item => {
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      const matchesCategory = filterCategory === "all" || item.category === filterCategory;
      
      let matchesSearch = true;
      if (searchQuery) {
        try {
          const regex = new RegExp(searchQuery, 'i');
          matchesSearch = regex.test(item.item_name) || regex.test(item.note || "");
        } catch (e) {
          matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.note || "").toLowerCase().includes(searchQuery.toLowerCase());
        }
      }
      
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [purchases, filterStatus, filterCategory, searchQuery]);

  // ソートの適用
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "id") comparison = a.id - b.id;
      else if (sortBy === "amount") comparison = a.amount - b.amount;
      else if (sortBy === "priority") comparison = a.priority - b.priority;
      else if (sortBy === "category") comparison = (a.category || "").localeCompare(b.category || "");
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredItems, sortBy, sortOrder]);

  const toggleStatus = async (purchase: Purchase) => {
    const statusMap: { [key: string]: string } = {
      "書いただけ": "見積済み",
      "見積済み": "買い物中",
      "買い物中": "購入済み",
      "購入済み": "購入しない",
      "購入しない": "書いただけ"
    };
    const nextStatus = statusMap[purchase.status] || "書いただけ";
    await purchaseApi.updateStatus(purchase.id, nextStatus);
    onRefresh();
  };

  const deleteItem = async (id: number) => {
    if (confirm(t('confirm_delete'))) {
      await purchaseApi.delete(id);
      onRefresh();
    }
  };

  const handleExportCsv = () => {
    if (sortedItems.length === 0) return;

    // CSVヘッダー
    const headers = [
      t('member'),
      t('category'),
      t('common.item_name'),
      t('common.amount'),
      t('unit'),
      t('common.status'),
      t('priority'),
      t('note'),
      t('purchase_list_view.column_budget_id'),
      t('purchase_list_view.column_assigned_amount')
    ];

    const rows = sortedItems.flatMap(p => {
      const baseInfo = [
        p.member_name || '',
        p.category === "固定費" ? t('categories.fixed') : p.category === "旅費" ? t('categories.travel') : t('categories.other'),
        p.item_name,
        p.amount,
        p.unit,
        p.status === "書いただけ" ? t('status.written') : 
        p.status === "見積済み" ? t('status.estimated') : 
        p.status === "買い物中" ? t('status.shopping') : 
        p.status === "購入済み" ? t('status.purchased') : 
        p.status === "購入しない" ? t('status.not_purchasing') : 
        t('status.pending'),
        t(`priority_levels.${p.priority}`),
        p.note || ''
      ];

      if (p.assignments.length === 0) {
        return [[...baseInfo, '', '']];
      }

      return p.assignments.map(asgn => [...baseInfo, asgn.budget_id, asgn.amount]);
    });

    // BOM付きUTF-8
    const csvContent = "\ufeff" + [headers, ...rows].map(e => e.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `purchases_${activeDatasetId || 'export'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h2 className="text-ui-h2 font-bold w-full md:w-auto">{t('purchase_list_view.title')}</h2>
          <div className="flex gap-2 w-full md:w-auto justify-end">
                                <button 
                                  onClick={handleExportCsv}
                                  className="flex items-center gap-1 text-ui-small bg-secondary px-3 py-1.5 rounded-md hover:bg-secondary/80 transition-colors"
                                >              <Download className="h-3.5 w-3.5" />
              {t('common.export')}
            </button>
            <button 
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-1 text-ui-small bg-secondary px-3 py-1.5 rounded-md hover:bg-secondary/80 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              {t('common.import')}
            </button>
          </div>
        </div>

        {/* コントロールパネル */}
        <div className="bg-card border rounded-lg p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 検索バー */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('purchase_list_view.search_placeholder')}
                className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-ui-base focus:ring-2 focus:ring-primary/20 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select 
                  className="p-2 rounded-md border bg-background text-ui-small outline-none"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">{t('purchase_list_view.all_statuses')}</option>
                  <option value="書いただけ">{t('status.written')}</option>
                  <option value="見積済み">{t('status.estimated')}</option>
                  <option value="買い物中">{t('status.shopping')}</option>
                  <option value="購入済み">{t('status.purchased')}</option>
                  <option value="購入しない">{t('status.not_purchasing')}</option>
                </select>
                <select 
                  className="p-2 rounded-md border bg-background text-ui-small outline-none"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">{t('purchase_list_view.all_categories')}</option>
                  <option value="固定費">{t('categories.fixed')}</option>
                  <option value="旅費">{t('categories.travel')}</option>
                  <option value="その他">{t('categories.other')}</option>
                </select>
              </div>

              <div className="h-6 w-px bg-border mx-1 hidden md:block" />

              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <select 
                  className="p-2 rounded-md border bg-background text-ui-small outline-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="id">{t('purchase_list_view.sort_added')}</option>
                  <option value="amount">{t('purchase_list_view.sort_amount')}</option>
                  <option value="priority">{t('purchase_list_view.sort_priority')}</option>
                  <option value="category">{t('purchase_list_view.sort_category')}</option>
                </select>
                <button 
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="p-2 rounded-md border bg-background hover:bg-accent text-ui-small"
                  title="昇順・降順を切り替え"
                >
                  {sortOrder === "asc" ? "▲" : "▼"}
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-ui-tiny text-muted-foreground flex justify-between items-center">
            <span>
              {t('purchase_list_view.items_found', { count: sortedItems.length })}
              {searchQuery && t('purchase_list_view.searching_for', { query: searchQuery })}
            </span>
            {(searchQuery || filterStatus !== "all" || filterCategory !== "all") && (
              <button 
                onClick={() => { setSearchQuery(""); setFilterStatus("all"); setFilterCategory("all"); }}
                className="text-primary hover:underline"
              >
                {t('purchase_list_view.reset_filters')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        {sortedItems.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <p className="text-ui-base">{t('purchase_list_view.no_items_found')}</p>
            {(searchQuery || filterStatus !== "all" || filterCategory !== "all") && (
              <button 
                onClick={() => { setSearchQuery(""); setFilterStatus("all"); setFilterCategory("all"); }}
                className="text-ui-small text-primary hover:underline"
              >
                {t('purchase_list_view.clear_all_filters')}
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {sortedItems.map((item) => (
              <div key={item.id} className={cn(
                "transition-all",
                (item.status === "購入済み" || item.status === "買い物中" || item.status === "購入しない") && "bg-muted/20"
              )}>
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/30"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleStatus(item); }}
                      className={cn(
                        "transition-all shrink-0 p-1 rounded-full hover:bg-accent/50",
                        item.status === "書いただけ" && "text-muted-foreground",
                        item.status === "見積済み" && "text-blue-500",
                        item.status === "買い物中" && "text-orange-500",
                        item.status === "購入済み" && "text-green-500",
                        item.status === "購入しない" && "text-muted-foreground"
                      )}
                    >
                      {item.status === "書いただけ" && <Circle className="h-6 w-6" />}
                      {item.status === "見積済み" && <FileText className="h-6 w-6" />}
                      {item.status === "買い物中" && <ShoppingCart className="h-6 w-6" />}
                      {item.status === "購入済み" && <CheckCircle2 className="h-6 w-6" />}
                      {item.status === "購入しない" && <XCircle className="h-6 w-6" />}
                    </button>
                    <div className="flex flex-col min-w-0">
                      <span className={cn(
                        "font-medium truncate text-ui-base",
                        (item.status === "購入済み" || item.status === "購入しない") && "line-through text-muted-foreground"
                      )}>
                        {item.item_name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-ui-tiny px-1.5 py-0.5 rounded bg-accent text-accent-foreground flex items-center gap-1">
                          <Tag className="h-2.5 w-2.5" /> {
                            item.category === "固定費" ? t('categories.fixed') :
                            item.category === "旅費" ? t('categories.travel') :
                            t('categories.other')
                          }
                        </span>
                        {item.member_name && (
                          <span className="text-ui-tiny text-muted-foreground flex items-center gap-1">
                            <User className="h-2.5 w-2.5" /> {item.member_name}
                          </span>
                        )}
                        <span className={cn(
                          "text-ui-tiny flex items-center gap-1",
                          item.priority >= 4 ? "text-destructive font-bold" : "text-muted-foreground"
                        )}>
                          <AlertCircle className="h-2.5 w-2.5" /> 
                          {t(`priority_levels.${item.priority}`)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-ui-base">{item.amount.toLocaleString()} {displayUnit}</div>
                      <div className="text-ui-tiny text-muted-foreground">{
                        item.status === "書いただけ" ? t('status.written') :
                        item.status === "見積済み" ? t('status.estimated') :
                        item.status === "買い物中" ? t('status.shopping') :
                        item.status === "購入済み" ? t('status.purchased') :
                        item.status === "購入しない" ? t('status.not_purchasing') :
                        t('status.pending')
                      }</div>
                    </div>
                    {expandedId === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {expandedId === item.id && (
                  <div className="px-14 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {item.note && (
                      <div className="text-ui-base bg-muted/50 p-3 rounded-md italic text-muted-foreground">
                        「 {item.note} 」
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="text-ui-tiny font-bold text-muted-foreground uppercase tracking-wider">{t('purchase_list_view.budget_distribution')}</div>
                      {item.assignments.map((as, idx) => (
                        <div key={idx} className="flex items-center justify-between text-ui-base bg-accent/20 p-2.5 rounded-md border border-accent/30">
                          <span className="font-medium text-ui-small">{as.budget_id}</span>
                          <span className="font-mono font-bold">{as.amount.toLocaleString()} {displayUnit}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2 gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                        className="flex items-center gap-1 text-ui-base text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        {t('common.edit')}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                        className="flex items-center gap-1 text-ui-base text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showImportDialog && (
        <PurchaseImportDialog 
          onClose={() => setShowImportDialog(false)}
          onSuccess={() => { setShowImportDialog(false); onRefresh(); }}
        />
      )}
    </div>
  );
}
