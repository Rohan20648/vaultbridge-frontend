import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Package, Handshake, Flag, Users, Activity, Shield, TrendingUp, Home, Menu, Loader2 } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import StatusBadge from "@/components/StatusBadge";
import PageTransition from "@/components/PageTransition";
import {
  getStartups, getProducts, getDeals, getMilestones, getTeamHistory,
  getMetrics, getHealthScores, getValuations
} from "@/lib/api";

const tabs = [
  { key: "overview", label: "Overview", icon: Home },
  { key: "products", label: "Products", icon: Package },
  { key: "deals", label: "Deals", icon: Handshake },
  { key: "milestones", label: "Milestones", icon: Flag },
  { key: "team", label: "Team", icon: Users },
  { key: "metrics", label: "Metrics", icon: Activity },
  { key: "health", label: "Health Score", icon: Shield },
  { key: "valuations", label: "Valuations", icon: TrendingUp },
];

const chartColors = { primary: "hsl(217, 91%, 60%)", secondary: "hsl(160, 84%, 39%)", muted: "hsl(215, 20%, 55%)" };

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <Loader2 size={28} className="animate-spin text-primary" />
  </div>
);

const FounderDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Current startup: take the first one from the list
  const [startup, setStartup] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [teamHistory, setTeamHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [healthScores, setHealthScores] = useState<any[]>([]);
  const [valuations, setValuations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [sRes, pRes, dRes, mRes, tRes, meRes, hRes, vRes] = await Promise.all([
          getStartups(),
          getProducts(),
          getDeals(),
          getMilestones(),
          getTeamHistory(),
          getMetrics(),
          getHealthScores(),
          getValuations(),
        ]);
        const firstStartup = (sRes.data || [])[0];
        setStartup(firstStartup);

        if (firstStartup) {
          const sid = firstStartup.startup_id;
          setProducts((pRes.data || []).filter((p: any) => p.startup_id === sid));
          setDeals((dRes.data || []).filter((d: any) => d.startup_id === sid));
          setMilestones((mRes.data || []).filter((m: any) => m.startup_id === sid));
          setTeamHistory((tRes.data || []).filter((t: any) => t.startup_id === sid).sort((a: any, b: any) => a.record_date.localeCompare(b.record_date)));
          setMetrics((meRes.data || []).filter((m: any) => m.startup_id === sid).sort((a: any, b: any) => a.snapshot_date.localeCompare(b.snapshot_date)));
          setHealthScores((hRes.data || []).filter((h: any) => h.startup_id === sid));
          setValuations((vRes.data || []).filter((v: any) => v.startup_id === sid).sort((a: any, b: any) => a.valuation_date.localeCompare(b.valuation_date)));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const latestMetric = metrics[metrics.length - 1];
  const latestHealth = healthScores[0];
  const healthRadarData = latestHealth ? [
    { subject: "Financial", A: latestHealth.financial_score || 0 },
    { subject: "Team", A: latestHealth.team_score || 0 },
    { subject: "Product", A: latestHealth.product_score || 0 },
    { subject: "Market", A: latestHealth.market_score || 0 },
    { subject: "Overall", A: latestHealth.overall_score || 0 },
  ] : [];

  const revenueChartData = metrics.map((m: any) => ({
    month: m.snapshot_date?.slice(0, 7),
    revenue: m.monthly_revenue_usd || 0,
    burn: m.monthly_burn_usd || 0,
  }));

  const teamChartData = teamHistory.map((t: any) => ({
    month: t.record_date?.slice(0, 7),
    count: t.total_headcount || 0,
  }));

  const valuationChartData = valuations.map((v: any) => ({
    date: v.valuation_date?.slice(0, 10),
    val: v.valuation_usd ? (v.valuation_usd / 1e6) : 0,
  }));

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
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === t.key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <header className="h-14 border-b border-border/50 flex items-center px-5 gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold">{startup?.startup_name || "Loading..."}</h1>
            {startup && <StatusBadge status={startup.status} />}
          </header>

          <div className="p-6">
            {loading ? (
              <Spinner />
            ) : (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-3 gap-5">
                      <div className="glass-card rounded-xl p-5">
                        <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                        <p className="text-2xl font-bold mt-1 text-foreground">{latestMetric?.monthly_revenue_usd ? `$${Number(latestMetric.monthly_revenue_usd).toLocaleString()}` : "N/A"}</p>
                      </div>
                      <div className="glass-card rounded-xl p-5">
                        <p className="text-sm text-muted-foreground">Monthly Burn</p>
                        <p className="text-2xl font-bold mt-1 text-foreground">{latestMetric?.monthly_burn_usd ? `$${Number(latestMetric.monthly_burn_usd).toLocaleString()}` : "N/A"}</p>
                      </div>
                      <div className="glass-card rounded-xl p-5">
                        <p className="text-sm text-muted-foreground">Runway</p>
                        <p className="text-2xl font-bold mt-1 text-foreground">{latestMetric?.runway_months ? `${latestMetric.runway_months} months` : "N/A"}</p>
                      </div>
                    </div>
                    {revenueChartData.length > 0 && (
                      <div className="glass-card rounded-xl p-5">
                        <h3 className="font-semibold mb-4">Revenue vs Burn Rate</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                            <XAxis dataKey="month" stroke={chartColors.muted} fontSize={12} />
                            <YAxis stroke={chartColors.muted} fontSize={12} />
                            <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                            <Area type="monotone" dataKey="revenue" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.1} />
                            <Area type="monotone" dataKey="burn" stroke={chartColors.secondary} fill={chartColors.secondary} fillOpacity={0.1} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {healthRadarData.length > 0 && (
                      <div className="glass-card rounded-xl p-5">
                        <h3 className="font-semibold mb-4">Health Score</h3>
                        <ResponsiveContainer width="100%" height={280}>
                          <RadarChart data={healthRadarData}>
                            <PolarGrid stroke="hsl(217,33%,18%)" />
                            <PolarAngleAxis dataKey="subject" stroke={chartColors.muted} fontSize={12} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={chartColors.muted} fontSize={10} />
                            <Radar dataKey="A" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "products" && (
                  <div>
                    <h2 className="text-xl font-bold mb-5">Products</h2>
                    {products.length === 0 ? <p className="text-muted-foreground">No products found.</p> : (
                      <div className="glass-card rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-border/50 text-muted-foreground text-left">
                            <th className="p-4 font-medium">Product</th>
                            <th className="p-4 font-medium">Category</th>
                            <th className="p-4 font-medium">Unit Price</th>
                            <th className="p-4 font-medium">Units Sold</th>
                            <th className="p-4 font-medium">Patented</th>
                            <th className="p-4 font-medium">Launch Date</th>
                          </tr></thead>
                          <tbody>
                            {products.map((p: any) => (
                              <tr key={p.product_id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                                <td className="p-4 font-medium text-foreground">{p.product_name}</td>
                                <td className="p-4 text-muted-foreground">{p.category_name || "—"}</td>
                                <td className="p-4 text-muted-foreground">{p.unit_price_usd ? `$${p.unit_price_usd}` : "—"}</td>
                                <td className="p-4 text-muted-foreground">{p.units_sold?.toLocaleString() ?? "—"}</td>
                                <td className="p-4">{p.is_patented ? <span className="text-success text-xs">✓ Yes</span> : <span className="text-muted-foreground text-xs">No</span>}</td>
                                <td className="p-4 text-muted-foreground">{p.launch_date?.slice(0, 10) || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "deals" && (
                  <div>
                    <h2 className="text-xl font-bold mb-5">Deals</h2>
                    {deals.length === 0 ? <p className="text-muted-foreground">No deals found.</p> : (
                      <div className="space-y-4">
                        {deals.map((d: any) => (
                          <div key={d.deal_id} className="glass-card glass-card-hover rounded-xl p-5 flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">{d.sharks || "Unknown Investor"}</h3>
                              <p className="text-sm text-muted-foreground">{d.deal_type} · {d.deal_equity_percent}% equity</p>
                              {d.handshake_date && <p className="text-xs text-muted-foreground">{d.handshake_date?.slice(0, 10)}</p>}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground">{d.deal_amount_usd ? `$${Number(d.deal_amount_usd).toLocaleString()}` : "—"}</p>
                              <StatusBadge status={d.deal_status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "milestones" && (
                  <div>
                    <h2 className="text-xl font-bold mb-5">Milestones</h2>
                    {milestones.length === 0 ? <p className="text-muted-foreground">No milestones found.</p> : (
                      <div className="relative ml-4 border-l-2 border-border/50 space-y-6 pl-8">
                        {milestones.map((m: any, i: number) => (
                          <motion.div key={m.milestone_id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative">
                            <div className="absolute -left-[2.55rem] top-1 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                            <div className="glass-card rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground">{m.description || m.milestone_type}</h3>
                                {m.verified ? <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full">Verified</span> : null}
                              </div>
                              <p className="text-sm text-muted-foreground">{m.milestone_date?.slice(0, 10)} · {m.milestone_type}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "team" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Team</h2>
                    {teamChartData.length > 0 ? (
                      <>
                        <div className="glass-card rounded-xl p-5">
                          <h3 className="font-semibold mb-4">Headcount Over Time</h3>
                          <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={teamChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                              <XAxis dataKey="month" stroke={chartColors.muted} fontSize={12} />
                              <YAxis stroke={chartColors.muted} fontSize={12} />
                              <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                              <Line type="monotone" dataKey="count" stroke={chartColors.primary} strokeWidth={2} dot={{ r: 4, fill: chartColors.primary }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        {teamHistory.length > 0 && (() => {
                          const latest = teamHistory[teamHistory.length - 1];
                          const deptData = [
                            { dept: "Engineering", count: latest.engineering_count || 0 },
                            { dept: "Sales", count: latest.sales_count || 0 },
                            { dept: "Ops", count: latest.ops_count || 0 },
                          ].filter(d => d.count > 0);
                          return deptData.length > 0 ? (
                            <div className="glass-card rounded-xl p-5">
                              <h3 className="font-semibold mb-4">Latest Department Breakdown</h3>
                              <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={deptData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                                  <XAxis dataKey="dept" stroke={chartColors.muted} fontSize={12} />
                                  <YAxis stroke={chartColors.muted} fontSize={12} />
                                  <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                                  <Bar dataKey="count" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          ) : null;
                        })()}
                      </>
                    ) : <p className="text-muted-foreground">No team history data.</p>}
                  </div>
                )}

                {activeTab === "metrics" && (
                  <div>
                    <h2 className="text-xl font-bold mb-5">Operational Metrics</h2>
                    {metrics.length === 0 ? <p className="text-muted-foreground">No metrics recorded.</p> : (
                      <div className="glass-card rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-border/50 text-muted-foreground text-left">
                            <th className="p-4 font-medium">Date</th>
                            <th className="p-4 font-medium">Revenue</th>
                            <th className="p-4 font-medium">Burn</th>
                            <th className="p-4 font-medium">Runway</th>
                            <th className="p-4 font-medium">Churn</th>
                            <th className="p-4 font-medium">NPS</th>
                            <th className="p-4 font-medium">Customers</th>
                          </tr></thead>
                          <tbody>
                            {metrics.map((m: any) => (
                              <tr key={m.metric_id} className="border-b border-border/30">
                                <td className="p-4 font-medium text-foreground">{m.snapshot_date?.slice(0, 10)}</td>
                                <td className="p-4 text-muted-foreground">{m.monthly_revenue_usd ? `$${Number(m.monthly_revenue_usd).toLocaleString()}` : "—"}</td>
                                <td className="p-4 text-muted-foreground">{m.monthly_burn_usd ? `$${Number(m.monthly_burn_usd).toLocaleString()}` : "—"}</td>
                                <td className="p-4 text-muted-foreground">{m.runway_months ? `${m.runway_months}mo` : "—"}</td>
                                <td className="p-4 text-muted-foreground">{m.churn_rate_pct != null ? `${m.churn_rate_pct}%` : "—"}</td>
                                <td className="p-4 text-muted-foreground">{m.nps_score ?? "—"}</td>
                                <td className="p-4 text-muted-foreground">{m.customer_count?.toLocaleString() ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "health" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Health Score</h2>
                    {healthScores.length === 0 ? <p className="text-muted-foreground">No health scores recorded.</p> : (
                      <>
                        <div className="glass-card rounded-xl p-5">
                          <p className="text-sm text-muted-foreground mb-1">Latest Score Date: {latestHealth?.score_date?.slice(0, 10)}</p>
                          {latestHealth?.risk_flag && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${latestHealth.risk_flag === "Green" ? "bg-success/15 text-success" : latestHealth.risk_flag === "Yellow" ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"}`}>
                              Risk: {latestHealth.risk_flag}
                            </span>
                          )}
                          <ResponsiveContainer width="100%" height={350}>
                            <RadarChart data={healthRadarData}>
                              <PolarGrid stroke="hsl(217,33%,18%)" />
                              <PolarAngleAxis dataKey="subject" stroke={chartColors.muted} fontSize={12} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={chartColors.muted} fontSize={10} />
                              <Radar dataKey="A" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.25} strokeWidth={2} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "valuations" && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Valuations</h2>
                    {valuations.length === 0 ? <p className="text-muted-foreground">No valuations recorded.</p> : (
                      <>
                        <div className="glass-card rounded-xl p-5">
                          <h3 className="font-semibold mb-4">Valuation Over Time ($M)</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={valuationChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                              <XAxis dataKey="date" stroke={chartColors.muted} fontSize={12} />
                              <YAxis stroke={chartColors.muted} fontSize={12} />
                              <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                              <Line type="monotone" dataKey="val" stroke={chartColors.secondary} strokeWidth={2} dot={{ r: 5, fill: chartColors.secondary }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="glass-card rounded-xl overflow-hidden">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b border-border/50 text-muted-foreground text-left">
                              <th className="p-4 font-medium">Date</th>
                              <th className="p-4 font-medium">Valuation</th>
                              <th className="p-4 font-medium">Method</th>
                              <th className="p-4 font-medium">Source</th>
                            </tr></thead>
                            <tbody>
                              {valuations.map((v: any) => (
                                <tr key={v.valuation_id} className="border-b border-border/30">
                                  <td className="p-4 text-foreground">{v.valuation_date?.slice(0, 10)}</td>
                                  <td className="p-4 text-muted-foreground">{v.valuation_usd ? `$${Number(v.valuation_usd).toLocaleString()}` : "—"}</td>
                                  <td className="p-4 text-muted-foreground">{v.valuation_method || "—"}</td>
                                  <td className="p-4 text-muted-foreground">{v.source || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
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

export default FounderDashboard;
