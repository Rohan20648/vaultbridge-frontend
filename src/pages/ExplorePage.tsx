import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import StatusBadge from "@/components/StatusBadge";

const mockStartups = [
  { id: 1, name: "NeuralForge AI", tagline: "Enterprise LLM infrastructure", industry: "AI/ML", status: "Active", stage: "Series A", funding: "$4.2M", employees: 28, founded: 2022 },
  { id: 2, name: "GreenVolt Energy", tagline: "Next-gen battery recycling", industry: "Clean Energy", status: "Active", stage: "Seed", funding: "$1.8M", employees: 12, founded: 2023 },
  { id: 3, name: "MedSync Health", tagline: "Remote patient monitoring", industry: "Healthcare", status: "IPO", stage: "Series C", funding: "$52M", employees: 340, founded: 2018 },
  { id: 4, name: "FinStack", tagline: "Embedded banking APIs", industry: "FinTech", status: "Active", stage: "Series B", funding: "$18M", employees: 85, founded: 2020 },
  { id: 5, name: "AgroSense", tagline: "Precision agriculture platform", industry: "AgTech", status: "Dormant", stage: "Pre-seed", funding: "$400K", employees: 5, founded: 2024 },
  { id: 6, name: "Orbitra Labs", tagline: "Satellite data analytics", industry: "SpaceTech", status: "Acquired", stage: "Growth", funding: "$120M", employees: 200, founded: 2016 },
  { id: 7, name: "CyberShield Pro", tagline: "Zero-trust security mesh", industry: "Cybersecurity", status: "Active", stage: "Series A", funding: "$8.5M", employees: 42, founded: 2021 },
  { id: 8, name: "EduPlatform", tagline: "Adaptive learning engine", industry: "EdTech", status: "Pivoting", stage: "Seed", funding: "$2.1M", employees: 18, founded: 2022 },
];

const mockInvestors = [
  { id: 1, name: "Sarah Chen", company: "Apex Ventures", netWorth: "$340M", type: "VC", bio: "15 years in deep tech investing. Former CTO at Scale AI." },
  { id: 2, name: "Marcus Rivera", company: "Titan Capital", netWorth: "$1.2B", type: "PE", bio: "Built and exited 3 unicorns. Focus on enterprise SaaS." },
  { id: 3, name: "Priya Sharma", company: "EmergeX Partners", netWorth: "$560M", type: "Angel", bio: "Early-stage investor in healthcare and biotech innovation." },
  { id: 4, name: "David Kim", company: "BlueHarbor Group", netWorth: "$890M", type: "Family Office", bio: "Multi-generational wealth. Focus on sustainable infrastructure." },
  { id: 5, name: "Elena Volkov", company: "NovaStar Fund", netWorth: "$420M", type: "VC", bio: "SpaceTech and defense technology specialist." },
  { id: 6, name: "James O'Brien", company: "Atlantic Capital", netWorth: "$780M", type: "Corporate", bio: "Corporate venture arm. Fintech and embedded finance." },
];

const industries = ["All", "AI/ML", "FinTech", "Healthcare", "Clean Energy", "AgTech", "SpaceTech", "Cybersecurity", "EdTech"];
const statuses = ["All", "Active", "IPO", "Acquired", "Dormant", "Shutdown", "Pivoting"];

const ExplorePage = () => {
  const [tab, setTab] = useState<"startups" | "investors">("startups");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedStartup, setSelectedStartup] = useState<typeof mockStartups[0] | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<typeof mockInvestors[0] | null>(null);

  const filteredStartups = mockStartups.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.tagline.toLowerCase().includes(search.toLowerCase());
    const matchIndustry = industryFilter === "All" || s.industry === industryFilter;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchIndustry && matchStatus;
  });

  const filteredInvestors = mockInvestors.filter(inv =>
    inv.name.toLowerCase().includes(search.toLowerCase()) || inv.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">Explore the Ecosystem</h1>
              <p className="text-muted-foreground">Discover innovative startups and strategic investors</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center gap-2 mb-8">
              {(["startups", "investors"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSearch(""); }}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  {t === "startups" ? "Startups" : "Investors"}
                </button>
              ))}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="relative flex-1 min-w-[250px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder={`Search ${tab}...`}
                />
              </div>
              {tab === "startups" && (
                <>
                  <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm">
                    {industries.map(i => <option key={i}>{i}</option>)}
                  </select>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm">
                    {statuses.map(s => <option key={s}>{s}</option>)}
                  </select>
                </>
              )}
            </div>

            {/* Grid */}
            {tab === "startups" ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredStartups.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setSelectedStartup(s)}
                    className="glass-card glass-card-hover rounded-xl p-6 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{s.name}</h3>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{s.tagline}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="bg-accent/50 px-2 py-1 rounded">{s.industry}</span>
                      <span>{s.stage} · {s.funding}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredInvestors.map((inv, i) => (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setSelectedInvestor(inv)}
                    className="glass-card glass-card-hover rounded-xl p-6 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold">{inv.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{inv.name}</h3>
                        <p className="text-sm text-muted-foreground">{inv.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="bg-accent/50 px-2 py-1 rounded">{inv.type}</span>
                      <span>{inv.netWorth}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Startup Modal */}
          {selectedStartup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setSelectedStartup(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedStartup.name}</h2>
                    <p className="text-muted-foreground">{selectedStartup.tagline}</p>
                  </div>
                  <button onClick={() => setSelectedStartup(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Industry</span><p className="font-medium text-foreground">{selectedStartup.industry}</p></div>
                  <div><span className="text-muted-foreground">Status</span><p><StatusBadge status={selectedStartup.status} /></p></div>
                  <div><span className="text-muted-foreground">Funding Stage</span><p className="font-medium text-foreground">{selectedStartup.stage}</p></div>
                  <div><span className="text-muted-foreground">Total Funding</span><p className="font-medium text-foreground">{selectedStartup.funding}</p></div>
                  <div><span className="text-muted-foreground">Employees</span><p className="font-medium text-foreground">{selectedStartup.employees}</p></div>
                  <div><span className="text-muted-foreground">Founded</span><p className="font-medium text-foreground">{selectedStartup.founded}</p></div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Investor Modal */}
          {selectedInvestor && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setSelectedInvestor(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
                      <span className="text-primary font-bold text-xl">{selectedInvestor.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedInvestor.name}</h2>
                      <p className="text-muted-foreground">{selectedInvestor.company}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedInvestor(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{selectedInvestor.bio}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Type</span><p className="font-medium text-foreground">{selectedInvestor.type}</p></div>
                  <div><span className="text-muted-foreground">Net Worth</span><p className="font-medium text-foreground">{selectedInvestor.netWorth}</p></div>
                </div>
              </motion.div>
            </div>
          )}

          <Footer />
        </div>
      </PageTransition>
    </>
  );
};

export default ExplorePage;
