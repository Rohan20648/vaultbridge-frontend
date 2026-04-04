import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Briefcase, Building2, Handshake, Loader2, Menu, X } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import StatusBadge from "@/components/StatusBadge";
import {
  deletePortfolio, deleteShark, getDeals, getPortfolio,
  getShark, getSharks, updatePortfolio, updateShark,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

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

type EditMode =
  | { type: "investor"; shark: SharkRecord }
  | { type: "portfolio"; item: PortfolioRecord }
  | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
};

const nullify = (v: string | undefined | null): string | null =>
  v?.trim() ? v.trim() : null;

// ─── Inline Edit Modal ────────────────────────────────────────────────────────

const EditModal = ({
  mode,
  onClose,
  onSaved,
}: {
  mode: EditMode;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // ── Investor form state ──
  const [invForm, setInvForm] = useState(() =>
    mode?.type === "investor"
      ? {
          first_name: mode.shark.first_name || "",
          last_name: mode.shark.last_name || "",
          email: mode.shark.email || "",
          phone: mode.shark.phone || "",
          nationality: mode.shark.nationality || "",
          net_worth_usd_millions: mode.shark.net_worth_usd_millions != null
            ? String(mode.shark.net_worth_usd_millions) : "",
          bio: mode.shark.bio || "",
        }
      : null
  );

  // ── Portfolio form state ──
  const [portForm, setPortForm] = useState(() =>
    mode?.type === "portfolio"
      ? {
          total_invested_usd: mode.item.total_invested_usd != null
            ? String(mode.item.total_invested_usd) : "",
          current_equity_percent: mode.item.current_equity_percent != null
            ? String(mode.item.current_equity_percent) : "",
          portfolio_status: mode.item.portfolio_status || "Active",
          current_valuation_usd: mode.item.current_valuation_usd != null
            ? String(mode.item.current_valuation_usd) : "",
          roi_percent: mode.item.roi_percent != null
            ? String(mode.item.roi_percent) : "",
        }
      : null
  );

  if (!mode) return null;

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      if (mode.type === "investor" && invForm) {
        await updateShark(mode.shark.shark_id, {
          first_name:              invForm.first_name.trim(),
          last_name:               nullify(invForm.last_name),
          email:                   nullify(invForm.email),
          phone:                   nullify(invForm.phone),
          nationality:             nullify(invForm.nationality),
          net_worth_usd_millions:  invForm.net_worth_usd_millions
                                     ? parseFloat(invForm.net_worth_usd_millions) : null,
          bio:                     nullify(invForm.bio),
        });
        toast({ title: "Investor updated", description: "Profile saved successfully." });
      }

      if (mode.type === "portfolio" && portForm) {
        await updatePortfolio(mode.item.portfolio_id, {
          total_invested_usd:     portForm.total_invested_usd
                                    ? parseFloat(portForm.total_invested_usd) : null,
          current_equity_percent: portForm.current_equity_percent
                                    ? parseFloat(portForm.current_equity_percent) : null,
          portfolio_status:       portForm.portfolio_status,
          current_valuation_usd:  portForm.current_valuation_usd
                                    ? parseFloat(portForm.current_valuation_usd) : null,
          roi_percent:            portForm.roi_percent
                                    ? parseFloat(portForm.roi_percent) : null,
        });
        toast({ title: "Portfolio updated", description: "Entry saved successfully." });
      }

      onSaved();
      onClose();
    } catch (error: unknown) {
      toast({
        title: "Update failed",
        description: getErrorMessage(error, "Could not save changes."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">
              {mode.type === "investor" ? "Edit Investor Profile" : `Edit Portfolio — ${mode.item.startup_name}`}
            </h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* ── Investor form ── */}
          {mode.type === "investor" && invForm && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>First Name *</label>
                  <input
                    className={inputClass}
                    value={invForm.first_name}
                    onChange={e => setInvForm({ ...invForm, first_name: e.target.value })}
                    placeholder="Sarah"
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    className={inputClass}
                    value={invForm.last_name}
                    onChange={e => setInvForm({ ...invForm, last_name: e.target.value })}
                    placeholder="Chen"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  className={inputClass}
                  value={invForm.email}
                  onChange={e => setInvForm({ ...invForm, email: e.target.value })}
                  placeholder="sarah@apexvc.com"
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  className={inputClass}
                  value={invForm.phone}
                  onChange={e => setInvForm({ ...invForm, phone: e.target.value })}
                  placeholder="+1 555 987 6543"
                />
              </div>
              <div>
                <label className={labelClass}>Nationality</label>
                <input
                  className={inputClass}
                  value={invForm.nationality}
                  onChange={e => setInvForm({ ...invForm, nationality: e.target.value })}
                  placeholder="American"
                />
              </div>
              <div>
                <label className={labelClass}>Net Worth (USD millions)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={invForm.net_worth_usd_millions}
                  onChange={e => setInvForm({ ...invForm, net_worth_usd_millions: e.target.value })}
                  placeholder="340"
                />
              </div>
              <div>
                <label className={labelClass}>Bio</label>
                <textarea
                  className={inputClass + " min-h-[80px] resize-none"}
                  value={invForm.bio}
                  onChange={e => setInvForm({ ...invForm, bio: e.target.value })}
                  placeholder="Investment philosophy..."
                />
              </div>
            </div>
          )}

          {/* ── Portfolio form ── */}
          {mode.type === "portfolio" && portForm && (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Total Invested (USD)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={portForm.total_invested_usd}
                  onChange={e => setPortForm({ ...portForm, total_invested_usd: e.target.value })}
                  placeholder="2000000"
                />
              </div>
              <div>
                <label className={labelClass}>Current Equity %</label>
                <input
                  type="number"
                  className={inputClass}
                  value={portForm.current_equity_percent}
                  onChange={e => setPortForm({ ...portForm, current_equity_percent: e.target.value })}
                  placeholder="15"
                />
              </div>
              <div>
                <label className={labelClass}>Portfolio Status</label>
                <select
                  className={inputClass}
                  value={portForm.portfolio_status}
                  onChange={e => setPortForm({ ...portForm, portfolio_status: e.target.value })}
                >
                  {["Active", "Exited", "Written Off"].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Current Valuation (USD)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={portForm.current_valuation_usd}
                  onChange={e => setPortForm({ ...portForm, current_valuation_usd: e.target.value })}
                  placeholder="12000000"
                />
              </div>
              <div>
                <label className={labelClass}>ROI %</label>
                <input
                  type="number"
                  className={inputClass}
                  value={portForm.roi_percent}
                  onChange={e => setPortForm({ ...portForm, roi_percent: e.target.value })}
                  placeholder="145"
                />
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border/30">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-70 transition-colors"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const tabs = [
  { key: "portfolio", label: "Portfolio", icon: Briefcase },
  { key: "deals",     label: "Deals",     icon: Handshake },
  { key: "company",   label: "Company",   icon: Building2 },
] as const;

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const InvestorDashboard = () => {
  const [activeTab, setActiveTab] = useState("portfolio");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [shark, setShark] = useState<SharkRecord | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioRecord[]>([]);
  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [expertise, setExpertise] = useState<ExpertiseRecord[]>([]);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const { toast } = useToast();

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [sharksRes, portfolioRes, dealsRes] = await Promise.all([
        getSharks(), getPortfolio(), getDeals(),
      ]);
      const sharks: SharkRecord[] = sharksRes.data || [];
      const savedSharkId = Number(localStorage.getItem("vaultbridge_investor_shark_id"));
      const selectedShark = sharks.find(s => s.shark_id === savedSharkId) || sharks[0];
      if (!selectedShark) return;

      const sharkDetails = await getShark(selectedShark.shark_id);
      setShark({ ...selectedShark, ...(sharkDetails.data || {}) });
      setExpertise(sharkDetails.data?.expertise || []);
      setPortfolio(
        (portfolioRes.data || []).filter(
          (item: PortfolioRecord) => item.shark_id === selectedShark.shark_id
        )
      );
      setDeals(
        (dealsRes.data || []).filter(
          (item: DealRecord) =>
            item.sharks && item.sharks.includes(selectedShark.first_name || "")
        )
      );
    } catch (error: unknown) {
      console.error(error);
      toast({
        title: "Loading failed",
        description: "Could not load investor dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const handleInvestorDelete = async () => {
    if (!shark || !window.confirm(`Delete investor ${shark.first_name} ${shark.last_name}?`)) return;
    try {
      await deleteShark(shark.shark_id);
      toast({ title: "Investor deleted", description: "The investor record was deleted." });
      localStorage.removeItem("vaultbridge_investor_shark_id");
      window.location.reload();
    } catch (error: unknown) {
      toast({
        title: "Delete failed",
        description: getErrorMessage(error, "Could not delete investor."),
        variant: "destructive",
      });
    }
  };

  const handlePortfolioDelete = async (item: PortfolioRecord) => {
    if (!window.confirm(`Delete portfolio entry for ${item.startup_name}?`)) return;
    try {
      await deletePortfolio(item.portfolio_id);
      toast({ title: "Portfolio entry deleted", description: `${item.startup_name} removed.` });
      await loadDashboard();
    } catch (error: unknown) {
      toast({
        title: "Delete failed",
        description: getErrorMessage(error, "Could not delete portfolio entry."),
        variant: "destructive",
      });
    }
  };

  const portfolioChartData = portfolio.map(item => ({
    name: item.startup_name,
    invested: item.total_invested_usd ? Number(item.total_invested_usd) / 1000 : 0,
  }));

  return (
    <PageTransition>
      <div className="min-h-screen flex">

        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? "w-60" : "w-0 overflow-hidden"} transition-all duration-300 border-r border-border/50 bg-card shrink-0`}
        >
          <div className="p-5 border-b border-border/50">
            <h2 className="text-lg font-bold">
              <span className="gradient-text">Vault</span>Bridge
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Investor Dashboard</p>
          </div>
          <nav className="p-3 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <header className="h-14 border-b border-border/50 flex items-center px-5 gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold">
              {shark ? `${shark.first_name} ${shark.last_name}` : "Investor Dashboard"}
            </h1>
            {shark?.company_name && (
              <span className="text-sm text-muted-foreground">{shark.company_name}</span>
            )}
          </header>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 size={28} className="animate-spin text-primary" />
              </div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >

                {/* ── Portfolio tab ── */}
                {activeTab === "portfolio" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Portfolio</h2>
                    {portfolio.length === 0 ? (
                      <p className="text-muted-foreground">No portfolio entries found.</p>
                    ) : (
                      <>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                          {portfolio.map(item => (
                            <div key={item.portfolio_id} className="glass-card rounded-xl p-5">
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-foreground text-sm">
                                  {item.startup_name}
                                </h3>
                                <StatusBadge status={item.portfolio_status} />
                              </div>
                              <p className="text-2xl font-bold text-foreground mb-1">
                                {item.current_valuation_usd
                                  ? `$${(Number(item.current_valuation_usd) / 1e6).toFixed(1)}M`
                                  : "N/A"}
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3">
                                <span>
                                  Equity: {item.current_equity_percent
                                    ? `${item.current_equity_percent}%` : "N/A"}
                                </span>
                                <span>
                                  Invested: {item.total_invested_usd
                                    ? `$${Number(item.total_invested_usd).toLocaleString()}` : "N/A"}
                                </span>
                                <span className={
                                  (item.roi_percent ?? 0) < 0 ? "text-destructive" : "text-success"
                                }>
                                  ROI: {item.roi_percent != null ? `${item.roi_percent}%` : "N/A"}
                                </span>
                              </div>
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={() => setEditMode({ type: "portfolio", item })}
                                  className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handlePortfolioDelete(item)}
                                  className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/15"
                                >
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
                              <Tooltip
                                contentStyle={{
                                  background: "hsl(217,33%,10%)",
                                  border: "1px solid hsl(217,33%,18%)",
                                  borderRadius: 8,
                                }}
                              />
                              <Bar dataKey="invested" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── Deals tab ── */}
                {activeTab === "deals" && (
                  <div>
                    <h2 className="text-xl font-bold mb-5">Deals</h2>
                    {deals.length === 0 ? (
                      <p className="text-muted-foreground">No deals found.</p>
                    ) : (
                      <div className="glass-card rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/50 text-muted-foreground text-left">
                              <th className="p-4 font-medium">Startup</th>
                              <th className="p-4 font-medium">Amount</th>
                              <th className="p-4 font-medium">Equity</th>
                              <th className="p-4 font-medium">Type</th>
                              <th className="p-4 font-medium">Date</th>
                              <th className="p-4 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deals.map(deal => (
                              <tr key={deal.deal_id} className="border-b border-border/30">
                                <td className="p-4 font-medium text-foreground">{deal.startup_name}</td>
                                <td className="p-4 text-muted-foreground">
                                  {deal.deal_amount_usd
                                    ? `$${Number(deal.deal_amount_usd).toLocaleString()}` : "N/A"}
                                </td>
                                <td className="p-4 text-muted-foreground">
                                  {deal.deal_equity_percent ? `${deal.deal_equity_percent}%` : "N/A"}
                                </td>
                                <td className="p-4 text-muted-foreground">{deal.deal_type}</td>
                                <td className="p-4 text-muted-foreground">
                                  {deal.handshake_date?.slice(0, 10) || "N/A"}
                                </td>
                                <td className="p-4">
                                  <StatusBadge status={deal.deal_status} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Company tab ── */}
                {activeTab === "company" && (
                  <div>
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl font-bold">Company Details</h2>
                      {shark && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditMode({ type: "investor", shark })}
                            className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/15"
                          >
                            Edit Investor
                          </button>
                          <button
                            onClick={handleInvestorDelete}
                            className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/15"
                          >
                            Delete Investor
                          </button>
                        </div>
                      )}
                    </div>

                    {!shark ? (
                      <p className="text-muted-foreground">No investor data found.</p>
                    ) : (
                      <div className="glass-card rounded-xl p-6 max-w-lg">
                        <div className="space-y-4 text-sm">
                          {(
                            [
                              ["Name",         `${shark.first_name} ${shark.last_name}`],
                              ["Company",      shark.company_name || "N/A"],
                              ["Company Type", shark.company_type || "N/A"],
                              ["Net Worth",    shark.net_worth_usd_millions
                                                 ? `$${shark.net_worth_usd_millions}M` : "N/A"],
                              ["Nationality",  shark.nationality || "N/A"],
                              ["Email",        shark.email || "N/A"],
                              ["Phone",        shark.phone || "N/A"],
                            ] as [string, string][]
                          ).map(([label, value]) => (
                            <div
                              key={label}
                              className="flex justify-between py-2 border-b border-border/30"
                            >
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
                                {expertise.map(item => (
                                  <span
                                    key={item.expertise_id}
                                    className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                                  >
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

      {/* Inline edit modal — no raw JSON exposed */}
      {editMode && (
        <EditModal
          mode={editMode}
          onClose={() => setEditMode(null)}
          onSaved={loadDashboard}
        />
      )}
    </PageTransition>
  );
};

export default InvestorDashboard;
