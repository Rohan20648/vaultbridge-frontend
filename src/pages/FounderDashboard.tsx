import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Handshake, Home, Loader2, Menu, TrendingUp, UserRound, X } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageTransition from "@/components/PageTransition";
import StatusBadge from "@/components/StatusBadge";
import {
  deleteDeal,
  deleteFounder,
  deleteStartup,
  getDeals,
  getDueDiligence,
  getEquityRounds,
  getFounders,
  getHealthScores,
  getIndustries,
  getLocations,
  getMetrics,
  getMilestones,
  getProducts,
  getProductCategories,
  getStartup,
  getStartupCursorSummary,
  getStartupStatusHistory,
  getStartups,
  getTeamHistory,
  getValuations,
  setupStartupDbLab,
  updateDeal,
  updateFounder,
  updateStartup,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const tabs = [
  { key: "overview",  label: "Overview",  icon: Home       },
  { key: "founders",  label: "Founders",  icon: UserRound  },
  { key: "deals",     label: "Deals",     icon: Handshake  },
  { key: "analytics", label: "Analytics", icon: TrendingUp },
  { key: "activity",  label: "Activity",  icon: Activity   },
] as const;

const chartColors = { primary: "hsl(217, 91%, 60%)", secondary: "hsl(160, 84%, 39%)", muted: "hsl(215, 20%, 55%)" };
const startupStatuses = ["Active", "Acquired", "Shutdown", "IPO", "Dormant", "Pivoting"];
const dealStatuses    = ["Pending", "Handshake", "Active", "Closed", "Cancelled"];
const dealTypes       = ["Equity", "Royalty", "Loan", "Convertible Note", "Hybrid"];

const fmtMoney = (v?: string | number | null) => (v == null || v === "" ? "N/A" : `$${Number(v).toLocaleString()}`);
const fmtDate  = (v?: string | null) => v?.slice(0, 10) || "N/A";
const yesNo    = (v?: number | boolean | null) => (v ? "Yes" : "No");

// ─── Types ───────────────────────────────────────────────────────────────────
type StartupRecord = {
  startup_id: number; startup_name?: string; tagline?: string;
  industry_id?: number; industry_name?: string; location_id?: number;
  location_display?: string; website?: string; founded_year?: number;
  registration_number?: string; annual_revenue_usd?: number;
  profit_loss_usd?: number; num_employees?: number;
  total_funding_usd?: number; status?: string;
};
type FounderRecord = {
  founder_id: number; startup_id?: number; first_name?: string;
  last_name?: string; role?: string; equity_percentage?: number;
  email?: string; phone?: string; nationality?: string; linkedin_url?: string; bio?: string;
};
type ProductRecord    = { product_id: number; startup_id?: number; };
type DealRecord = {
  deal_id: number; startup_id?: number; startup_name?: string; sharks?: string;
  deal_amount_usd?: number; deal_equity_percent?: number; deal_type?: string;
  royalty_per_unit?: number; loan_interest_rate?: number; handshake_date?: string;
  closed_date?: string; deal_status?: string; deal_notes?: string;
};
type MilestoneRecord      = { milestone_id: number; startup_id?: number; };
type DueDiligenceRecord   = { dd_id: number; startup_id?: number; conducted_by?: string; dd_status?: string; financial_verified?: number | boolean; legal_cleared?: number | boolean; ip_verified?: number | boolean; };
type EquityRoundRecord    = { round_id: number; startup_id?: number; round_type?: string; amount_raised_usd?: number; };
type MetricRecord         = { metric_id: number; startup_id?: number; snapshot_date?: string; monthly_revenue_usd?: number; monthly_burn_usd?: number; };
type TeamHistoryRecord    = { team_id: number; startup_id?: number; record_date?: string; total_headcount?: number; };
type HealthScoreRecord    = { score_id: number; startup_id?: number; score_date?: string; financial_score?: number; team_score?: number; product_score?: number; market_score?: number; overall_score?: number; };
type ValuationRecord      = { valuation_id: number; startup_id?: number; valuation_date?: string; valuation_usd?: number; };
type StatusHistoryRecord  = { status_history_id: number; changed_date?: string; previous_status?: string; new_status?: string; changed_by?: string; reason?: string; };
type CursorSummary        = { snapshots_processed?: number; average_runway_months?: number; total_revenue_usd?: number; total_burn_usd?: number; };

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error && "response" in error) {
    const r = (error as { response?: { data?: { message?: string } } }).response;
    return r?.data?.message || fallback;
  }
  return fallback;
};

// ─── Inline Edit Modal ───────────────────────────────────────────────────────
type EditAction =
  | { type: "startup";  item: StartupRecord  }
  | { type: "founder";  item: FounderRecord  }
  | { type: "deal";     item: DealRecord     };

const inputCls = "w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1";

function EditModal({ action, onClose, onSave, saving }: {
  action: EditAction;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Record<string, unknown>>(() => {
    if (action.type === "startup") {
      const s = action.item;
      return {
        startup_name: s.startup_name ?? "",
        tagline: s.tagline ?? "",
        website: s.website ?? "",
        founded_year: s.founded_year ?? "",
        registration_number: s.registration_number ?? "",
        annual_revenue_usd: s.annual_revenue_usd ?? "",
        profit_loss_usd: s.profit_loss_usd ?? "",
        num_employees: s.num_employees ?? "",
        total_funding_usd: s.total_funding_usd ?? "",
        status: s.status ?? "Active",
        industry_id: s.industry_id ?? "",
        location_id: s.location_id ?? "",
      };
    }
    if (action.type === "founder") {
      const f = action.item;
      return {
        first_name: f.first_name ?? "",
        last_name: f.last_name ?? "",
        email: f.email ?? "",
        phone: f.phone ?? "",
        nationality: f.nationality ?? "",
        linkedin_url: f.linkedin_url ?? "",
        bio: f.bio ?? "",
      };
    }
    const d = action.item;
    return {
      startup_id: d.startup_id ?? "",
      deal_amount_usd: d.deal_amount_usd ?? "",
      deal_equity_percent: d.deal_equity_percent ?? "",
      deal_type: d.deal_type ?? "Equity",
      royalty_per_unit: d.royalty_per_unit ?? "",
      loan_interest_rate: d.loan_interest_rate ?? "",
      handshake_date: d.handshake_date?.slice(0, 10) ?? "",
      closed_date: d.closed_date?.slice(0, 10) ?? "",
      deal_status: d.deal_status ?? "Pending",
      deal_notes: d.deal_notes ?? "",
    };
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const str = (k: string) => String(form[k] ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-base font-semibold text-foreground">
            {action.type === "startup" ? "Edit Startup"
              : action.type === "founder" ? "Edit Founder"
              : "Edit Deal"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[70vh] px-6 py-5 space-y-4">

          {action.type === "startup" && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className={labelCls}>Startup Name</label><input className={inputCls} value={str("startup_name")} onChange={e => set("startup_name", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Tagline</label><input className={inputCls} value={str("tagline")} onChange={e => set("tagline", e.target.value)} /></div>
              <div><label className={labelCls}>Website</label><input className={inputCls} value={str("website")} onChange={e => set("website", e.target.value)} /></div>
              <div><label className={labelCls}>Founded Year</label><input className={inputCls} type="number" value={str("founded_year")} onChange={e => set("founded_year", e.target.value)} /></div>
              <div><label className={labelCls}>Annual Revenue (USD)</label><input className={inputCls} type="number" value={str("annual_revenue_usd")} onChange={e => set("annual_revenue_usd", e.target.value)} /></div>
              <div><label className={labelCls}>Profit / Loss (USD)</label><input className={inputCls} type="number" value={str("profit_loss_usd")} onChange={e => set("profit_loss_usd", e.target.value)} /></div>
              <div><label className={labelCls}>Employees</label><input className={inputCls} type="number" value={str("num_employees")} onChange={e => set("num_employees", e.target.value)} /></div>
              <div><label className={labelCls}>Total Funding (USD)</label><input className={inputCls} type="number" value={str("total_funding_usd")} onChange={e => set("total_funding_usd", e.target.value)} /></div>
              <div><label className={labelCls}>Registration No.</label><input className={inputCls} value={str("registration_number")} onChange={e => set("registration_number", e.target.value)} /></div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={str("status")} onChange={e => set("status", e.target.value)}>
                  {startupStatuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          {action.type === "founder" && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>First Name</label><input className={inputCls} value={str("first_name")} onChange={e => set("first_name", e.target.value)} /></div>
              <div><label className={labelCls}>Last Name</label><input className={inputCls} value={str("last_name")} onChange={e => set("last_name", e.target.value)} /></div>
              <div><label className={labelCls}>Email</label><input className={inputCls} type="email" value={str("email")} onChange={e => set("email", e.target.value)} /></div>
              <div><label className={labelCls}>Phone</label><input className={inputCls} value={str("phone")} onChange={e => set("phone", e.target.value)} /></div>
              <div><label className={labelCls}>Nationality</label><input className={inputCls} value={str("nationality")} onChange={e => set("nationality", e.target.value)} /></div>
              <div><label className={labelCls}>LinkedIn URL</label><input className={inputCls} value={str("linkedin_url")} onChange={e => set("linkedin_url", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Bio</label><textarea className={inputCls + " min-h-[90px] resize-none"} value={str("bio")} onChange={e => set("bio", e.target.value)} /></div>
            </div>
          )}

          {action.type === "deal" && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>Deal Amount (USD)</label><input className={inputCls} type="number" value={str("deal_amount_usd")} onChange={e => set("deal_amount_usd", e.target.value)} /></div>
              <div><label className={labelCls}>Equity %</label><input className={inputCls} type="number" value={str("deal_equity_percent")} onChange={e => set("deal_equity_percent", e.target.value)} /></div>
              <div>
                <label className={labelCls}>Deal Type</label>
                <select className={inputCls} value={str("deal_type")} onChange={e => set("deal_type", e.target.value)}>
                  {dealTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={str("deal_status")} onChange={e => set("deal_status", e.target.value)}>
                  {dealStatuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Royalty / Unit</label><input className={inputCls} type="number" value={str("royalty_per_unit")} onChange={e => set("royalty_per_unit", e.target.value)} /></div>
              <div><label className={labelCls}>Loan Interest %</label><input className={inputCls} type="number" value={str("loan_interest_rate")} onChange={e => set("loan_interest_rate", e.target.value)} /></div>
              <div><label className={labelCls}>Handshake Date</label><input className={inputCls} type="date" value={str("handshake_date")} onChange={e => set("handshake_date", e.target.value)} /></div>
              <div><label className={labelCls}>Closed Date</label><input className={inputCls} type="date" value={str("closed_date")} onChange={e => set("closed_date", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Notes</label><textarea className={inputCls + " min-h-[80px] resize-none"} value={str("deal_notes")} onChange={e => set("deal_notes", e.target.value)} /></div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border/50">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving} className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-70">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const FounderDashboard = () => {
  const [activeTab,    setActiveTab]    = useState("overview");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [loading,      setLoading]      = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [startup,      setStartup]      = useState<StartupRecord | null>(null);
  const [statusDraft,  setStatusDraft]  = useState("Active");
  const [founders,     setFounders]     = useState<FounderRecord[]>([]);
  const [products,     setProducts]     = useState<ProductRecord[]>([]);
  const [deals,        setDeals]        = useState<DealRecord[]>([]);
  const [milestones,   setMilestones]   = useState<MilestoneRecord[]>([]);
  const [dueDiligence, setDueDiligence] = useState<DueDiligenceRecord[]>([]);
  const [equityRounds, setEquityRounds] = useState<EquityRoundRecord[]>([]);
  const [metrics,      setMetrics]      = useState<MetricRecord[]>([]);
  const [teamHistory,  setTeamHistory]  = useState<TeamHistoryRecord[]>([]);
  const [healthScores, setHealthScores] = useState<HealthScoreRecord[]>([]);
  const [valuations,   setValuations]   = useState<ValuationRecord[]>([]);
  const [statusHistory,setStatusHistory]= useState<StatusHistoryRecord[]>([]);
  const [cursorSummary,setCursorSummary]= useState<CursorSummary | null>(null);
  const [editAction,   setEditAction]   = useState<EditAction | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const { toast } = useToast();

  const refreshDbData = async (startupId: number) => {
    const [startupRes, historyRes, cursorRes] = await Promise.all([
      getStartup(startupId),
      getStartupStatusHistory(startupId),
      getStartupCursorSummary(startupId),
    ]);
    setStartup(startupRes.data);
    setStatusDraft(startupRes.data?.status || "Active");
    setStatusHistory(historyRes.data || []);
    setCursorSummary(cursorRes.data || null);
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [sRes, fRes, pRes, dRes, mRes, ddRes, erRes, meRes, tRes, hRes, vRes] = await Promise.all([
        getStartups(), getFounders(), getProducts(), getDeals(),
        getMilestones(), getDueDiligence(), getEquityRounds(), getMetrics(),
        getTeamHistory(), getHealthScores(), getValuations(),
        getIndustries(), getLocations(), getProductCategories(),
      ]);

      const allStartups: StartupRecord[] = sRes.data || [];
      const savedId = Number(localStorage.getItem("vaultbridge_founder_startup_id"));
      const selected = allStartups.find(x => x.startup_id === savedId) || allStartups[0];
      setStartup(selected);
      setStatusDraft(selected?.status || "Active");

      if (!selected) return;
      const sid = selected.startup_id;

      setFounders    ((fRes.data  || []).filter((x: FounderRecord)       => x.startup_id === sid));
      setProducts    ((pRes.data  || []).filter((x: ProductRecord)        => x.startup_id === sid));
      setDeals       ((dRes.data  || []).filter((x: DealRecord)           => x.startup_id === sid));
      setMilestones  ((mRes.data  || []).filter((x: MilestoneRecord)      => x.startup_id === sid));
      setDueDiligence((ddRes.data || []).filter((x: DueDiligenceRecord)   => x.startup_id === sid));
      setEquityRounds((erRes.data || []).filter((x: EquityRoundRecord)    => x.startup_id === sid));
      setMetrics     ((meRes.data || []).filter((x: MetricRecord)         => x.startup_id === sid).sort((a, b) => (a.snapshot_date || "").localeCompare(b.snapshot_date || "")));
      setTeamHistory ((tRes.data  || []).filter((x: TeamHistoryRecord)    => x.startup_id === sid).sort((a, b) => (a.record_date   || "").localeCompare(b.record_date   || "")));
      setHealthScores((hRes.data  || []).filter((x: HealthScoreRecord)    => x.startup_id === sid).sort((a, b) => (b.score_date    || "").localeCompare(a.score_date    || "")));
      setValuations  ((vRes.data  || []).filter((x: ValuationRecord)      => x.startup_id === sid).sort((a, b) => (a.valuation_date|| "").localeCompare(b.valuation_date|| "")));

      try {
        await Promise.all([setupStartupDbLab(), refreshDbData(sid)]);
      } catch { /* silently skip db lab if unavailable */ }

    } catch (error: unknown) {
      console.error(error);
      toast({ title: "Loading failed", description: "Could not load founder dashboard data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const latestMetric = metrics[metrics.length - 1];
  const latestHealth = healthScores[0];

  const revenueData   = metrics.map(x  => ({ month: x.snapshot_date?.slice(0, 7), revenue: Number(x.monthly_revenue_usd || 0), burn: Number(x.monthly_burn_usd || 0) }));
  const valuationData = valuations.map(x => ({ date: x.valuation_date?.slice(0, 10), value: Number(x.valuation_usd || 0) / 1e6 }));
  const teamData      = teamHistory.map(x => ({ month: x.record_date?.slice(0, 7), count: Number(x.total_headcount || 0) }));
  const roundData     = equityRounds.map(x => ({ round: x.round_type, amount: Number(x.amount_raised_usd || 0) / 1e6 }));
  const radarData     = latestHealth ? [
    { subject: "Financial", score: latestHealth.financial_score || 0 },
    { subject: "Team",      score: latestHealth.team_score      || 0 },
    { subject: "Product",   score: latestHealth.product_score   || 0 },
    { subject: "Market",    score: latestHealth.market_score    || 0 },
    { subject: "Overall",   score: latestHealth.overall_score   || 0 },
  ] : [];

  const handleStatusUpdate = async () => {
    if (!startup || statusDraft === startup.status) return;
    try {
      setSavingStatus(true);
      await setupStartupDbLab();
      await updateStartup(startup.startup_id, { ...startup, status: statusDraft });
      await refreshDbData(startup.startup_id);
      toast({ title: "Status updated", description: `Status changed to ${statusDraft}.` });
    } catch (error: unknown) {
      toast({ title: "Update failed", description: getErrorMessage(error, "Status update failed."), variant: "destructive" });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleEditSave = async (payload: Record<string, unknown>) => {
    if (!editAction) return;
    try {
      setSubmitting(true);
      if (editAction.type === "startup" && startup) {
        await updateStartup(startup.startup_id, payload);
        toast({ title: "Startup updated" });
      }
      if (editAction.type === "founder") {
        await updateFounder(editAction.item.founder_id, payload);
        toast({ title: "Founder updated" });
      }
      if (editAction.type === "deal") {
        await updateDeal(editAction.item.deal_id, payload);
        toast({ title: "Deal updated" });
      }
      setEditAction(null);
      await loadDashboard();
    } catch (error: unknown) {
      toast({ title: "Update failed", description: getErrorMessage(error, "Could not save changes."), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartupDelete = async () => {
    if (!startup || !window.confirm(`Delete startup ${startup.startup_name}?`)) return;
    try {
      await deleteStartup(startup.startup_id);
      toast({ title: "Startup deleted" });
      localStorage.removeItem("vaultbridge_founder_startup_id");
      window.location.reload();
    } catch (error: unknown) {
      toast({ title: "Delete failed", description: getErrorMessage(error, "Could not delete startup."), variant: "destructive" });
    }
  };

  const handleFounderDelete = async (f: FounderRecord) => {
    if (!window.confirm(`Delete founder ${f.first_name} ${f.last_name}?`)) return;
    try {
      await deleteFounder(f.founder_id);
      toast({ title: "Founder deleted" });
      await loadDashboard();
    } catch (error: unknown) {
      toast({ title: "Delete failed", description: getErrorMessage(error, "Could not delete founder."), variant: "destructive" });
    }
  };

  const handleDealDelete = async (d: DealRecord) => {
    if (!window.confirm(`Delete deal ${d.deal_id}?`)) return;
    try {
      await deleteDeal(d.deal_id);
      toast({ title: "Deal deleted" });
      await loadDashboard();
    } catch (error: unknown) {
      toast({ title: "Delete failed", description: getErrorMessage(error, "Could not delete deal."), variant: "destructive" });
    }
  };

  // ── Sub-components ──────────────────────────────────────────────────────────
  const StatCard = ({ label, value }: { label: string; value: string | number }) => (
    <div className="glass-card rounded-xl p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );

  const Table = ({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) => (
    <div className="glass-card rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 text-left text-muted-foreground">
            {headers.map(h => <th key={h} className="p-4 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/30">
              {row.map((cell, j) => <td key={j} className={`p-4 ${j === 0 ? "text-foreground" : "text-muted-foreground"}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <div className="min-h-screen flex">

        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "w-60" : "w-0 overflow-hidden"} transition-all duration-300 border-r border-border/50 bg-card shrink-0`}>
          <div className="p-5 border-b border-border/50">
            <h2 className="text-lg font-bold"><span className="gradient-text">Vault</span>Bridge</h2>
            <p className="text-xs text-muted-foreground mt-1">Founder Dashboard</p>
          </div>
          <nav className="p-3 space-y-1">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === tab.key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}>
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <header className="h-14 border-b border-border/50 flex items-center px-5 gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground"><Menu size={20} /></button>
            <h1 className="text-lg font-semibold">{startup?.startup_name || "Founder Dashboard"}</h1>
            {startup && <StatusBadge status={startup.status} />}
          </header>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
            ) : (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">

                {/* ── Overview ── */}
                {activeTab === "overview" && (
                  <>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => startup && setEditAction({ type: "startup", item: startup })} disabled={!startup} className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15 disabled:opacity-60">
                        Edit Startup
                      </button>
                      <button onClick={handleStartupDelete} disabled={!startup} className="rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/15 disabled:opacity-60">
                        Delete Startup
                      </button>
                    </div>

                    {/* Key info cards */}
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard label="Industry"      value={startup?.industry_name    || "N/A"} />
                      <StatCard label="Location"      value={startup?.location_display || "N/A"} />
                      <StatCard label="Founded"       value={startup?.founded_year     || "N/A"} />
                      <StatCard label="Status"        value={startup?.status           || "N/A"} />
                    </div>

                    {/* Financial cards */}
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard label="Total Funding"    value={fmtMoney(startup?.total_funding_usd)}    />
                      <StatCard label="Annual Revenue"   value={fmtMoney(startup?.annual_revenue_usd)}   />
                      <StatCard label="Profit / Loss"    value={fmtMoney(startup?.profit_loss_usd)}      />
                      <StatCard label="Employees"        value={startup?.num_employees ?? "N/A"}          />
                    </div>

                    {/* Activity summary cards */}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <StatCard label="Founders"        value={founders.length}      />
                      <StatCard label="Products"        value={products.length}       />
                      <StatCard label="Deals"           value={deals.length}          />
                      <StatCard label="Milestones"      value={milestones.length}     />
                      <StatCard label="Funding Rounds"  value={equityRounds.length}   />
                      <StatCard label="Latest MRR"      value={fmtMoney(latestMetric?.monthly_revenue_usd)} />
                    </div>

                    {/* Revenue vs Burn chart */}
                    <div className="glass-card rounded-xl p-5">
                      <h3 className="font-semibold mb-4">Revenue vs Burn</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                          <XAxis dataKey="month" stroke={chartColors.muted} fontSize={12} />
                          <YAxis stroke={chartColors.muted} fontSize={12} />
                          <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                          <Area type="monotone" dataKey="revenue" stroke={chartColors.primary}   fill={chartColors.primary}   fillOpacity={0.12} />
                          <Area type="monotone" dataKey="burn"    stroke={chartColors.secondary} fill={chartColors.secondary} fillOpacity={0.12} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}

                {/* ── Founders ── */}
                {activeTab === "founders" && (
                  founders.length === 0
                    ? <p className="text-muted-foreground">No founders linked to this startup.</p>
                    : (
                      <div className="grid gap-5 lg:grid-cols-2">
                        {founders.map(founder => (
                          <div key={`${founder.founder_id}-${founder.startup_id}`} className="glass-card rounded-xl p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-semibold text-foreground">{founder.first_name} {founder.last_name}</h3>
                                <p className="text-sm text-muted-foreground">{founder.role || "Founder"}</p>
                              </div>
                              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                                {founder.equity_percentage != null ? `${founder.equity_percentage}% equity` : "Equity N/A"}
                              </span>
                            </div>
                            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                              <p>Email: {founder.email || "N/A"}</p>
                              <p>Phone: {founder.phone || "N/A"}</p>
                              <p>Nationality: {founder.nationality || "N/A"}</p>
                            </div>
                            <div className="mt-4 flex gap-2">
                              <button onClick={() => setEditAction({ type: "founder", item: founder })} className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15">Edit</button>
                              <button onClick={() => handleFounderDelete(founder)}                       className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/15">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                )}

                {/* ── Deals ── */}
                {activeTab === "deals" && (
                  <div className="grid gap-5 xl:grid-cols-2">
                    <div className="space-y-4">
                      {deals.length === 0
                        ? <p className="text-muted-foreground">No deals found.</p>
                        : deals.map(deal => (
                          <div key={deal.deal_id} className="glass-card rounded-xl p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-semibold text-foreground">{deal.startup_name}</h3>
                                <p className="text-sm text-muted-foreground">{deal.sharks || "No sharks linked"}</p>
                              </div>
                              <StatusBadge status={deal.deal_status} />
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                              <p>Amount: {fmtMoney(deal.deal_amount_usd)}</p>
                              <p>Equity: {deal.deal_equity_percent != null ? `${deal.deal_equity_percent}%` : "N/A"}</p>
                              <p>Type: {deal.deal_type || "N/A"}</p>
                              <p>Date: {fmtDate(deal.handshake_date)}</p>
                            </div>
                            <div className="mt-4 flex gap-2">
                              <button onClick={() => setEditAction({ type: "deal", item: deal })} className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15">Edit</button>
                              <button onClick={() => handleDealDelete(deal)}                       className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/15">Delete</button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                    <Table
                      headers={["Conducted By", "Status", "Financial", "Legal", "IP"]}
                      rows={
                        dueDiligence.length === 0
                          ? [["No records yet", "-", "-", "-", "-"]]
                          : dueDiligence.map(x => [x.conducted_by || "Team", x.dd_status || "N/A", yesNo(x.financial_verified), yesNo(x.legal_cleared), yesNo(x.ip_verified)])
                      }
                    />
                  </div>
                )}

                {/* ── Analytics ── */}
                {activeTab === "analytics" && (
                  <>
                    <div className="grid gap-5 xl:grid-cols-2">
                      <div className="glass-card rounded-xl p-5">
                        <h3 className="font-semibold mb-4">Valuation Trend ($M)</h3>
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={valuationData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                            <XAxis dataKey="date"  stroke={chartColors.muted} fontSize={12} />
                            <YAxis stroke={chartColors.muted} fontSize={12} />
                            <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                            <Line type="monotone" dataKey="value" stroke={chartColors.secondary} strokeWidth={2} dot={{ r: 4, fill: chartColors.secondary }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="glass-card rounded-xl p-5">
                        <h3 className="font-semibold mb-4">Team Headcount</h3>
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={teamData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                            <XAxis dataKey="month" stroke={chartColors.muted} fontSize={12} />
                            <YAxis stroke={chartColors.muted} fontSize={12} />
                            <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                            <Line type="monotone" dataKey="count" stroke={chartColors.primary} strokeWidth={2} dot={{ r: 4, fill: chartColors.primary }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="grid gap-5 xl:grid-cols-2">
                      <div className="glass-card rounded-xl p-5">
                        <h3 className="font-semibold mb-4">Funding Rounds ($M)</h3>
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={roundData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                            <XAxis dataKey="round" stroke={chartColors.muted} fontSize={12} />
                            <YAxis stroke={chartColors.muted} fontSize={12} />
                            <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                            <Bar dataKey="amount" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="glass-card rounded-xl p-5">
                        <h3 className="font-semibold mb-4">Health Score</h3>
                        {radarData.length === 0
                          ? <p className="text-sm text-muted-foreground">No health score records found.</p>
                          : (
                            <ResponsiveContainer width="100%" height={260}>
                              <RadarChart data={radarData}>
                                <PolarGrid stroke="hsl(217,33%,18%)" />
                                <PolarAngleAxis dataKey="subject" stroke={chartColors.muted} fontSize={12} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={chartColors.muted} fontSize={10} />
                                <Radar dataKey="score" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.22} />
                              </RadarChart>
                            </ResponsiveContainer>
                          )
                        }
                      </div>
                    </div>
                  </>
                )}

                {/* ── Activity ── */}
                {activeTab === "activity" && (
                  <>
                    <div className="grid gap-5 xl:grid-cols-2">
                      {/* Status updater */}
                      <div className="glass-card rounded-xl p-5">
                        <h3 className="font-semibold mb-1">Startup Status</h3>
                        <p className="text-sm text-muted-foreground mb-4">Update the current status of your startup.</p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <select value={statusDraft} onChange={e => setStatusDraft(e.target.value)} className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground">
                            {startupStatuses.map(s => <option key={s}>{s}</option>)}
                          </select>
                          <button onClick={handleStatusUpdate} disabled={savingStatus || !startup || statusDraft === startup?.status} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-70">
                            {savingStatus ? "Updating..." : "Update Status"}
                          </button>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">Current: <span className="font-medium text-foreground">{startup?.status || "N/A"}</span></p>
                      </div>

                      {/* Metrics summary */}
                      <div className="glass-card rounded-xl p-5">
                        <h3 className="font-semibold mb-1">Metrics Summary</h3>
                        <p className="text-sm text-muted-foreground mb-4">Aggregated operational metrics across all recorded snapshots.</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><p className="text-muted-foreground">Snapshots</p>     <p className="mt-1 font-semibold">{cursorSummary?.snapshots_processed ?? 0}</p></div>
                          <div><p className="text-muted-foreground">Avg Runway</p>    <p className="mt-1 font-semibold">{cursorSummary?.average_runway_months != null ? `${cursorSummary.average_runway_months} months` : "N/A"}</p></div>
                          <div><p className="text-muted-foreground">Total Revenue</p> <p className="mt-1 font-semibold">{fmtMoney(cursorSummary?.total_revenue_usd)}</p></div>
                          <div><p className="text-muted-foreground">Total Burn</p>    <p className="mt-1 font-semibold">{fmtMoney(cursorSummary?.total_burn_usd)}</p></div>
                        </div>
                      </div>
                    </div>

                    {/* Status change history */}
                    <div>
                      <h3 className="font-semibold mb-3 text-foreground">Status Change History</h3>
                      <Table
                        headers={["Date", "Previous", "New", "Changed By", "Reason"]}
                        rows={
                          statusHistory.length === 0
                            ? [["No changes recorded yet", "-", "-", "-", "-"]]
                            : statusHistory.map(x => [fmtDate(x.changed_date), x.previous_status || "N/A", x.new_status || "N/A", x.changed_by || "N/A", x.reason || "N/A"])
                        }
                      />
                    </div>
                  </>
                )}

              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      {editAction && (
        <EditModal
          action={editAction}
          onClose={() => setEditAction(null)}
          onSave={handleEditSave}
          saving={submitting}
        />
      )}
    </PageTransition>
  );
};

export default FounderDashboard;
