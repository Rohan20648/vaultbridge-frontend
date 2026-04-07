import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  TrendingUp,
  Users,
  Briefcase,
  Activity,
  Heart,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { getStartupFullReport } from "@/lib/api";

/* ── Types matching the stored-procedure result sets ── */
interface StartupInfo {
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
  description?: string;
  valuation_usd?: number;
}

interface Deal {
  deal_id: number;
  shark_name?: string;
  deal_amount_usd?: number;
  equity_percentage?: number;
  deal_date?: string;
  deal_status?: string;
  round_type?: string;
}

interface Founder {
  founder_id: number;
  founder_name?: string;
  role?: string;
  email?: string;
  linkedin_url?: string;
  equity_stake?: number;
}

interface Metric {
  metric_id?: number;
  metric_name?: string;
  metric_value?: string | number;
  recorded_at?: string;
  unit?: string;
}

interface HealthScore {
  score_id?: number;
  score_date?: string;
  overall_score?: number;
  financial_score?: number;
  growth_score?: number;
  team_score?: number;
  market_score?: number;
}

interface FullReport {
  startup_info: StartupInfo;
  deals: Deal[];
  founders: Founder[];
  metrics: Metric[];
  health_scores: HealthScore[];
}

interface Props {
  startupId: number;
  startupName?: string;
  onClose: () => void;
}

/* ── Helpers ── */
const fmtCurrency = (v?: number | null) => {
  if (!v && v !== 0) return "—";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
};

const fmtDate = (d?: string) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return d;
  }
};

const ScoreBar = ({ label, value }: { label: string; value?: number }) => {
  const pct = value != null ? Math.min(100, Math.max(0, value)) : 0;
  const color =
    pct >= 75 ? "#4ade80" : pct >= 50 ? "#e8c97a" : pct >= 25 ? "#f97316" : "#f87171";
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.08em",
        }}
      >
        <span style={{ color: "#8892a4" }}>{label.toUpperCase()}</span>
        <span style={{ color }}>{value != null ? `${value}/100` : "—"}</span>
      </div>
      <div
        style={{
          height: 3,
          background: "rgba(255,255,255,0.07)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct}%`,
            background: color,
            transition: "width 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        />
      </div>
    </div>
  );
};

/* ── Collapsible section ── */
const Section = ({
  icon,
  label,
  count,
  children,
  defaultOpen = true,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: "1px solid rgba(201,168,76,0.1)", paddingTop: 0 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "18px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#f0ece2",
        }}
      >
        <span style={{ color: "#c9a84c" }}>{icon}</span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "#c9a84c",
          }}
        >
          {label.toUpperCase()}
        </span>
        {count != null && (
          <span
            style={{
              marginLeft: 6,
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.25)",
              color: "#e8c97a",
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              padding: "2px 8px",
              letterSpacing: "0.06em",
            }}
          >
            {count}
          </span>
        )}
        <span style={{ marginLeft: "auto", color: "#8892a4" }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {open && <div style={{ paddingBottom: 24 }}>{children}</div>}
    </div>
  );
};

/* ── Main component ── */
const StartupFullReportModal = ({ startupId, startupName, onClose }: Props) => {
  const [report, setReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getStartupFullReport(startupId);
        setReport(res.data ?? res);
      } catch (e: unknown) {
        const msg =
          typeof e === "object" && e && "response" in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        setError(msg || "Failed to load full report.");
      } finally {
        setLoading(false);
      }
    })();
  }, [startupId]);

  const info = report?.startup_info;
  const deals = report?.deals ?? [];
  const founders = report?.founders ?? [];
  const metrics = report?.metrics ?? [];
  const healthScores = report?.health_scores ?? [];
  const latestHealth = healthScores[0];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(8,10,18,0.92)",
        backdropFilter: "blur(16px)",
        padding: "24px 16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0c1019",
          border: "1px solid rgba(201,168,76,0.2)",
          maxWidth: 780,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(201,168,76,0.2) transparent",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header bar ── */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#0c1019",
            borderBottom: "1px solid rgba(201,168,76,0.12)",
            padding: "18px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                letterSpacing: "0.18em",
                color: "#c9a84c",
                border: "1px solid rgba(201,168,76,0.25)",
                padding: "4px 10px",
              }}
            >
              FULL REPORT
            </div>
            <span
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 20,
                fontWeight: 400,
                color: "#f0ece2",
              }}
            >
              {startupName || "Startup"}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#8892a4",
              cursor: "pointer",
              padding: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.4)";
              (e.currentTarget as HTMLButtonElement).style.color = "#e8c97a";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
              (e.currentTarget as HTMLButtonElement).style.color = "#8892a4";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "32px 32px 40px" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                padding: "80px 0",
                color: "#8892a4",
              }}
            >
              <Loader2
                size={28}
                style={{ color: "#c9a84c", animation: "spin 1s linear infinite" }}
              />
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                }}
              >
                LOADING REPORT…
              </span>
            </div>
          ) : error ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 0",
                color: "#f87171",
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
              }}
            >
              {error}
            </div>
          ) : (
            <>
              {/* ── Overview hero ── */}
              <div style={{ marginBottom: 36 }}>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    color: "#c9a84c",
                    marginBottom: 10,
                  }}
                >
                  {info?.industry_name?.toUpperCase() || "STARTUP"}
                </div>
                <h2
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "clamp(28px, 3.5vw, 42px)",
                    fontWeight: 300,
                    letterSpacing: "-0.01em",
                    marginBottom: 10,
                    color: "#f0ece2",
                  }}
                >
                  {info?.startup_name}
                </h2>
                {info?.tagline && (
                  <p
                    style={{
                      fontSize: 15,
                      color: "#8892a4",
                      fontWeight: 300,
                      lineHeight: 1.7,
                      maxWidth: 560,
                      marginBottom: 24,
                    }}
                  >
                    {info.tagline}
                  </p>
                )}
                {info?.description && (
                  <p
                    style={{
                      fontSize: 14,
                      color: "#6b7588",
                      fontWeight: 300,
                      lineHeight: 1.8,
                      maxWidth: 620,
                      marginBottom: 28,
                      borderLeft: "2px solid rgba(201,168,76,0.2)",
                      paddingLeft: 16,
                    }}
                  >
                    {info.description}
                  </p>
                )}

                {/* KPI strip */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: 1,
                    background: "rgba(201,168,76,0.12)",
                    marginBottom: 8,
                  }}
                >
                  {[
                    ["STATUS", <StatusBadge status={info?.status} />],
                    ["FOUNDED", info?.founded_year ?? "—"],
                    ["FUNDING", fmtCurrency(info?.total_funding_usd)],
                    ["VALUATION", fmtCurrency(info?.valuation_usd)],
                    ["EMPLOYEES", info?.num_employees ?? "—"],
                    ["LOCATION", info?.location_display ?? "—"],
                  ].map(([label, val]) => (
                    <div
                      key={String(label)}
                      style={{ background: "#0f1420", padding: "16px 18px" }}
                    >
                      <div
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 8,
                          letterSpacing: "0.12em",
                          color: "#8892a4",
                          marginBottom: 8,
                        }}
                      >
                        {String(label)}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: 18,
                          fontWeight: 500,
                          color: "#e8c97a",
                        }}
                      >
                        {val as React.ReactNode}
                      </div>
                    </div>
                  ))}
                </div>

                {info?.website && (
                  <a
                    href={info.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      color: "#c9a84c",
                      textDecoration: "none",
                      marginTop: 12,
                      border: "1px solid rgba(201,168,76,0.2)",
                      padding: "6px 14px",
                      transition: "border-color 0.2s",
                    }}
                    onMouseOver={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.borderColor =
                        "rgba(201,168,76,0.5)")
                    }
                    onMouseOut={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.borderColor =
                        "rgba(201,168,76,0.2)")
                    }
                  >
                    <ExternalLink size={10} />
                    VISIT WEBSITE
                  </a>
                )}
              </div>

              {/* ── Health Scores ── */}
              {healthScores.length > 0 && (
                <Section icon={<Heart size={14} />} label="Health Score" count={healthScores.length}>
                  {latestHealth && (
                    <>
                      <div
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9,
                          color: "#8892a4",
                          marginBottom: 20,
                          letterSpacing: "0.08em",
                        }}
                      >
                        LATEST — {fmtDate(latestHealth.score_date)}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "0 40px",
                        }}
                      >
                        <div>
                          <ScoreBar label="Overall" value={latestHealth.overall_score} />
                          <ScoreBar label="Financial" value={latestHealth.financial_score} />
                          <ScoreBar label="Growth" value={latestHealth.growth_score} />
                        </div>
                        <div>
                          <ScoreBar label="Team" value={latestHealth.team_score} />
                          <ScoreBar label="Market" value={latestHealth.market_score} />
                        </div>
                      </div>
                    </>
                  )}
                </Section>
              )}

              {/* ── Deals ── */}
              {deals.length > 0 && (
                <Section icon={<Briefcase size={14} />} label="Investment Deals" count={deals.length}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "rgba(201,168,76,0.1)" }}>
                    {deals.map((d) => (
                      <div
                        key={d.deal_id}
                        style={{
                          background: "#0f1420",
                          padding: "16px 20px",
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          alignItems: "center",
                          gap: 16,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 400,
                              color: "#f0ece2",
                              marginBottom: 4,
                            }}
                          >
                            {d.shark_name || "Unknown Investor"}
                          </div>
                          <div
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 9,
                              color: "#8892a4",
                              letterSpacing: "0.08em",
                              display: "flex",
                              gap: 16,
                            }}
                          >
                            <span>{d.round_type || "—"}</span>
                            <span>{fmtDate(d.deal_date)}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, serif",
                              fontSize: 18,
                              color: "#e8c97a",
                              fontWeight: 500,
                            }}
                          >
                            {fmtCurrency(d.deal_amount_usd)}
                          </div>
                          {d.equity_percentage != null && (
                            <div
                              style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 9,
                                color: "#8892a4",
                                marginTop: 3,
                              }}
                            >
                              {d.equity_percentage}% equity
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* ── Founders ── */}
              {founders.length > 0 && (
                <Section icon={<Users size={14} />} label="Founding Team" count={founders.length}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: 1,
                      background: "rgba(201,168,76,0.1)",
                    }}
                  >
                    {founders.map((f) => (
                      <div
                        key={f.founder_id}
                        style={{ background: "#0f1420", padding: "20px 22px" }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            border: "1px solid rgba(201,168,76,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: 18,
                            color: "#e8c97a",
                            marginBottom: 14,
                          }}
                        >
                          {f.founder_name?.charAt(0) || "?"}
                        </div>
                        <div
                          style={{ fontSize: 16, fontWeight: 400, color: "#f0ece2", marginBottom: 4 }}
                        >
                          {f.founder_name}
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 9,
                            color: "#c9a84c",
                            letterSpacing: "0.1em",
                            marginBottom: 10,
                          }}
                        >
                          {f.role?.toUpperCase() || "FOUNDER"}
                        </div>
                        {f.equity_stake != null && (
                          <div
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 10,
                              color: "#8892a4",
                            }}
                          >
                            {f.equity_stake}% stake
                          </div>
                        )}
                        {f.linkedin_url && (
                          <a
                            href={f.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-block",
                              marginTop: 10,
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 9,
                              color: "#c9a84c",
                              textDecoration: "none",
                              letterSpacing: "0.08em",
                            }}
                          >
                            LINKEDIN ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* ── Metrics ── */}
              {metrics.length > 0 && (
                <Section
                  icon={<TrendingUp size={14} />}
                  label="Performance Metrics"
                  count={metrics.length}
                  defaultOpen={false}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                      gap: 1,
                      background: "rgba(201,168,76,0.1)",
                    }}
                  >
                    {metrics.map((m, idx) => (
                      <div
                        key={m.metric_id ?? idx}
                        style={{ background: "#0f1420", padding: "18px 20px" }}
                      >
                        <div
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 9,
                            letterSpacing: "0.1em",
                            color: "#8892a4",
                            marginBottom: 8,
                          }}
                        >
                          {(m.metric_name || "METRIC").toUpperCase()}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: 22,
                            fontWeight: 500,
                            color: "#e8c97a",
                          }}
                        >
                          {m.metric_value ?? "—"}
                          {m.unit && (
                            <span
                              style={{ fontSize: 13, color: "#8892a4", marginLeft: 4 }}
                            >
                              {m.unit}
                            </span>
                          )}
                        </div>
                        {m.recorded_at && (
                          <div
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 9,
                              color: "#6b7588",
                              marginTop: 6,
                            }}
                          >
                            {fmtDate(m.recorded_at)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* ── Trend sparkline placeholder if no sections had data ── */}
              {deals.length === 0 &&
                founders.length === 0 &&
                metrics.length === 0 &&
                healthScores.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 0",
                      color: "#8892a4",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      borderTop: "1px solid rgba(201,168,76,0.1)",
                    }}
                  >
                    <Activity size={24} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <div>No detailed records found for this startup.</div>
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default StartupFullReportModal;
