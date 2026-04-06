import { useState, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroBackground from "@/components/HeroBackground";
import StatusBadge from "@/components/StatusBadge";
import { getIndustries, getShark, getSharks, getStartup, getStartups } from "@/lib/api";

const statuses = ["All", "Active", "IPO", "Acquired", "Dormant", "Shutdown", "Pivoting"];

type IndustryRecord = { industry_name: string };
type StartupRecord = {
  startup_id: number;
  startup_name?: string;
  tagline?: string;
  industry_name?: string;
  status?: string;
  founded_year?: number;
  total_funding_usd?: number;
  num_employees?: number;
  location_display?: string;
  website?: string;
};
type InvestorExpertise = { expertise_id: number; domain: string };
type InvestorRecord = {
  shark_id: number;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  company_type?: string;
  net_worth_usd_millions?: number;
  bio?: string;
  nationality?: string;
  email?: string;
  phone?: string;
  company_id?: number;
  expertise?: InvestorExpertise[];
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error && "response" in error) {
    const r = (error as { response?: { data?: { message?: string } } }).response;
    return r?.data?.message || fallback;
  }
  return fallback;
};

const fmtFunding = (v: number) =>
  v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v}`;

// Shared input style
const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(201,168,76,0.2)",
  color: "#f0ece2",
  borderRadius: 0,
  padding: "10px 16px",
  fontSize: 12,
  fontFamily: "'DM Mono', monospace",
  letterSpacing: "0.05em",
  outline: "none",
  width: "100%",
  transition: "border-color 0.2s",
};

const ExplorePage = () => {
  const [tab, setTab] = useState<"startups" | "investors">("startups");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startups, setStartups] = useState<StartupRecord[]>([]);
  const [investors, setInvestors] = useState<InvestorRecord[]>([]);
  const [industries, setIndustries] = useState<string[]>(["All"]);
  const [selectedStartup, setSelectedStartup] = useState<StartupRecord | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [startupRes, sharkRes, industryRes] = await Promise.all([
          getStartups(), getSharks(), getIndustries(),
        ]);
        setStartups(startupRes.data || []);
        setInvestors(sharkRes.data || []);
        setIndustries(["All", ...(industryRes.data || []).map((i: IndustryRecord) => i.industry_name)]);
      } catch (e: unknown) {
        setError(getErrorMessage(e, "Failed to load data. Please try again later."));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredStartups = startups.filter(s => {
    const q = search.toLowerCase();
    return (
      ((s.startup_name || "").toLowerCase().includes(q) || (s.tagline || "").toLowerCase().includes(q)) &&
      (industryFilter === "All" || s.industry_name === industryFilter) &&
      (statusFilter === "All" || s.status === statusFilter)
    );
  });

  const filteredInvestors = investors.filter(inv =>
    `${inv.first_name} ${inv.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (inv.company_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleStartupSelect = async (startup: StartupRecord) => {
    try {
      setModalLoading(true);
      setSelectedStartup(startup);
      const res = await getStartup(startup.startup_id);
      setSelectedStartup({ ...startup, ...(res.data || {}) });
    } catch { setSelectedStartup(startup); }
    finally { setModalLoading(false); }
  };

  const handleInvestorSelect = async (investor: InvestorRecord) => {
    try {
      setModalLoading(true);
      setSelectedInvestor(investor);
      const res = await getShark(investor.shark_id);
      setSelectedInvestor({ ...investor, ...(res.data || {}) });
    } catch { setSelectedInvestor(investor); }
    finally { setModalLoading(false); }
  };

  return (
    <>
      <Navbar />
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          background: "#0a0d14",
          color: "#f0ece2",
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          overflow: "hidden",
        }}
      >
        <HeroBackground opacity={0.45} />

        <div style={{ position: "relative", zIndex: 2, paddingTop: 100, paddingBottom: 80 }}>
          {/* Page header */}
          <div style={{ textAlign: "center", marginBottom: 56, padding: "0 40px" }}>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "#c9a84c",
                marginBottom: 20,
              }}
            >
              — THE ECOSYSTEM —
            </div>
            <h1
              style={{
                fontSize: "clamp(36px, 4.5vw, 60px)",
                fontWeight: 300,
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
              }}
            >
              Explore the{" "}
              <em style={{ color: "#e8c97a", fontStyle: "italic" }}>Vault</em>
            </h1>
          </div>

          {/* Tab switcher */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 1,
              marginBottom: 40,
              background: "rgba(201,168,76,0.18)",
              maxWidth: 360,
              margin: "0 auto 40px",
            }}
          >
            {(["startups", "investors"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSearch(""); }}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  background: tab === t ? "rgba(201,168,76,0.15)" : "#0f1420",
                  border: "none",
                  color: tab === t ? "#e8c97a" : "#8892a4",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  borderBottom: tab === t ? "1px solid #c9a84c" : "1px solid transparent",
                }}
              >
                {t === "startups" ? "STARTUPS" : "INVESTORS"}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 32,
              padding: "0 56px",
              maxWidth: 1280,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#8892a4",
                }}
              />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${tab}…`}
                style={{ ...inputStyle, paddingLeft: 40 }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.55)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
              />
            </div>
            {tab === "startups" && (
              <>
                <select
                  value={industryFilter}
                  onChange={e => setIndustryFilter(e.target.value)}
                  style={{ ...inputStyle, width: "auto", minWidth: 160 }}
                >
                  {industries.map(i => <option key={i} style={{ background: "#0f1420" }}>{i}</option>)}
                </select>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ ...inputStyle, width: "auto", minWidth: 140 }}
                >
                  {statuses.map(s => <option key={s} style={{ background: "#0f1420" }}>{s}</option>)}
                </select>
              </>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: "0 56px", maxWidth: 1280, marginLeft: "auto", marginRight: "auto" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                <Loader2 size={28} style={{ color: "#c9a84c", animation: "spin 1s linear infinite" }} />
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#8892a4", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                {error}
              </div>
            ) : tab === "startups" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 1,
                  background: "rgba(201,168,76,0.18)",
                }}
              >
                {filteredStartups.length === 0 ? (
                  <div style={{ padding: "80px 0", textAlign: "center", color: "#8892a4", fontFamily: "'DM Mono', monospace", fontSize: 11, gridColumn: "1/-1", background: "#0a0d14" }}>
                    No startups found.
                  </div>
                ) : filteredStartups.map(s => (
                  <div
                    key={s.startup_id}
                    onClick={() => handleStartupSelect(s)}
                    style={{
                      background: "#0f1420",
                      padding: 32,
                      cursor: "pointer",
                      transition: "background 0.25s",
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = "#161c2d")}
                    onMouseOut={e => (e.currentTarget.style.background = "#0f1420")}
                  >
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: "#c9a84c", marginBottom: 16 }}>
                      {s.industry_name || "TECHNOLOGY"}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 400, marginBottom: 8, letterSpacing: "-0.01em" }}>
                      {s.startup_name}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 300, color: "#8892a4", lineHeight: 1.7, marginBottom: 24 }}>
                      {s.tagline || "—"}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                      <StatusBadge status={s.status} />
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#e8c97a" }}>
                        {s.total_funding_usd ? fmtFunding(s.total_funding_usd) : "N/A"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 1,
                  background: "rgba(201,168,76,0.18)",
                }}
              >
                {filteredInvestors.length === 0 ? (
                  <div style={{ padding: "80px 0", textAlign: "center", color: "#8892a4", fontFamily: "'DM Mono', monospace", fontSize: 11, gridColumn: "1/-1", background: "#0a0d14" }}>
                    No investors found.
                  </div>
                ) : filteredInvestors.map(inv => (
                  <div
                    key={inv.shark_id}
                    onClick={() => handleInvestorSelect(inv)}
                    style={{
                      background: "#0f1420",
                      padding: 32,
                      cursor: "pointer",
                      transition: "background 0.25s",
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = "#161c2d")}
                    onMouseOut={e => (e.currentTarget.style.background = "#0f1420")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          border: "1px solid rgba(201,168,76,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: "#e8c97a",
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: 20,
                          fontWeight: 600,
                        }}
                      >
                        {inv.first_name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 400, letterSpacing: "-0.01em" }}>
                          {inv.first_name} {inv.last_name}
                        </div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#8892a4", marginTop: 4 }}>
                          {inv.company_name || "Independent"}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#c9a84c", letterSpacing: "0.1em" }}>
                        {inv.company_type || "INVESTOR"}
                      </span>
                      {inv.net_worth_usd_millions && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#e8c97a", marginLeft: "auto" }}>
                          ${inv.net_worth_usd_millions}M
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Startup Modal ── */}
        {selectedStartup && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(10,13,20,0.88)",
              backdropFilter: "blur(12px)",
              padding: 24,
            }}
            onClick={() => setSelectedStartup(null)}
          >
            <div
              style={{
                background: "#0f1420",
                border: "1px solid rgba(201,168,76,0.22)",
                maxWidth: 560,
                width: "100%",
                padding: 48,
                position: "relative",
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedStartup(null)}
                style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", color: "#8892a4", cursor: "pointer" }}
              >
                <X size={18} />
              </button>

              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.14em", color: "#c9a84c", marginBottom: 12 }}>
                {selectedStartup.industry_name?.toUpperCase() || "STARTUP"}
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 6 }}>
                {selectedStartup.startup_name}
              </h2>
              <p style={{ fontSize: 15, color: "#8892a4", fontWeight: 300, lineHeight: 1.7, marginBottom: 32 }}>
                {selectedStartup.tagline || "—"}
              </p>

              {modalLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#8892a4" }}>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading details…
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px", borderTop: "1px solid rgba(201,168,76,0.12)", paddingTop: 28 }}>
                {[
                  ["Status", <StatusBadge status={selectedStartup.status} />],
                  ["Founded", selectedStartup.founded_year || "—"],
                  ["Total Funding", selectedStartup.total_funding_usd ? fmtFunding(selectedStartup.total_funding_usd) : "N/A"],
                  ["Employees", selectedStartup.num_employees ?? "—"],
                  ["Location", selectedStartup.location_display || "—"],
                ].map(([label, val]) => (
                  <div key={String(label)}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: "#8892a4", marginBottom: 6 }}>
                      {String(label).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 400 }}>{val as React.ReactNode}</div>
                  </div>
                ))}
                {selectedStartup.website && (
                  <div style={{ gridColumn: "1/-1" }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: "#8892a4", marginBottom: 6 }}>WEBSITE</div>
                    <a href={selectedStartup.website} target="_blank" rel="noopener noreferrer" style={{ color: "#e8c97a", fontSize: 14, textDecoration: "none" }}>
                      {selectedStartup.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Investor Modal ── */}
        {selectedInvestor && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(10,13,20,0.88)",
              backdropFilter: "blur(12px)",
              padding: 24,
            }}
            onClick={() => setSelectedInvestor(null)}
          >
            <div
              style={{
                background: "#0f1420",
                border: "1px solid rgba(201,168,76,0.22)",
                maxWidth: 560,
                width: "100%",
                padding: 48,
                position: "relative",
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedInvestor(null)}
                style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", color: "#8892a4", cursor: "pointer" }}
              >
                <X size={18} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    border: "1px solid rgba(201,168,76,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#e8c97a",
                    fontSize: 22,
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {selectedInvestor.first_name?.charAt(0)}
                </div>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em" }}>
                    {selectedInvestor.first_name} {selectedInvestor.last_name}
                  </h2>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#8892a4", marginTop: 4 }}>
                    {selectedInvestor.company_name || "Independent"}
                  </div>
                </div>
              </div>

              {selectedInvestor.bio && (
                <p style={{ fontSize: 14, color: "#8892a4", fontWeight: 300, lineHeight: 1.75, marginBottom: 28 }}>
                  {selectedInvestor.bio}
                </p>
              )}

              {modalLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#8892a4" }}>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading details…
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px", borderTop: "1px solid rgba(201,168,76,0.12)", paddingTop: 28 }}>
                {[
                  ["Type", selectedInvestor.company_type || "—"],
                  ["Net Worth", selectedInvestor.net_worth_usd_millions ? `$${selectedInvestor.net_worth_usd_millions}M` : "—"],
                  ["Nationality", selectedInvestor.nationality || "—"],
                  ["Email", selectedInvestor.email || "—"],
                ].map(([label, val]) => (
                  <div key={String(label)}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: "#8892a4", marginBottom: 6 }}>
                      {String(label).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 400 }}>{val as React.ReactNode}</div>
                  </div>
                ))}
              </div>

              {(selectedInvestor.expertise?.length ?? 0) > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: "#8892a4", marginBottom: 12 }}>
                    EXPERTISE
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selectedInvestor.expertise!.map(item => (
                      <span
                        key={item.expertise_id}
                        style={{
                          border: "1px solid rgba(201,168,76,0.25)",
                          padding: "5px 14px",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9,
                          letterSpacing: "0.1em",
                          color: "#c9a84c",
                        }}
                      >
                        {item.domain}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </>
  );
};

export default ExplorePage;
