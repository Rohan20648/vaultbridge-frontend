import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Handshake, GraduationCap, Building2, Menu, Home } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import StatusBadge from "@/components/StatusBadge";
import PageTransition from "@/components/PageTransition";

const tabs = [
  { key: "portfolio", label: "Portfolio", icon: Briefcase },
  { key: "deals", label: "Deals", icon: Handshake },
  { key: "mentor", label: "Mentor Sessions", icon: GraduationCap },
  { key: "company", label: "Company", icon: Building2 },
];

const portfolio = [
  { startup: "NeuralForge AI", valuation: "$18.5M", equity: "12%", roi: "145%", invested: "$2M", status: "Active" },
  { startup: "GreenVolt Energy", valuation: "$6.2M", equity: "8%", roi: "72%", invested: "$800K", status: "Active" },
  { startup: "FinStack", valuation: "$42M", equity: "5%", roi: "310%", invested: "$1.5M", status: "Active" },
  { startup: "AgroSense", valuation: "$1.2M", equity: "15%", roi: "-20%", invested: "$300K", status: "Written Off" },
];

const dealsList = [
  { startup: "NeuralForge AI", amount: "$2M", equity: "12%", type: "Equity", status: "Active", date: "2024-06-15" },
  { startup: "FinStack", amount: "$1.5M", equity: "5%", type: "Convertible Note", status: "Active", date: "2024-09-01" },
  { startup: "GreenVolt Energy", amount: "$800K", equity: "8%", type: "Equity", status: "Closed", date: "2025-01-20" },
];

const mentorSessions = [
  { startup: "NeuralForge AI", date: "2025-03-15", duration: "60 min", outcome: "GTM strategy refinement" },
  { startup: "GreenVolt Energy", date: "2025-03-10", duration: "45 min", outcome: "Series A prep review" },
  { startup: "FinStack", date: "2025-02-28", duration: "90 min", outcome: "Product-market fit analysis" },
];

const InvestorDashboard = () => {
  const [activeTab, setActiveTab] = useState("portfolio");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const chartColors = { primary: "hsl(217, 91%, 60%)", secondary: "hsl(160, 84%, 39%)" };

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
              <button key={t.key} onClick={() => setActiveTab(t.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === t.key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="h-14 border-b border-border/50 flex items-center px-5 gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground"><Menu size={20} /></button>
            <h1 className="text-lg font-semibold">Sarah Chen</h1>
            <span className="text-sm text-muted-foreground">Apex Ventures</span>
          </header>

          <div className="p-6">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {activeTab === "portfolio" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Portfolio</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {portfolio.map(p => (
                      <div key={p.startup} className="glass-card glass-card-hover rounded-xl p-5">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-foreground text-sm">{p.startup}</h3>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="text-2xl font-bold text-foreground mb-1">{p.valuation}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3">
                          <span>Equity: {p.equity}</span>
                          <span>Invested: {p.invested}</span>
                          <span className={p.roi.startsWith("-") ? "text-destructive" : "text-success"}>ROI: {p.roi}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="glass-card rounded-xl p-5">
                    <h3 className="font-semibold mb-4">Portfolio Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={portfolio.map(p => ({ name: p.startup, invested: parseFloat(p.invested.replace(/[$KM]/g, "")) * (p.invested.includes("K") ? 1 : 1000) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,18%)" />
                        <XAxis dataKey="name" stroke="hsl(215,20%,55%)" fontSize={11} />
                        <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                        <Tooltip contentStyle={{ background: "hsl(217,33%,10%)", border: "1px solid hsl(217,33%,18%)", borderRadius: 8 }} />
                        <Bar dataKey="invested" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === "deals" && (
                <div>
                  <h2 className="text-xl font-bold mb-5">Deals</h2>
                  <div className="glass-card rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border/50 text-muted-foreground text-left">
                        <th className="p-4 font-medium">Startup</th><th className="p-4 font-medium">Amount</th><th className="p-4 font-medium">Equity</th><th className="p-4 font-medium">Type</th><th className="p-4 font-medium">Date</th><th className="p-4 font-medium">Status</th>
                      </tr></thead>
                      <tbody>
                        {dealsList.map((d, i) => (
                          <tr key={i} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                            <td className="p-4 font-medium text-foreground">{d.startup}</td>
                            <td className="p-4 text-muted-foreground">{d.amount}</td>
                            <td className="p-4 text-muted-foreground">{d.equity}</td>
                            <td className="p-4 text-muted-foreground">{d.type}</td>
                            <td className="p-4 text-muted-foreground">{d.date}</td>
                            <td className="p-4"><StatusBadge status={d.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "mentor" && (
                <div>
                  <h2 className="text-xl font-bold mb-5">Mentor Sessions</h2>
                  <div className="space-y-4">
                    {mentorSessions.map((s, i) => (
                      <div key={i} className="glass-card rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{s.startup}</h3>
                          <span className="text-xs text-muted-foreground">{s.duration}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{s.date} · {s.outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "company" && (
                <div>
                  <h2 className="text-xl font-bold mb-5">Company Details</h2>
                  <div className="glass-card rounded-xl p-6 max-w-lg">
                    <div className="space-y-4 text-sm">
                      {[
                        ["Company Name", "Apex Ventures"],
                        ["Type", "Venture Capital"],
                        ["Website", "apexventures.com"],
                        ["AUM", "$850M"],
                        ["Founded", "2015"],
                        ["HQ", "New York, NY, United States"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="font-medium text-foreground">{v}</span>
                        </div>
                      ))}
                    </div>
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

export default InvestorDashboard;
