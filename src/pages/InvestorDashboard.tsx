import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, Handshake, GraduationCap, Building2, Menu, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import StatusBadge from "@/components/StatusBadge";
import PageTransition from "@/components/PageTransition";
import { getSharks, getPortfolio, getDeals } from "@/lib/api";

const tabs = [
  { key: "portfolio", label: "Portfolio", icon: Briefcase },
  { key: "deals", label: "Deals", icon: Handshake },
  { key: "company", label: "Company", icon: Building2 },
];

const chartColors = { primary: "hsl(217, 91%, 60%)", secondary: "hsl(160, 84%, 39%)" };

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <Loader2 size={28} className="animate-spin text-primary" />
  </div>
);

const InvestorDashboard = () => {
  const [activeTab, setActiveTab] = useState("portfolio");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shark, setShark] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [sRes, pRes, dRes] = await Promise.all([
          getSharks(),
          getPortfolio(),
          getDeals(),
        ]);
        const firstShark = (sRes.data || [])[0];
        setShark(firstShark);

        if (firstShark) {
          const sid = firstShark.shark_id;
          setPortfolio((pRes.data || []).filter((p: any) => p.shark_id === sid));
          // Deals that involve this shark (via deal_shark join — sharks field contains name)
          const sharkName = `${firstShark.first_name} ${firstShark.last_name}`;
          setDeals((dRes.data || []).filter((d: any) =>
            d.sharks && d.sharks.includes(firstShark.first_name)
          ));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const portfolioChartData = portfolio.map((p: any) => ({
    name: p.startup_name,
    invested: p.total_invested_usd ? Number(p.total_invested_usd) / 1000 : 0, // in K
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
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === t.key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="h-14 border-b border-border/50 flex items-center px-5 gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground"><Menu size={20} /></button>
            <h1 className="text-lg font-semibold">{shark ? `${shark.first_name} ${shark.last_name}` : "Loading..."}</h1>
            {shark?.company_name && <span className="text-sm text-muted-foreground">{shark.company_name}</span>}
          </header>

          <div className="p-6">
            {loading ? <Spinner /> : (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {activeTab === "portfolio" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Portfolio</h2>
                    {portfolio.length === 0 ? <p className="text-muted-foreground">No portfolio entries found.</p> : (
                      <>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                          {portfolio.map((p: any) => (
                            <div key={p.portfolio_id} className="glass-card glass-card-hover rounded-xl p-5">
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-foreground text-sm">{p.startup_name}</h3>
                                <StatusBadge status={p.portfolio_status} />
                              </div>
                              <p className="text-2xl font-bold text-foreground mb-1">
                                {p.current_valuation_usd ? `$${(Number(p.current_valuation_usd) / 1e6).toFixed(1)}M` : "N/A"}
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3">
                                <span>Equity: {p.current_equity_percent ? `${p.current_equity_percent}%` : "—"}</span>
                                <span>Invested: {p.total_invested_usd ? `$${Number(p.total_invested_usd).toLocaleString()}` : "—"}</span>
                                <span className={p.roi_percent < 0 ? "text-destructive" : "text-success"}>
                                  ROI: {p.roi_percent != null ? `${p.roi_percent}%` : "—"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {portfolioChartData.length > 0 && (
                          <div className="glass-card rounded-xl p-5">
                            <h3 className="font-semibold mb-4">Portfolio Distribution (K USD)</h3>
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={portfolioChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                                <XAxis dataKey="name" stroke="hsl(215,20%,55%)" fontSize={11} />
                                <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                                <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                                <Bar dataKey="invested" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
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
                            {deals.map((d: any) => (
                              <tr key={d.deal_id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                                <td className="p-4 font-medium text-foreground">{d.startup_name}</td>
                                <td className="p-4 text-muted-foreground">{d.deal_amount_usd ? `$${Number(d.deal_amount_usd).toLocaleString()}` : "—"}</td>
                                <td className="p-4 text-muted-foreground">{d.deal_equity_percent ? `${d.deal_equity_percent}%` : "—"}</td>
                                <td className="p-4 text-muted-foreground">{d.deal_type}</td>
                                <td className="p-4 text-muted-foreground">{d.handshake_date?.slice(0, 10) || "—"}</td>
                                <td className="p-4"><StatusBadge status={d.deal_status} /></td>
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
                    <h2 className="text-xl font-bold mb-5">Company Details</h2>
                    {!shark ? <p className="text-muted-foreground">No investor data found.</p> : (
                      <div className="glass-card rounded-xl p-6 max-w-lg">
                        <div className="space-y-4 text-sm">
                          {[
                            ["Name", `${shark.first_name} ${shark.last_name}`],
                            ["Company", shark.company_name || "—"],
                            ["Company Type", shark.company_type || "—"],
                            ["Net Worth", shark.net_worth_usd_millions ? `$${shark.net_worth_usd_millions}M` : "—"],
                            ["Nationality", shark.nationality || "—"],
                            ["Email", shark.email || "—"],
                          ].map(([k, v]) => (
                            <div key={k} className="flex justify-between py-2 border-b border-border/30">
                              <span className="text-muted-foreground">{k}</span>
                              <span className="font-medium text-foreground">{v}</span>
                            </div>
                          ))}
                          {shark.bio && (
                            <div className="pt-2">
                              <p className="text-muted-foreground text-xs mb-1">Bio</p>
                              <p className="text-foreground text-sm">{shark.bio}</p>
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
    </PageTransition>
  );
};

export default InvestorDashboard;
