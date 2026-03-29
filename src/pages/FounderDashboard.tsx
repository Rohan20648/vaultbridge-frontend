import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Package, Handshake, Flag, Users, Activity, Shield, FileText, TrendingUp, Home, Menu } from "lucide-react";
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import StatusBadge from "@/components/StatusBadge";
import PageTransition from "@/components/PageTransition";

const tabs = [
  { key: "overview", label: "Overview", icon: Home },
  { key: "products", label: "Products", icon: Package },
  { key: "deals", label: "Deals", icon: Handshake },
  { key: "milestones", label: "Milestones", icon: Flag },
  { key: "team", label: "Team", icon: Users },
  { key: "metrics", label: "Metrics", icon: Activity },
  { key: "health", label: "Health Score", icon: Shield },
  { key: "patents", label: "Patents", icon: FileText },
  { key: "valuations", label: "Valuations", icon: TrendingUp },
];

const revenueData = [
  { month: "Jan", revenue: 120000, burn: 180000 },
  { month: "Feb", revenue: 135000, burn: 175000 },
  { month: "Mar", revenue: 160000, burn: 170000 },
  { month: "Apr", revenue: 190000, burn: 165000 },
  { month: "May", revenue: 220000, burn: 160000 },
  { month: "Jun", revenue: 255000, burn: 155000 },
];

const healthData = [
  { subject: "Financial", A: 82 },
  { subject: "Team", A: 75 },
  { subject: "Product", A: 90 },
  { subject: "Market", A: 68 },
  { subject: "Growth", A: 85 },
];

const teamData = [
  { month: "Jan", count: 18 }, { month: "Feb", count: 20 }, { month: "Mar", count: 22 },
  { month: "Apr", count: 25 }, { month: "May", count: 27 }, { month: "Jun", count: 28 },
];

const valuationData = [
  { date: "2023 Q1", val: 2 }, { date: "2023 Q3", val: 4.2 }, { date: "2024 Q1", val: 6.8 },
  { date: "2024 Q3", val: 10 }, { date: "2025 Q1", val: 14 }, { date: "2025 Q3", val: 18.5 },
];

const products = [
  { name: "ForgeAPI", category: "SaaS", price: "$299/mo", unitsSold: 1420, patented: true },
  { name: "ForgeStudio", category: "Platform", price: "$149/mo", unitsSold: 890, patented: false },
  { name: "ForgeEdge", category: "API", price: "$0.01/call", unitsSold: 45000, patented: true },
];

const deals = [
  { id: 1, shark: "Sarah Chen", amount: "$2M", equity: "12%", status: "Active", type: "Equity" },
  { id: 2, shark: "Marcus Rivera", amount: "$1.5M", equity: "8%", status: "Active", type: "Convertible Note" },
  { id: 3, shark: "David Kim", amount: "$500K", equity: "3%", status: "Closed", type: "Equity" },
];

const milestones = [
  { title: "Series A Closed", date: "2024-06-15", type: "Funding", verified: true },
  { title: "100K Users Milestone", date: "2024-09-22", type: "Growth", verified: true },
  { title: "SOC 2 Certification", date: "2025-01-10", type: "Compliance", verified: false },
  { title: "EU Market Launch", date: "2025-03-01", type: "Expansion", verified: true },
];

const patents = [
  { title: "Neural Architecture Search Method", status: "Granted", filed: "2023-03-15", granted: "2024-08-20" },
  { title: "Distributed LLM Inference Protocol", status: "Pending", filed: "2024-06-01", granted: null },
  { title: "Adaptive Token Compression", status: "Granted", filed: "2023-09-10", granted: "2025-01-15" },
];

const FounderDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const chartColors = { primary: "hsl(217, 91%, 60%)", secondary: "hsl(160, 84%, 39%)", muted: "hsl(215, 20%, 55%)" };

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
            <h1 className="text-lg font-semibold">NeuralForge AI</h1>
            <StatusBadge status="Active" />
          </header>

          <div className="p-6">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-3 gap-5">
                    {[
                      { label: "Monthly Revenue", value: "$255K", change: "+16%" },
                      { label: "Monthly Burn", value: "$155K", change: "-3%" },
                      { label: "Runway", value: "18 months", change: "" },
                    ].map(s => (
                      <div key={s.label} className="glass-card rounded-xl p-5">
                        <p className="text-sm text-muted-foreground">{s.label}</p>
                        <p className="text-2xl font-bold mt-1 text-foreground">{s.value}</p>
                        {s.change && <p className="text-xs text-success mt-1">{s.change}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="glass-card rounded-xl p-5">
                    <h3 className="font-semibold mb-4">Revenue vs Burn Rate</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                        <XAxis dataKey="month" stroke={chartColors.muted} fontSize={12} />
                        <YAxis stroke={chartColors.muted} fontSize={12} />
                        <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                        <Area type="monotone" dataKey="revenue" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.1} />
                        <Area type="monotone" dataKey="burn" stroke={chartColors.secondary} fill={chartColors.secondary} fillOpacity={0.1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="glass-card rounded-xl p-5">
                    <h3 className="font-semibold mb-4">Health Score</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={healthData}>
                        <PolarGrid stroke="hsl(217,33%,18%)" />
                        <PolarAngleAxis dataKey="subject" stroke={chartColors.muted} fontSize={12} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={chartColors.muted} fontSize={10} />
                        <Radar dataKey="A" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === "products" && (
                <div>
                  <h2 className="text-xl font-bold mb-5">Products</h2>
                  <div className="glass-card rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border/50 text-muted-foreground text-left">
                        <th className="p-4 font-medium">Product</th><th className="p-4 font-medium">Category</th><th className="p-4 font-medium">Price</th><th className="p-4 font-medium">Units Sold</th><th className="p-4 font-medium">Patented</th>
                      </tr></thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p.name} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                            <td className="p-4 font-medium text-foreground">{p.name}</td>
                            <td className="p-4 text-muted-foreground">{p.category}</td>
                            <td className="p-4 text-muted-foreground">{p.price}</td>
                            <td className="p-4 text-muted-foreground">{p.unitsSold.toLocaleString()}</td>
                            <td className="p-4">{p.patented ? <span className="text-success text-xs">✓ Yes</span> : <span className="text-muted-foreground text-xs">No</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "deals" && (
                <div>
                  <h2 className="text-xl font-bold mb-5">Deals</h2>
                  <div className="space-y-4">
                    {deals.map(d => (
                      <div key={d.id} className="glass-card glass-card-hover rounded-xl p-5 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{d.shark}</h3>
                          <p className="text-sm text-muted-foreground">{d.type} · {d.equity} equity</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{d.amount}</p>
                          <StatusBadge status={d.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "milestones" && (
                <div>
                  <h2 className="text-xl font-bold mb-5">Milestones</h2>
                  <div className="relative ml-4 border-l-2 border-border/50 space-y-6 pl-8">
                    {milestones.map((m, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="relative">
                        <div className="absolute -left-[2.55rem] top-1 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                        <div className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{m.title}</h3>
                            {m.verified && <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full">Verified</span>}
                          </div>
                          <p className="text-sm text-muted-foreground">{m.date} · {m.type}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "team" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Team</h2>
                  <div className="glass-card rounded-xl p-5">
                    <h3 className="font-semibold mb-4">Headcount Over Time</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={teamData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                        <XAxis dataKey="month" stroke={chartColors.muted} fontSize={12} />
                        <YAxis stroke={chartColors.muted} fontSize={12} />
                        <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                        <Line type="monotone" dataKey="count" stroke={chartColors.primary} strokeWidth={2} dot={{ r: 4, fill: chartColors.primary }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="glass-card rounded-xl p-5">
                    <h3 className="font-semibold mb-4">Department Breakdown</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={[{ dept: "Engineering", count: 12 }, { dept: "Product", count: 4 }, { dept: "Sales", count: 5 }, { dept: "Marketing", count: 3 }, { dept: "Ops", count: 4 }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                        <XAxis dataKey="dept" stroke={chartColors.muted} fontSize={12} />
                        <YAxis stroke={chartColors.muted} fontSize={12} />
                        <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                        <Bar dataKey="count" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === "metrics" && (
                <div>
                  <h2 className="text-xl font-bold mb-5">Operational Metrics</h2>
                  <div className="glass-card rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border/50 text-muted-foreground text-left">
                        <th className="p-4 font-medium">Month</th><th className="p-4 font-medium">Revenue</th><th className="p-4 font-medium">Burn</th><th className="p-4 font-medium">Runway</th><th className="p-4 font-medium">Churn</th><th className="p-4 font-medium">NPS</th>
                      </tr></thead>
                      <tbody>
                        {revenueData.map(r => (
                          <tr key={r.month} className="border-b border-border/30">
                            <td className="p-4 font-medium text-foreground">{r.month}</td>
                            <td className="p-4 text-muted-foreground">${(r.revenue / 1000).toFixed(0)}K</td>
                            <td className="p-4 text-muted-foreground">${(r.burn / 1000).toFixed(0)}K</td>
                            <td className="p-4 text-muted-foreground">{Math.floor(4200000 / r.burn)}mo</td>
                            <td className="p-4 text-muted-foreground">{(Math.random() * 3 + 1).toFixed(1)}%</td>
                            <td className="p-4 text-muted-foreground">{Math.floor(Math.random() * 20 + 60)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "health" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Health Score</h2>
                  <div className="glass-card rounded-xl p-5">
                    <ResponsiveContainer width="100%" height={350}>
                      <RadarChart data={healthData}>
                        <PolarGrid stroke="hsl(217,33%,18%)" />
                        <PolarAngleAxis dataKey="subject" stroke={chartColors.muted} fontSize={12} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={chartColors.muted} fontSize={10} />
                        <Radar dataKey="A" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.25} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === "patents" && (
                <div>
                  <h2 className="text-xl font-bold mb-5">Patents</h2>
                  <div className="space-y-4">
                    {patents.map((p, i) => (
                      <div key={i} className="glass-card rounded-xl p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{p.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">Filed: {p.filed}{p.granted ? ` · Granted: ${p.granted}` : ""}</p>
                          </div>
                          <StatusBadge status={p.status === "Granted" ? "Active" : "Dormant"} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "valuations" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Valuations</h2>
                  <div className="glass-card rounded-xl p-5">
                    <h3 className="font-semibold mb-4">Valuation Over Time ($M)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={valuationData}>
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
                        <th className="p-4 font-medium">Period</th><th className="p-4 font-medium">Valuation</th>
                      </tr></thead>
                      <tbody>
                        {valuationData.map(v => (
                          <tr key={v.date} className="border-b border-border/30">
                            <td className="p-4 text-foreground">{v.date}</td>
                            <td className="p-4 text-muted-foreground">${v.val}M</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default FounderDashboard;
