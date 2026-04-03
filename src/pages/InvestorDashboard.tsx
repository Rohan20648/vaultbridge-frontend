import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Briefcase, Building2, Handshake, Loader2, Menu } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import StatusBadge from "@/components/StatusBadge";
import { getDeals, getPortfolio, getShark, getSharks } from "@/lib/api";

const tabs = [
  { key: "portfolio", label: "Portfolio", icon: Briefcase },
  { key: "deals", label: "Deals", icon: Handshake },
  { key: "company", label: "Company", icon: Building2 },
] as const;

const InvestorDashboard = () => {
  const [activeTab, setActiveTab] = useState("portfolio");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [shark, setShark] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [expertise, setExpertise] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [sharksRes, portfolioRes, dealsRes] = await Promise.all([getSharks(), getPortfolio(), getDeals()]);
        const firstShark = (sharksRes.data || [])[0];
        if (!firstShark) return;

        const sharkDetails = await getShark(firstShark.shark_id);
        setShark({ ...firstShark, ...(sharkDetails.data || {}) });
        setExpertise(sharkDetails.data?.expertise || []);
        setPortfolio((portfolioRes.data || []).filter((item: any) => item.shark_id === firstShark.shark_id));
        setDeals((dealsRes.data || []).filter((item: any) => item.sharks && item.sharks.includes(firstShark.first_name)));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const portfolioChartData = portfolio.map((item: any) => ({
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
                          {portfolio.map((item: any) => (
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
                            {deals.map((deal: any) => (
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
                    <h2 className="text-xl font-bold mb-5">Company Details</h2>
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
                                {expertise.map((item: any) => (
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
    </PageTransition>
  );
};

export default InvestorDashboard;
