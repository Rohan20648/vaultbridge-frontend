import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import StatusBadge from "@/components/StatusBadge";
import { getIndustries, getShark, getSharks, getStartup, getStartups } from "@/lib/api";

const statuses = ["All", "Active", "IPO", "Acquired", "Dormant", "Shutdown", "Pivoting"];

const ExplorePage = () => {
  const [tab, setTab] = useState<"startups" | "investors">("startups");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startups, setStartups] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [industries, setIndustries] = useState<string[]>(["All"]);
  const [selectedStartup, setSelectedStartup] = useState<any | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [startupRes, sharkRes, industryRes] = await Promise.all([
          getStartups(),
          getSharks(),
          getIndustries(),
        ]);
        setStartups(startupRes.data || []);
        setInvestors(sharkRes.data || []);
        const industryNames = ["All", ...(industryRes.data || []).map((i: any) => i.industry_name)];
        setIndustries(industryNames);
      } catch (e: any) {
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filteredStartups = startups.filter(s => {
    const matchSearch =
      (s.startup_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.tagline || "").toLowerCase().includes(search.toLowerCase());
    const matchIndustry = industryFilter === "All" || s.industry_name === industryFilter;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchIndustry && matchStatus;
  });

  const filteredInvestors = investors.filter(inv =>
    `${inv.first_name} ${inv.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (inv.company_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleStartupSelect = async (startup: any) => {
    try {
      setModalLoading(true);
      setSelectedStartup(startup);
      const startupRes = await getStartup(startup.startup_id);
      setSelectedStartup({ ...startup, ...(startupRes.data || {}) });
    } catch {
      setSelectedStartup(startup);
    } finally {
      setModalLoading(false);
    }
  };

  const handleInvestorSelect = async (investor: any) => {
    try {
      setModalLoading(true);
      setSelectedInvestor(investor);
      const investorRes = await getShark(investor.shark_id);
      setSelectedInvestor({ ...investor, ...(investorRes.data || {}) });
    } catch {
      setSelectedInvestor(investor);
    } finally {
      setModalLoading(false);
    }
  };

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

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-20 text-destructive">{error}</div>
            ) : tab === "startups" ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredStartups.length === 0 ? (
                  <p className="col-span-4 text-center text-muted-foreground py-10">No startups found.</p>
                ) : filteredStartups.map((s, i) => (
                  <motion.div
                    key={s.startup_id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleStartupSelect(s)}
                    className="glass-card glass-card-hover rounded-xl p-6 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{s.startup_name}</h3>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{s.tagline || "—"}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="bg-accent/50 px-2 py-1 rounded">{s.industry_name || "—"}</span>
                      <span>{s.founded_year} · {s.total_funding_usd ? `$${(s.total_funding_usd / 1e6).toFixed(1)}M` : "N/A"}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredInvestors.length === 0 ? (
                  <p className="col-span-3 text-center text-muted-foreground py-10">No investors found.</p>
                ) : filteredInvestors.map((inv, i) => (
                  <motion.div
                    key={inv.shark_id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleInvestorSelect(inv)}
                    className="glass-card glass-card-hover rounded-xl p-6 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold">{inv.first_name?.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{inv.first_name} {inv.last_name}</h3>
                        <p className="text-sm text-muted-foreground">{inv.company_name || "Independent"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="bg-accent/50 px-2 py-1 rounded">{inv.company_type || "Investor"}</span>
                      <span>{inv.net_worth_usd_millions ? `$${inv.net_worth_usd_millions}M` : "—"}</span>
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
                    <h2 className="text-xl font-bold text-foreground">{selectedStartup.startup_name}</h2>
                    <p className="text-muted-foreground">{selectedStartup.tagline || "—"}</p>
                  </div>
                  <button onClick={() => setSelectedStartup(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                </div>
                {modalLoading && <div className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" /> Fetching latest startup details...</div>}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Industry</span><p className="font-medium text-foreground">{selectedStartup.industry_name || "—"}</p></div>
                  <div><span className="text-muted-foreground">Status</span><p><StatusBadge status={selectedStartup.status} /></p></div>
                  <div><span className="text-muted-foreground">Founded</span><p className="font-medium text-foreground">{selectedStartup.founded_year || "—"}</p></div>
                  <div><span className="text-muted-foreground">Total Funding</span><p className="font-medium text-foreground">{selectedStartup.total_funding_usd ? `$${Number(selectedStartup.total_funding_usd).toLocaleString()}` : "N/A"}</p></div>
                  <div><span className="text-muted-foreground">Employees</span><p className="font-medium text-foreground">{selectedStartup.num_employees ?? "—"}</p></div>
                  <div><span className="text-muted-foreground">Location</span><p className="font-medium text-foreground">{selectedStartup.location_display || "—"}</p></div>
                  {selectedStartup.website && (
                    <div className="col-span-2"><span className="text-muted-foreground">Website</span><p><a href={selectedStartup.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">{selectedStartup.website}</a></p></div>
                  )}
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
                      <span className="text-primary font-bold text-xl">{selectedInvestor.first_name?.charAt(0)}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedInvestor.first_name} {selectedInvestor.last_name}</h2>
                      <p className="text-muted-foreground">{selectedInvestor.company_name || "Independent"}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedInvestor(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                </div>
                {modalLoading && <div className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" /> Fetching latest investor details...</div>}
                {selectedInvestor.bio && <p className="text-sm text-muted-foreground mb-4">{selectedInvestor.bio}</p>}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Type</span><p className="font-medium text-foreground">{selectedInvestor.company_type || "—"}</p></div>
                  <div><span className="text-muted-foreground">Net Worth</span><p className="font-medium text-foreground">{selectedInvestor.net_worth_usd_millions ? `$${selectedInvestor.net_worth_usd_millions}M` : "—"}</p></div>
                  <div><span className="text-muted-foreground">Nationality</span><p className="font-medium text-foreground">{selectedInvestor.nationality || "—"}</p></div>
                  <div><span className="text-muted-foreground">Email</span><p className="font-medium text-foreground">{selectedInvestor.email || "—"}</p></div>
                  <div><span className="text-muted-foreground">Phone</span><p className="font-medium text-foreground">{selectedInvestor.phone || "—"}</p></div>
                  <div><span className="text-muted-foreground">Company ID</span><p className="font-medium text-foreground">{selectedInvestor.company_id ?? "—"}</p></div>
                </div>
                {selectedInvestor.expertise?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedInvestor.expertise.map((item: any) => (
                        <span key={item.expertise_id} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                          {item.domain}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
