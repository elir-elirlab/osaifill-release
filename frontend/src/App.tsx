import { useState, useEffect, useCallback } from "react"
import { useTheme } from "next-themes"
import "./i18n"
import { useTranslation } from "react-i18next"
import { ShoppingBag, Moon, Sun, Plus, Wallet, ShoppingCart, Settings, History, ChevronRight, ChevronDown } from "lucide-react"
import { dashboardApi, purchaseApi, budgetApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useDatasets } from "@/context/DatasetContext"

// Components
import { BudgetCard } from "@/components/BudgetCard"
import { PurchaseList } from "@/components/PurchaseList"
import { BudgetForm } from "@/components/BudgetForm"
import { BudgetMergeDialog } from "@/components/BudgetMergeDialog"
import { PurchaseForm } from "@/components/PurchaseForm"
import { ImportDialog } from "@/components/ImportDialog"
import { MemberSettings } from "@/components/MemberSettings"
import { DashboardView } from "@/components/DashboardView"
import { ActualExpenseSettings } from "@/components/ActualExpenseSettings"
import { DatasetForm } from "@/components/DatasetForm"

interface BudgetAssignment {
  budget_id: string;
  amount: number;
}

interface Purchase {
  id: number;
  item_name: string;
  amount: number;
  unit: string;
  member_name: string;
  category: string;
  status: string;
  priority: number;
  note: string;
  assignments: BudgetAssignment[];
}

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

interface DashboardSummary {
  overall_actual_total: number;
  overall_planned_total: number;
  overall_remaining_forecast: number;
  unassigned_planned_total: number;
  fixed_cost_total: number;
  fixed_cost_planned_total: number;
  travel_planned_total: number;
  other_planned_total: number;
  travel_cost_total: number;
  budgets: Budget[];
  travel_items: Purchase[];
}

function App() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { datasets, activeDatasetId, setActiveDatasetId, refreshDatasets, isLoading: isDatasetLoading } = useDatasets()
  
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [activeTab, setActiveTab] = useState<"dashboard" | "purchases">("dashboard")
  
  // Modals state
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [showDatasetForm, setShowDatasetForm] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState<Budget | null>(null)
  const [showMergeDialog, setShowMergeDialog] = useState<Budget | null>(null)
  const [showActualExpenseSettings, setShowActualExpenseSettings] = useState<Budget | null>(null)
  const [showMemberSettings, setShowMemberSettings] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const activeDataset = datasets.find(d => d.id === activeDatasetId)

  const fetchData = useCallback(async () => {
    if (!activeDatasetId) return;
    try {
      const [summaryData, purchaseData, budgetData] = await Promise.all([
        dashboardApi.getSummary(activeDatasetId),
        purchaseApi.list(activeDatasetId),
        budgetApi.list(activeDatasetId)
      ]);
      setSummary(summaryData);
      setPurchases(purchaseData);
      setBudgets(budgetData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  }, [activeDatasetId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchData();
    });
  }, [fetchData]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "ja" ? "en" : "ja")
  }

  // データセットが全くない場合
  if (!isDatasetLoading && datasets.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
        {/* 言語切り替えボタン（右上に配置） */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleLanguage}
            className="w-12 h-12 flex items-center justify-center text-ui-base font-bold rounded-full bg-accent hover:bg-accent/80 transition-colors shadow-sm"
          >
            {i18n.language === "ja" ? "EN" : "JP"}
          </button>
        </div>

        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="flex flex-col items-center">
            <div className="bg-primary/10 p-4 rounded-3xl mb-4">
              <ShoppingBag className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-5xl font-extrabold tracking-tighter">Osaifill</h1>
            <p className="text-muted-foreground mt-2 text-ui-base">{t('welcome.subtitle')}</p>
          </div>
          
          <div className="bg-card border rounded-2xl p-8 shadow-sm">
            <h2 className="text-ui-h2 font-bold mb-4">{t('welcome.title')}</h2>
            <p className="text-ui-base mb-8 text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t('welcome.description') }} />
            <button 
              onClick={() => setShowDatasetForm(true)}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-ui-h3 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="h-6 w-6" />
              {t('welcome.create_first')}
            </button>
          </div>
        </div>
        {showDatasetForm && (
          <DatasetForm 
            onClose={() => setShowDatasetForm(false)} 
            onSuccess={(id) => {
              setShowDatasetForm(false);
              refreshDatasets();
              setActiveDatasetId(id);
            }} 
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-20">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between py-4 max-w-7xl mx-auto px-4 gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <button 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={() => setActiveTab("dashboard")}
            >
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span className="hidden sm:inline-block font-bold text-ui-h2">Osaifill</span>
            </button>
            
            <div className="h-6 w-px bg-border hidden sm:block" />

            <nav className="flex items-center gap-1">
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={cn(
                  "px-3 py-2 text-ui-base font-medium rounded-md transition-all",
                  activeTab === "dashboard" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {t('dashboard')}
              </button>
              <button 
                onClick={() => setActiveTab("purchases")}
                className={cn(
                  "px-3 py-2 text-ui-base font-medium rounded-md transition-all",
                  activeTab === "purchases" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {t('purchase_list_view.title')}
              </button>
            </nav>
          </div>

          <div className="flex flex-1 items-center justify-end space-x-2">
            {/* データセット切り替えUI */}
            <div className="relative group">
              <button className="flex items-center gap-2 bg-accent/50 px-4 py-2 rounded-full hover:bg-accent transition-colors max-w-60 sm:max-w-xs border border-transparent hover:border-primary/20">
                <History className="h-4 w-4 text-primary shrink-0" />
                <span className="text-ui-small font-bold truncate">
                  {activeDataset?.name || t('dataset.select_period')}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                <div className="p-3 border-b bg-muted/30">
                  <div className="text-ui-tiny font-bold text-muted-foreground uppercase tracking-widest px-1 py-1 flex items-center justify-between">
                    <span>{t('dataset.manage_periods')}</span>
                    <button 
                      onClick={() => setShowDatasetForm(true)} 
                      className="bg-primary text-primary-foreground px-2 py-1 rounded flex items-center gap-1 hover:opacity-90 transition-opacity normal-case"
                    >
                      <Plus className="h-3 w-3" />
                      {t('dataset.new_period')}
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto p-1">
                  {datasets.map(ds => (
                    <button
                      key={ds.id}
                      onClick={() => setActiveDatasetId(ds.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors",
                        activeDatasetId === ds.id ? "bg-primary/10 border border-primary/20" : "hover:bg-accent"
                      )}
                    >
                      <div>
                        <div className={cn("text-ui-base font-bold", activeDatasetId === ds.id ? "text-primary" : "text-foreground")}>{ds.name}</div>
                        <div className="text-ui-tiny text-muted-foreground">
                          {t('dataset.created_at', { date: new Date(ds.created_at).toLocaleDateString() })}
                        </div>
                      </div>
                      {activeDatasetId === ds.id && <ChevronRight className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <nav className="flex items-center space-x-1">
              <button
                onClick={() => setShowMemberSettings(true)}
                className="p-2 rounded-md hover:bg-accent text-muted-foreground"
                title={t('member_settings_view.title')}
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={toggleLanguage}
                className="w-10 h-10 flex items-center justify-center text-ui-base font-bold rounded-md hover:bg-accent"
              >
                {i18n.language === "ja" ? "EN" : "JP"}
              </button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-md hover:bg-accent relative text-muted-foreground"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 left-2 top-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto py-6 px-4 min-h-[calc(100vh-16rem)]">
        {activeTab === "dashboard" ? (
          <div className="flex flex-col gap-10">
            {/* Dashboard Overview */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="relative">
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-full" />
                  <h1 className="text-ui-h1 font-bold tracking-tight pl-2">
                    {t('dashboard')} 
                    <span className="text-muted-foreground font-normal ml-3 border-l pl-3 text-ui-base">
                      {activeDataset?.name}
                    </span>
                  </h1>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
                {summary?.budgets.map((b: Budget) => (
                  <BudgetCard 
                    key={b.budget_id} 
                    budget={b} 
                    onRefresh={fetchData} 
                    onImport={(target) => setShowImportDialog(target)}
                    onEditActual={(target) => setShowActualExpenseSettings(target)}
                    onEdit={(target) => { setEditingBudget(target); setShowBudgetForm(true); }}
                    onMerge={(target) => setShowMergeDialog(target)}
                  />
                ))}
                {budgets.length === 0 && (
                  <div className="col-span-full p-12 border-2 border-dashed rounded-xl text-center text-muted-foreground bg-accent/10">
                    <p className="text-ui-h3 mb-2 font-bold">{t('register_budget')}</p>
                    <button 
                      onClick={() => { setEditingBudget(null); setShowBudgetForm(true); }}
                      className="text-primary hover:underline text-ui-base"
                    >
                      {t('add_budget')}
                    </button>
                  </div>
                )}
              </div>

              {summary && <DashboardView summary={summary} />}
            </section>
          </div>
        ) : (
          /* Purchase List View */
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-ui-h1 font-bold tracking-tight">{t('purchase_list_view.title')} - {activeDataset?.name}</h1>
            </div>
            <PurchaseList 
              purchases={purchases} 
              onRefresh={fetchData} 
              onEdit={(target) => { setEditingPurchase(target); setShowPurchaseForm(true); }}
            />
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4 z-50">
        {showActions && (
          <>
            <div 
              className="fixed inset-0 bg-transparent" 
              onClick={() => setShowActions(false)}
            />
            <div className="flex flex-col gap-2 mb-2 relative z-50 animate-in slide-in-from-bottom-4 fade-in">
              <button 
                onClick={() => { setEditingBudget(null); setShowBudgetForm(true); setShowActions(false); }}
                className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-3 rounded-xl shadow-lg hover:bg-secondary/80 whitespace-nowrap text-ui-base font-bold"
              >
                <Wallet className="h-5 w-5" />
                {t('add_budget')}
              </button>
              <button 
                onClick={() => { setEditingPurchase(null); setShowPurchaseForm(true); setShowActions(false); }}
                className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-3 rounded-xl shadow-lg hover:bg-secondary/80 whitespace-nowrap text-ui-base font-bold"
              >
                <ShoppingCart className="h-5 w-5" />
                {t('add_purchase')}
              </button>
            </div>
          </>
        )}
        <button 
          onClick={() => setShowActions(!showActions)}
          className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative z-50"
        >
          <Plus className={cn("h-8 w-8 transition-transform duration-300", showActions ? "rotate-45" : "")} />
        </button>
      </div>

      {/* Modals */}
      {showBudgetForm && activeDatasetId && (
        <BudgetForm 
          datasetId={activeDatasetId}
          budget={editingBudget}
          onClose={() => { setShowBudgetForm(false); setEditingBudget(null); }} 
          onSuccess={() => { setShowBudgetForm(false); setEditingBudget(null); fetchData(); }} 
        />
      )}
      {showPurchaseForm && activeDatasetId && (
        <PurchaseForm 
          datasetId={activeDatasetId}
          purchase={editingPurchase}
          budgets={budgets}
          onClose={() => { setShowPurchaseForm(false); setEditingPurchase(null); }} 
          onSuccess={() => { setShowPurchaseForm(false); setEditingPurchase(null); fetchData(); }} 
        />
      )}
      {showDatasetForm && (
        <DatasetForm 
          onClose={() => setShowDatasetForm(false)}
          onSuccess={(newId) => { 
            setShowDatasetForm(false); 
            refreshDatasets(); 
            setActiveDatasetId(newId);
          }}
        />
      )}
      {showImportDialog && (
        <ImportDialog 
          budget={showImportDialog}
          onClose={() => setShowImportDialog(null)}
          onSuccess={() => { setShowImportDialog(null); fetchData(); }}
        />
      )}
      {showMergeDialog && (
        <BudgetMergeDialog 
          sourceBudget={showMergeDialog}
          allBudgets={summary?.budgets || []}
          onClose={() => setShowMergeDialog(null)}
          onSuccess={() => { setShowMergeDialog(null); fetchData(); }}
        />
      )}
      {showMemberSettings && activeDatasetId && (
        <MemberSettings 
          datasetId={activeDatasetId}
          onClose={() => setShowMemberSettings(false)}
        />
      )}
      {showActualExpenseSettings && (
        <ActualExpenseSettings 
          budget={showActualExpenseSettings}
          onClose={() => setShowActualExpenseSettings(null)}
          onRefresh={fetchData}
        />
      )}
    </div>
  )
}

export default App
