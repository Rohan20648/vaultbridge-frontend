import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Database, Handshake, Home, Loader2, Menu, TrendingUp, UserRound } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageTransition from "@/components/PageTransition";
import RecordEditorDialog from "@/components/RecordEditorDialog";
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
  { key: "overview", label: "Overview", icon: Home },
  { key: "founders", label: "Founders", icon: UserRound },
  { key: "deals", label: "Deals", icon: Handshake },
  { key: "analytics", label: "Analytics", icon: TrendingUp },
  { key: "db", label: "DB Lab", icon: Database },
] as const;

const chartColors = { primary: "hsl(217, 91%, 60%)", secondary: "hsl(160, 84%, 39%)", muted: "hsl(215, 20%, 55%)" };
const startupStatuses = ["Active", "Acquired", "Shutdown", "IPO", "Dormant", "Pivoting"];

const fmtMoney = (v?: string | number | null) => (v == null || v === "" ? "N/A" : `$${Number(v).toLocaleString()}`);
const fmtDate = (v?: string | null) => v?.slice(0, 10) || "N/A";
const yesNo = (v?: number | boolean | null) => (v ? "Yes" : "No");

type StartupRecord = {
  startup_id: number;
  startup_name?: string;
  tagline?: string;
  industry_id?: number;
  industry_name?: string;
  location_id?: number;
  location_display?: string;
  website?: string;
  founded_year?: number;
  registration_number?: string;
  annual_revenue_usd?: number;
  profit_loss_usd?: number;
  num_employees?: number;
  total_funding_usd?: number;
  status?: string;
};

type FounderRecord = {
  founder_id: number;
  startup_id?: number;
  first_name?: string;
  last_name?: string;
  role?: string;
  equity_percentage?: number;
  email?: string;
  phone?: string;
  nationality?: string;
};

type ProductRecord = {
  product_id: number;
  startup_id?: number;
};

type DealRecord = {
  deal_id: number;
  startup_id?: number;
  startup_name?: string;
  sharks?: string;
  deal_amount_usd?: number;
  deal_equity_percent?: number;
  deal_type?: string;
  royalty_per_unit?: number;
  loan_interest_rate?: number;
  handshake_date?: string;
  closed_date?: string;
  deal_status?: string;
  deal_notes?: string;
};

type MilestoneRecord = {
  milestone_id: number;
  startup_id?: number;
};

type DueDiligenceRecord = {
  dd_id: number;
  startup_id?: number;
  conducted_by?: string;
  dd_status?: string;
  financial_verified?: number | boolean;
  legal_cleared?: number | boolean;
  ip_verified?: number | boolean;
};

type EquityRoundRecord = {
  round_id: number;
  startup_id?: number;
  round_type?: string;
  amount_raised_usd?: number;
};

type MetricRecord = {
  metric_id: number;
  startup_id?: number;
  snapshot_date?: string;
  monthly_revenue_usd?: number;
  monthly_burn_usd?: number;
};

type TeamHistoryRecord = {
  team_id: number;
  startup_id?: number;
  record_date?: string;
  total_headcount?: number;
};

type HealthScoreRecord = {
  score_id: number;
  startup_id?: number;
  score_date?: string;
  financial_score?: number;
  team_score?: number;
  product_score?: number;
  market_score?: number;
  overall_score?: number;
};

type ValuationRecord = {
  valuation_id: number;
  startup_id?: number;
  valuation_date?: string;
  valuation_usd?: number;
};

type StatusHistoryRecord = {
  status_history_id: number;
  changed_date?: string;
  previous_status?: string;
  new_status?: string;
  changed_by?: string;
  reason?: string;
};

type CursorSummary = {
  snapshots_processed?: number;
  average_runway_months?: number;
  total_revenue_usd?: number;
  total_burn_usd?: number;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
};

const FounderDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [startup, setStartup] = useState<StartupRecord | null>(null);
  const [statusDraft, setStatusDraft] = useState("Active");
  const [founders, setFounders] = useState<FounderRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [milestones, setMilestones] = useState<MilestoneRecord[]>([]);
  const [dueDiligence, setDueDiligence] = useState<DueDiligenceRecord[]>([]);
  const [equityRounds, setEquityRounds] = useState<EquityRoundRecord[]>([]);
  const [metrics, setMetrics] = useState<MetricRecord[]>([]);
  const [teamHistory, setTeamHistory] = useState<TeamHistoryRecord[]>([]);
  const [healthScores, setHealthScores] = useState<HealthScoreRecord[]>([]);
  const [valuations, setValuations] = useState<ValuationRecord[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryRecord[]>([]);
  const [cursorSummary, setCursorSummary] = useState<CursorSummary | null>(null);
  const [dbMessage, setDbMessage] = useState("");
  const [lookupCounts, setLookupCounts] = useState({ industries: 0, locations: 0, categories: 0 });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorDescription, setEditorDescription] = useState("");
  const [editorValue, setEditorValue] = useState("");
  const [editorSubmitLabel, setEditorSubmitLabel] = useState("Save");
  const [editorAction, setEditorAction] = useState<null | { type: "startup" } | { type: "founder"; item: FounderRecord } | { type: "deal"; item: DealRecord }>(null);
  const [submitting, setSubmitting] = useState(false);
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
      const [sRes, fRes, pRes, dRes, mRes, ddRes, erRes, meRes, tRes, hRes, vRes, iRes, lRes, cRes] = await Promise.all([
        getStartups(),
        getFounders(),
        getProducts(),
        getDeals(),
        getMilestones(),
        getDueDiligence(),
        getEquityRounds(),
        getMetrics(),
        getTeamHistory(),
        getHealthScores(),
        getValuations(),
        getIndustries(),
        getLocations(),
        getProductCategories(),
      ]);

      const startups: StartupRecord[] = sRes.data || [];
      const savedStartupId = Number(localStorage.getItem("vaultbridge_founder_startup_id"));
      const selectedStartup =
        startups.find((item) => item.startup_id === savedStartupId) ||
        startups[0];
      setStartup(selectedStartup);
      setStatusDraft(selectedStartup?.status || "Active");
      setLookupCounts({
        industries: (iRes.data || []).length,
        locations: (lRes.data || []).length,
        categories: (cRes.data || []).length,
      });

      if (!selectedStartup) return;
      const sid = selectedStartup.startup_id;
      setFounders((fRes.data || []).filter((x: FounderRecord) => x.startup_id === sid));
      setProducts((pRes.data || []).filter((x: ProductRecord) => x.startup_id === sid));
      setDeals((dRes.data || []).filter((x: DealRecord) => x.startup_id === sid));
      setMilestones((mRes.data || []).filter((x: MilestoneRecord) => x.startup_id === sid));
      setDueDiligence((ddRes.data || []).filter((x: DueDiligenceRecord) => x.startup_id === sid));
      setEquityRounds((erRes.data || []).filter((x: EquityRoundRecord) => x.startup_id === sid));
      setMetrics((meRes.data || []).filter((x: MetricRecord) => x.startup_id === sid).sort((a, b) => (a.snapshot_date || "").localeCompare(b.snapshot_date || "")));
      setTeamHistory((tRes.data || []).filter((x: TeamHistoryRecord) => x.startup_id === sid).sort((a, b) => (a.record_date || "").localeCompare(b.record_date || "")));
      setHealthScores((hRes.data || []).filter((x: HealthScoreRecord) => x.startup_id === sid).sort((a, b) => (b.score_date || "").localeCompare(a.score_date || "")));
      setValuations((vRes.data || []).filter((x: ValuationRecord) => x.startup_id === sid).sort((a, b) => (a.valuation_date || "").localeCompare(b.valuation_date || "")));

      try {
        const [setupRes] = await Promise.all([setupStartupDbLab(), refreshDbData(sid)]);
        setDbMessage(setupRes.message || "Trigger and cursor are ready.");
      } catch (dbError: unknown) {
        setDbMessage(getErrorMessage(dbError, "Database lab setup is unavailable."));
      }
    } catch (error: unknown) {
      console.error(error);
      toast({ title: "Loading failed", description: "Could not load founder dashboard data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const latestMetric = metrics[metrics.length - 1];
  const latestHealth = healthScores[0];
  const revenueData = metrics.map((x) => ({ month: x.snapshot_date?.slice(0, 7), revenue: Number(x.monthly_revenue_usd || 0), burn: Number(x.monthly_burn_usd || 0) }));
  const valuationData = valuations.map((x) => ({ date: x.valuation_date?.slice(0, 10), value: Number(x.valuation_usd || 0) / 1e6 }));
  const teamData = teamHistory.map((x) => ({ month: x.record_date?.slice(0, 7), count: Number(x.total_headcount || 0) }));
  const roundData = equityRounds.map((x) => ({ round: x.round_type, amount: Number(x.amount_raised_usd || 0) / 1e6 }));
  const radarData = latestHealth ? [
    { subject: "Financial", score: latestHealth.financial_score || 0 },
    { subject: "Team", score: latestHealth.team_score || 0 },
    { subject: "Product", score: latestHealth.product_score || 0 },
    { subject: "Market", score: latestHealth.market_score || 0 },
    { subject: "Overall", score: latestHealth.overall_score || 0 },
  ] : [];

  const handleStatusUpdate = async () => {
    if (!startup || statusDraft === startup.status) return;
    try {
      setSavingStatus(true);
      await setupStartupDbLab();
      await updateStartup(startup.startup_id, {
        startup_name: startup.startup_name,
        tagline: startup.tagline,
        industry_id: startup.industry_id,
        location_id: startup.location_id,
        website: startup.website,
        founded_year: startup.founded_year,
        registration_number: startup.registration_number,
        annual_revenue_usd: startup.annual_revenue_usd,
        profit_loss_usd: startup.profit_loss_usd,
        num_employees: startup.num_employees,
        total_funding_usd: startup.total_funding_usd,
        status: statusDraft,
      });
      await refreshDbData(startup.startup_id);
      setDbMessage("Status updated. The trigger inserted a new history row automatically.");
    } catch (error: unknown) {
      setDbMessage(getErrorMessage(error, "Status update failed."));
    } finally {
      setSavingStatus(false);
    }
  };

  const openEditor = (title: string, description: string, value: unknown, action: null | { type: "startup" } | { type: "founder"; item: FounderRecord } | { type: "deal"; item: DealRecord }, submitLabel = "Save Changes") => {
    setEditorTitle(title);
    setEditorDescription(description);
    setEditorValue(JSON.stringify(value, null, 2));
    setEditorSubmitLabel(submitLabel);
    setEditorAction(action);
    setEditorOpen(true);
  };

  const handleStartupEdit = () => {
    if (!startup) return;
    openEditor("Edit Startup", "Update your startup fields here and save the JSON payload.", {
      startup_name: startup.startup_name,
      tagline: startup.tagline,
      industry_id: startup.industry_id,
      location_id: startup.location_id,
      website: startup.website,
      founded_year: startup.founded_year,
      registration_number: startup.registration_number,
      annual_revenue_usd: startup.annual_revenue_usd,
      profit_loss_usd: startup.profit_loss_usd,
      num_employees: startup.num_employees,
      total_funding_usd: startup.total_funding_usd,
      status: startup.status,
    }, { type: "startup" }, "Update Startup");
  };

  const handleFounderEdit = (founder: FounderRecord) => {
    openEditor("Edit Founder", "Update founder details below. Extra fields are ignored by the backend.", founder, { type: "founder", item: founder }, "Update Founder");
  };

  const handleDealEdit = (deal: DealRecord) => {
    openEditor("Edit Deal", "Update deal details below and save them through the existing backend API.", {
      startup_id: deal.startup_id,
      deal_amount_usd: deal.deal_amount_usd,
      deal_equity_percent: deal.deal_equity_percent,
      deal_type: deal.deal_type,
      royalty_per_unit: deal.royalty_per_unit,
      loan_interest_rate: deal.loan_interest_rate,
      handshake_date: deal.handshake_date,
      closed_date: deal.closed_date,
      deal_status: deal.deal_status,
      deal_notes: deal.deal_notes,
    }, { type: "deal", item: deal }, "Update Deal");
  };

  const submitEditor = async () => {
    if (!editorAction) return;
    try {
      setSubmitting(true);
      const payload = JSON.parse(editorValue);

      if (editorAction.type === "startup" && startup) {
        await updateStartup(startup.startup_id, payload);
        toast({ title: "Startup updated", description: "Startup details were updated successfully." });
      }

      if (editorAction.type === "founder") {
        await updateFounder(editorAction.item.founder_id, payload);
        toast({ title: "Founder updated", description: "Founder details were updated successfully." });
      }

      if (editorAction.type === "deal") {
        await updateDeal(editorAction.item.deal_id, payload);
        toast({ title: "Deal updated", description: "Deal details were updated successfully." });
      }

      setEditorOpen(false);
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
      toast({ title: "Startup deleted", description: `${startup.startup_name} was deleted.` });
      localStorage.removeItem("vaultbridge_founder_startup_id");
      window.location.reload();
    } catch (error: unknown) {
      toast({ title: "Delete failed", description: getErrorMessage(error, "Could not delete startup."), variant: "destructive" });
    }
  };

  const handleFounderDelete = async (founder: FounderRecord) => {
    if (!window.confirm(`Delete founder ${founder.first_name} ${founder.last_name}?`)) return;
    try {
      await deleteFounder(founder.founder_id);
      toast({ title: "Founder deleted", description: `${founder.first_name} ${founder.last_name} was deleted.` });
      await loadDashboard();
    } catch (error: unknown) {
      toast({ title: "Delete failed", description: getErrorMessage(error, "Could not delete founder."), variant: "destructive" });
    }
  };

  const handleDealDelete = async (deal: DealRecord) => {
    if (!window.confirm(`Delete deal ${deal.deal_id} for ${deal.startup_name}?`)) return;
    try {
      await deleteDeal(deal.deal_id);
      toast({ title: "Deal deleted", description: `Deal ${deal.deal_id} was deleted.` });
      await loadDashboard();
    } catch (error: unknown) {
      toast({ title: "Delete failed", description: getErrorMessage(error, "Could not delete deal."), variant: "destructive" });
    }
  };

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
            {headers.map((header) => <th key={header} className="p-4 font-medium">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-border/30">
              {row.map((cell, cellIndex) => <td key={cellIndex} className={`p-4 ${cellIndex === 0 ? "text-foreground" : "text-muted-foreground"}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <PageTransition>
      <div className="min-h-screen flex">
        <aside className={`${sidebarOpen ? "w-60" : "w-0 overflow-hidden"} transition-all duration-300 border-r border-border/50 bg-card shrink-0`}>
          <div className="p-5 border-b border-border/50">
            <h2 className="text-lg font-bold"><span className="gradient-text">Vault</span>Bridge</h2>
            <p className="text-xs text-muted-foreground mt-1">Founder Dashboard</p>
          </div>
          <nav className="p-3 space-y-1">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === tab.key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}>
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </nav>
        </aside>

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
                {activeTab === "overview" && (
                  <>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={handleStartupEdit} disabled={!startup} className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15 disabled:opacity-60">
                        Edit Startup
                      </button>
                      <button onClick={handleStartupDelete} disabled={!startup} className="rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/15 disabled:opacity-60">
                        Delete Startup
                      </button>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard label="Industry" value={startup?.industry_name || "N/A"} />
                      <StatCard label="Location" value={startup?.location_display || "N/A"} />
                      <StatCard label="Latest Revenue" value={fmtMoney(latestMetric?.monthly_revenue_usd)} />
                      <StatCard label="Lookup APIs Used" value={lookupCounts.industries + lookupCounts.locations + lookupCounts.categories} />
                    </div>
                    <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                      <StatCard label="Founders API" value={founders.length} />
                      <StatCard label="Products API" value={products.length} />
                      <StatCard label="Deals API" value={deals.length} />
                      <StatCard label="Milestones API" value={milestones.length} />
                      <StatCard label="Due Diligence API" value={dueDiligence.length} />
                      <StatCard label="Equity Rounds API" value={equityRounds.length} />
                    </div>
                    <div className="glass-card rounded-xl p-5">
                      <h3 className="font-semibold mb-4">Revenue vs Burn</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                          <XAxis dataKey="month" stroke={chartColors.muted} fontSize={12} />
                          <YAxis stroke={chartColors.muted} fontSize={12} />
                          <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                          <Area type="monotone" dataKey="revenue" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.12} />
                          <Area type="monotone" dataKey="burn" stroke={chartColors.secondary} fill={chartColors.secondary} fillOpacity={0.12} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}

                {activeTab === "founders" && (
                  founders.length === 0 ? <p className="text-muted-foreground">No founders linked to this startup.</p> : (
                    <div className="grid gap-5 lg:grid-cols-2">
                      {founders.map((founder) => (
                        <div key={`${founder.founder_id}-${founder.startup_id}`} className="glass-card rounded-xl p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-foreground">{founder.first_name} {founder.last_name}</h3>
                              <p className="text-sm text-muted-foreground">{founder.role || "Founder"}</p>
                            </div>
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{founder.equity_percentage != null ? `${founder.equity_percentage}% equity` : "Equity N/A"}</span>
                          </div>
                          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                            <p>Email: {founder.email || "N/A"}</p>
                            <p>Phone: {founder.phone || "N/A"}</p>
                            <p>Nationality: {founder.nationality || "N/A"}</p>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <button onClick={() => handleFounderEdit(founder)} className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15">
                              Edit
                            </button>
                            <button onClick={() => handleFounderDelete(founder)} className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/15">
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {activeTab === "deals" && (
                  <div className="grid gap-5 xl:grid-cols-2">
                    <div className="space-y-4">
                      {deals.length === 0 ? <p className="text-muted-foreground">No deals found.</p> : deals.map((deal) => (
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
                            <button onClick={() => handleDealEdit(deal)} className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15">
                              Edit
                            </button>
                            <button onClick={() => handleDealDelete(deal)} className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/15">
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Table
                      headers={["Conducted By", "Status", "Financial", "Legal", "IP"]}
                      rows={dueDiligence.length === 0 ? [["No due diligence rows", "-", "-", "-", "-"]] : dueDiligence.map((x) => [x.conducted_by || "Team", x.dd_status || "N/A", yesNo(x.financial_verified), yesNo(x.legal_cleared), yesNo(x.ip_verified)])}
                    />
                  </div>
                )}

                {activeTab === "analytics" && (
                  <>
                    <div className="grid gap-5 xl:grid-cols-2">
                      <div className="glass-card rounded-xl p-5">
                        <h3 className="font-semibold mb-4">Valuation Trend ($M)</h3>
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={valuationData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                            <XAxis dataKey="date" stroke={chartColors.muted} fontSize={12} />
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
                        {radarData.length === 0 ? <p className="text-sm text-muted-foreground">No health score records found.</p> : (
                          <ResponsiveContainer width="100%" height={260}>
                            <RadarChart data={radarData}>
                              <PolarGrid stroke="hsl(217,33%,18%)" />
                              <PolarAngleAxis dataKey="subject" stroke={chartColors.muted} fontSize={12} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={chartColors.muted} fontSize={10} />
                              <Radar dataKey="score" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.22} />
                            </RadarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "db" && (
                  <>
                    <div className="grid gap-5 xl:grid-cols-2">
                      <div className="glass-card rounded-xl p-5">
                        <h3 className="font-semibold mb-3">Trigger Demo</h3>
                        <p className="text-sm text-muted-foreground mb-4">Updating the startup status runs a MySQL trigger that inserts a row into `startup_status_history`.</p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground">
                            {startupStatuses.map((status) => <option key={status}>{status}</option>)}
                          </select>
                          <button onClick={handleStatusUpdate} disabled={savingStatus || !startup} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-70">
                            {savingStatus ? "Updating..." : "Update Status"}
                          </button>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">Current status: {startup?.status || "N/A"}</p>
                      </div>
                      <div className="glass-card rounded-xl p-5">
                        <h3 className="font-semibold mb-3">Cursor Demo</h3>
                        <p className="text-sm text-muted-foreground mb-4">A stored procedure uses a MySQL cursor to loop through metrics and return an aggregate summary.</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><p className="text-muted-foreground">Snapshots</p><p className="mt-1 font-semibold">{cursorSummary?.snapshots_processed ?? 0}</p></div>
                          <div><p className="text-muted-foreground">Avg Runway</p><p className="mt-1 font-semibold">{cursorSummary?.average_runway_months != null ? `${cursorSummary.average_runway_months} months` : "N/A"}</p></div>
                          <div><p className="text-muted-foreground">Total Revenue</p><p className="mt-1 font-semibold">{fmtMoney(cursorSummary?.total_revenue_usd)}</p></div>
                          <div><p className="text-muted-foreground">Total Burn</p><p className="mt-1 font-semibold">{fmtMoney(cursorSummary?.total_burn_usd)}</p></div>
                        </div>
                        <p className="mt-4 text-sm text-primary">{dbMessage}</p>
                      </div>
                    </div>
                    <Table
                      headers={["Date", "Previous", "New", "Changed By", "Reason"]}
                      rows={statusHistory.length === 0 ? [["No trigger rows yet", "-", "-", "-", "-"]] : statusHistory.map((x) => [fmtDate(x.changed_date), x.previous_status || "N/A", x.new_status || "N/A", x.changed_by || "N/A", x.reason || "N/A"])}
                    />
                  </>
                )}
              </motion.div>
            )}
          </div>
        </main>
      </div>
      <RecordEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={editorTitle}
        description={editorDescription}
        value={editorValue}
        onChange={setEditorValue}
        onSubmit={submitEditor}
        submitting={submitting}
        submitLabel={editorSubmitLabel}
      />
    </PageTransition>
  );
};

export default FounderDashboard;
