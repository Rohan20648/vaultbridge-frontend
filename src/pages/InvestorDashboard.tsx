import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Briefcase, Building2, Handshake, Loader2, Menu } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import RecordEditorDialog from "@/components/RecordEditorDialog";
import StatusBadge from "@/components/StatusBadge";
import { deletePortfolio, deleteShark, getDeals, getPortfolio, getShark, getSharks, updatePortfolio, updateShark } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const tabs = [
  { key: "portfolio", label: "Portfolio", icon: Briefcase },
  { key: "deals", label: "Deals", icon: Handshake },
  { key: "company", label: "Company", icon: Building2 },
] as const;

type ExpertiseRecord = {
  expertise_id: number;
  domain: string;
  years_experience?: number;
};

type SharkRecord = {
  shark_id: number;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  company_type?: string;
  company_id?: number;
  nationality?: string;
  email?: string;
  phone?: string;
  net_worth_usd_millions?: number;
  bio?: string;
  expertise?: ExpertiseRecord[];
};

type PortfolioRecord = {
  portfolio_id: number;
  shark_id: number;
  startup_name?: string;
  portfolio_status?: string;
  current_valuation_usd?: number;
  current_equity_percent?: number;
  total_invested_usd?: number;
  roi_percent?: number;
};

type DealRecord = {
  deal_id: number;
  startup_name?: string;
  deal_amount_usd?: number;
  deal_equity_percent?: number;
  deal_type?: string;
  handshake_date?: string;
  deal_status?: string;
  sharks?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
};

const InvestorDashboard = () => {
  const [activeTab, setActiveTab] = useState("portfolio");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [shark, setShark] = useState<SharkRecord | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioRecord[]>([]);
  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [expertise, setExpertise] = useState<ExpertiseRecord[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorDescription, setEditorDescription] = useState("");
  const [editorValue, setEditorValue] = useState("");
  const [editorSubmitLabel, setEditorSubmitLabel] = useState("Save");
  const [editorAction, setEditorAction] = useState<null | { type: "investor" } | { type: "portfolio"; item: PortfolioRecord }>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [sharksRes, portfolioRes, dealsRes] = await Promise.all([getSharks(), getPortfolio(), getDeals()]);
      const sharks: SharkRecord[] = sharksRes.data || [];
      const savedSharkId = Number(localStorage.getItem("vaultbridge_investor_shark_id"));
      const selectedShark =
        sharks.find((item) => item.shark_id === savedSharkId) ||
        sharks[0];
      if (!selectedShark) return;

      const sharkDetails = await getShark(selectedShark.shark_id);
      setShark({ ...selectedShark, ...(sharkDetails.data || {}) });
      setExpertise(sharkDetails.data?.expertise || []);
      setPortfolio((portfolioRes.data || []).filter((item: PortfolioRecord) => item.shark_id === selectedShark.shark_id));
      setDeals((dealsRes.data || []).filter((item: DealRecord) => item.sharks && item.sharks.includes(selectedShark.first_name || "")));
    } catch (error: unknown) {
      console.error(error);
      toast({ title: "Loading failed", description: "Could not load investor dashboard data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const openEditor = (title: string, description: string, value: unknown, action: null | { type: "investor" } | { type: "portfolio"; item: PortfolioRecord }, submitLabel = "Save Changes") => {
    setEditorTitle(title);
    setEditorDescription(description);
    setEditorValue(JSON.stringify(value, null, 2));
    setEditorSubmitLabel(submitLabel);
    setEditorAction(action);
    setEditorOpen(true);
  };

  const handlePortfolioEdit = (item: PortfolioRecord) => {
    openEditor("Edit Portfolio Entry", "Update the portfolio record JSON and save it.", {
      total_invested_usd: item.total_invested_usd,
      current_equity_percent: item.current_equity_percent,
      portfolio_status: item.portfolio_status,
      current_valuation_usd: item.current_valuation_usd,
      roi_percent: item.roi_percent,
    }, { type: "portfolio", item }, "Update Portfolio");
  };

  const handleInvestorEdit = () => {
    if (!shark) return;
    openEditor("Edit Investor", "Update the investor fields below. Company information is read-only because the backend update endpoint edits the shark record only.", {
      first_name: shark.first_name,
      last_name: shark.last_name,
      email: shark.email,
      phone: shark.phone,
      nationality: shark.nationality,
      net_worth_usd_millions: shark.net_worth_usd_millions,
      company_id: shark.company_id,
      bio: shark.bio,
    }, { type: "investor" }, "Update Investor");
  };

  const submitInvestorEdit = async () => {
    if (!shark) return;
    try {
      setSubmitting(true);
      await updateShark(shark.shark_id, JSON.parse(editorValue));
      setEditorOpen(false);
      toast({ title: "Investor updated", description: "The investor record was updated successfully." });
      await loadDashboard();
    } catch (error: unknown) {
      toast({ title: "Update failed", description: getErrorMessage(error, "Could not update investor."), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const submitPortfolioEdit = async (item: PortfolioRecord) => {
    try {
      setSubmitting(true);
      await updatePortfolio(item.portfolio_id, JSON.parse(editorValue));
      setEditorOpen(false);
      toast({ title: "Portfolio updated", description: "The portfolio entry was updated successfully." });
      await loadDashboard();
    } catch (error: unknown) {
      toast({ title: "Update failed", description: getErrorMessage(error, "Could not update portfolio entry."), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePortfolioDelete = async (item: PortfolioRecord) => {
    if (!window.confirm(`Delete portfolio entry ${item.portfolio_id} for ${item.startup_name}?`)) return;
    try {
      await deletePortfolio(item.portfolio_id);
      toast({ title: "Portfolio entry deleted", description: `${item.startup_name} was removed from the portfolio.` });
      await loadDashboard();
    } catch (error: unknown) {
      toast({ title: "Delete failed", description: getErrorMessage(error, "Could not delete portfolio entry."), variant: "destructive" });
    }
  };

  const handleInvestorDelete = async () => {
    if (!shark || !window.confirm(`Delete investor ${shark.first_name} ${shark.last_name}?`)) return;
    try {
      await deleteShark(shark.shark_id);
      toast({ title: "Investor deleted", description: "The investor record was deleted." });
      localStorage.removeItem("vaultbridge_investor_shark_id");
      window.location.reload();
    } catch (error: unknown) {
      toast({ title: "Delete failed", description: getErrorMessage(error, "Could not delete investor."), variant: "destructive" });
    }
  };

  const handleEditorSubmit = async () => {
    if (!editorAction) return;
    if (editorAction.type === "investor") {
      await submitInvestorEdit();
      return;
    }
    await submitPortfolioEdit(editorAction.item);
  };

  const portfolioChartData = portfolio.map((item) => ({
    name: item.startup_name,
    invested: item.total_invested_usd ? Number(item.total_invested_usd) / 1000 : 0,
  }));

  return (
    <PageTransition>
      <div className="min-h-screen flex">
        <aside className={`${sidebarOpen ? "w-60" : "w-0 overflow-hidden"} transition-all duration-300 border-r border-border/50 bg-card shrink-0`}>
          <div className="p-5 border-b border-border/50">
            <h2 className="text-lg font-bold"><span className="gradient-text">Vault</span>Bridge</h2>
            <p className="text-xs text-muted-foreground mt-1">Investor Dashboard</p>
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
            <h1 className="text-lg font-semibold">{shark ? `${shark.first_name} ${shark.last_name}` : "Investor Dashboard"}</h1>
            {shark?.company_name && <span className="text-sm text-muted-foreground">{shark.company_name}</span>}
          </header>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
            ) : (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                {activeTab === "portfolio" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Portfolio</h2>
                    {portfolio.length === 0 ? <p className="text-muted-foreground">No portfolio entries found.</p> : (
                      <>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                          {portfolio.map((item) => (
                            <div key={item.portfolio_id} className="glass-card rounded-xl p-5">
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-foreground text-sm">{item.startup_name}</h3>
                                <StatusBadge status={item.portfolio_status} />
                              </div>
                              <p className="text-2xl font-bold text-foreground mb-1">
                                {item.current_valuation_usd ? `$${(Number(item.current_valuation_usd) / 1e6).toFixed(1)}M` : "N/A"}
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3">
                                <span>Equity: {item.current_equity_percent ? `${item.current_equity_percent}%` : "N/A"}</span>
                                <span>Invested: {item.total_invested_usd ? `$${Number(item.total_invested_usd).toLocaleString()}` : "N/A"}</span>
                                <span className={item.roi_percent < 0 ? "text-destructive" : "text-success"}>ROI: {item.roi_percent != null ? `${item.roi_percent}%` : "N/A"}</span>
                              </div>
                              <div className="mt-4 flex gap-2">
                                <button onClick={() => handlePortfolioEdit(item)} className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15">
                                  Edit
                                </button>
                                <button onClick={() => handlePortfolioDelete(item)} className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/15">
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="glass-card rounded-xl p-5">
                          <h3 className="font-semibold mb-4">Portfolio Distribution (K USD)</h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={portfolioChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                              <XAxis dataKey="name" stroke="hsl(215,20%,55%)" fontSize={11} />
                              <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                              <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                              <Bar dataKey="invested" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "deals" && (
                  <div>
                    <h2 className="text-xl font-bold mb-5">Deals</h2>
                    {deals.length === 0 ? <p className="text-muted-foreground">No deals found.</p> : (
                      <div className="glass-card rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-border/50 text-muted-foreground text-left">
                            <th className="p-4 font-medium">Startup</th>
                            <th className="p-4 font-medium">Amount</th>
                            <th className="p-4 font-medium">Equity</th>
                            <th className="p-4 font-medium">Type</th>
                            <th className="p-4 font-medium">Date</th>
                            <th className="p-4 font-medium">Status</th>
                          </tr></thead>
                          <tbody>
                            {deals.map((deal) => (
                              <tr key={deal.deal_id} className="border-b border-border/30">
                                <td className="p-4 font-medium text-foreground">{deal.startup_name}</td>
                                <td className="p-4 text-muted-foreground">{deal.deal_amount_usd ? `$${Number(deal.deal_amount_usd).toLocaleString()}` : "N/A"}</td>
                                <td className="p-4 text-muted-foreground">{deal.deal_equity_percent ? `${deal.deal_equity_percent}%` : "N/A"}</td>
                                <td className="p-4 text-muted-foreground">{deal.deal_type}</td>
                                <td className="p-4 text-muted-foreground">{deal.handshake_date?.slice(0, 10) || "N/A"}</td>
                                <td className="p-4"><StatusBadge status={deal.deal_status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "company" && (
                  <div>
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl font-bold">Company Details</h2>
                      {shark && (
                        <div className="flex gap-2">
                          <button onClick={handleInvestorEdit} className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/15">
                            Edit Investor
                          </button>
                          <button onClick={handleInvestorDelete} className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/15">
                            Delete Investor
                          </button>
                        </div>
                      )}
                    </div>
                    {!shark ? <p className="text-muted-foreground">No investor data found.</p> : (
                      <div className="glass-card rounded-xl p-6 max-w-lg">
                        <div className="space-y-4 text-sm">
                          {[
                            ["Name", `${shark.first_name} ${shark.last_name}`],
                            ["Company", shark.company_name || "N/A"],
                            ["Company Type", shark.company_type || "N/A"],
                            ["Net Worth", shark.net_worth_usd_millions ? `$${shark.net_worth_usd_millions}M` : "N/A"],
                            ["Nationality", shark.nationality || "N/A"],
                            ["Email", shark.email || "N/A"],
                          ].map(([label, value]: [string, string]) => (
                            <div key={label} className="flex justify-between py-2 border-b border-border/30">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-medium text-foreground">{value}</span>
                            </div>
                          ))}
                          {shark.bio && (
                            <div className="pt-2">
                              <p className="text-muted-foreground text-xs mb-1">Bio</p>
                              <p className="text-foreground text-sm">{shark.bio}</p>
                            </div>
                          )}
                          {expertise.length > 0 && (
                            <div className="pt-2">
                              <p className="text-muted-foreground text-xs mb-2">Expertise</p>
                              <div className="flex flex-wrap gap-2">
                                {expertise.map((item) => (
                                  <span key={item.expertise_id} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                                    {item.domain}
                                    {item.years_experience ? ` • ${item.years_experience}y` : ""}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
        onSubmit={handleEditorSubmit}
        submitting={submitting}
        submitLabel={editorSubmitLabel}
      />
    </PageTransition>
  );
};

export default InvestorDashboard;
