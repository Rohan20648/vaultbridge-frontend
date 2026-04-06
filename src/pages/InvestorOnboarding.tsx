import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroBackground from "@/components/HeroBackground";
import { toast } from "@/hooks/use-toast";
import { createShark, createPortfolio, createDeal, getStartups } from "@/lib/api";

const steps = ["Profile", "Company", "Expertise", "Portfolio", "Deal", "Review"];

const nullify = (v: string | undefined | null): string | null =>
  v?.trim() ? v.trim() : null;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(201,168,76,0.18)",
  color: "#f0ece2",
  fontFamily: "'DM Mono', monospace",
  fontSize: 12,
  letterSpacing: "0.03em",
  outline: "none",
  borderRadius: 0,
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'DM Mono', monospace",
  fontSize: 9,
  letterSpacing: "0.14em",
  color: "#8892a4",
  marginBottom: 8,
};

const InvestorOnboarding = () => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [startups, setStartups] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getStartups().then(r => setStartups(r.data || [])).catch(() => {});
  }, []);

  const { register, handleSubmit, control, watch, trigger, formState: { errors } } = useForm({
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "", dob: "",
      nationality: "", netWorth: "", bio: "",
      company: { name: "", type: "", website: "", aum: "", foundedYear: "", city: "", state: "", country: "" },
      expertise: [{ domain: "", years: "", isPrimary: false }],
      portfolio: [{ startup_id: "", totalInvested: "", equity: "", status: "Active", firstDate: "", valuation: "", roi: "" }],
      deal: { startup_id: "", amount: "", equity: "", type: "Equity", date: "", status: "Pending", notes: "", contribution: "", equityShare: "", isLead: false },
    },
  });

  const expertiseFields = useFieldArray({ control, name: "expertise" });
  const portfolioFields = useFieldArray({ control, name: "portfolio" });
  const allData = watch();

  const next = async () => {
    if (step === 0) { const v = await trigger(["firstName", "netWorth"]); if (!v) return; }
    setStep(s => Math.min(s + 1, steps.length - 1));
  };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const onSubmit = async () => {
    if (!allData.firstName?.trim()) { toast({ title: "Error", description: "First name is required.", variant: "destructive" }); setStep(0); return; }
    if (!allData.netWorth?.trim())  { toast({ title: "Error", description: "Net worth is required.", variant: "destructive" }); setStep(0); return; }

    try {
      setSubmitting(true);
      const sharkRes = await createShark({
        first_name: allData.firstName.trim(),
        last_name: nullify(allData.lastName),
        email: nullify(allData.email),
        phone: nullify(allData.phone),
        date_of_birth: nullify(allData.dob),
        nationality: nullify(allData.nationality),
        net_worth_usd_millions: allData.netWorth ? parseFloat(allData.netWorth) : null,
        bio: nullify(allData.bio),
        expertise_domain: nullify(allData.expertise[0]?.domain),
      });
      const shark_id = sharkRes.data?.shark_id;
      if (!shark_id) throw new Error("Investor creation failed.");
      localStorage.setItem("vaultbridge_investor_shark_id", String(shark_id));

      for (const p of allData.portfolio) {
        if (p.startup_id && shark_id) {
          await createPortfolio({
            shark_id, startup_id: parseInt(p.startup_id),
            total_invested_usd: p.totalInvested ? parseFloat(p.totalInvested) : null,
            current_equity_percent: p.equity ? parseFloat(p.equity) : null,
            portfolio_status: p.status || "Active",
            first_investment_date: nullify(p.firstDate),
            current_valuation_usd: p.valuation ? parseFloat(p.valuation) : null,
            roi_percent: p.roi ? parseFloat(p.roi) : null,
          });
        }
      }

      if (allData.deal.startup_id) {
        await createDeal({
          startup_id: parseInt(allData.deal.startup_id),
          deal_amount_usd: allData.deal.amount ? parseFloat(allData.deal.amount) : null,
          deal_equity_percent: allData.deal.equity ? parseFloat(allData.deal.equity) : null,
          deal_type: allData.deal.type || "Equity",
          handshake_date: nullify(allData.deal.date),
          deal_status: allData.deal.status || "Handshake",
          deal_notes: nullify(allData.deal.notes),
          sharks: [{
            shark_id,
            contribution: allData.deal.contribution ? parseFloat(allData.deal.contribution) : 0,
            equity: allData.deal.equityShare ? parseFloat(allData.deal.equityShare) : 0,
            is_lead: allData.deal.isLead ? 1 : 0,
          }],
        });
      }

      toast({ title: "Profile Created!", description: "Your investor profile has been submitted." });
      navigate("/dashboard/investor");
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.error || e?.message || "Failed to create profile.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ label, name, placeholder, type = "text" }: { label: string; name: any; placeholder?: string; type?: string }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        {...register(name)}
        type={type}
        style={{ ...inputStyle, ...(type === "date" ? { colorScheme: "dark" } : {}) }}
        placeholder={placeholder}
        onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
        onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
      />
    </div>
  );

  const Select = ({ label, name, options }: { label: string; name: any; options: string[] }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <select {...register(name)} style={{ ...inputStyle, cursor: "pointer" }}>
        <option value="" style={{ background: "#0f1420" }}>Select</option>
        {options.map(o => <option key={o} style={{ background: "#0f1420" }}>{o}</option>)}
      </select>
    </div>
  );

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
        <HeroBackground opacity={0.4} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 760, margin: "0 auto", padding: "104px 40px 80px" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "#c9a84c", marginBottom: 12 }}>
            — INVESTOR ONBOARDING —
          </div>
          <h1 style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: 48 }}>
            Join as an <em style={{ color: "#e8c97a" }}>Investor</em>
          </h1>

          {/* Step indicator */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              {steps.map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      border: `1px solid ${i < step ? "#c9a84c" : i === step ? "#e8c97a" : "rgba(255,255,255,0.1)"}`,
                      background: i < step ? "rgba(201,168,76,0.2)" : i === step ? "rgba(232,201,122,0.12)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: i < step ? "#c9a84c" : i === step ? "#e8c97a" : "#8892a4",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 9,
                      transition: "all 0.3s",
                    }}
                  >
                    {i < step ? <Check size={10} /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ flex: 1, height: 1, background: i < step ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.07)", margin: "0 6px" }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.16em", color: "#8892a4", textAlign: "center" }}>
              STEP {step + 1} / {steps.length} — {steps[step].toUpperCase()}
            </div>
          </div>

          {/* Card */}
          <div style={{ background: "#0f1420", border: "1px solid rgba(201,168,76,0.15)", padding: 48 }}>

            {/* Step 0: Profile */}
            {step === 0 && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 32 }}>Your Profile</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
                  <div>
                    <label style={labelStyle}>FIRST NAME *</label>
                    <input
                      {...register("firstName", { required: "Required" })}
                      style={inputStyle} placeholder="Sarah"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                    {errors.firstName && <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#e05c5c", marginTop: 6 }}>{errors.firstName.message as string}</p>}
                  </div>
                  <Field label="LAST NAME" name="lastName" placeholder="Chen" />
                  <Field label="EMAIL" name="email" placeholder="sarah@apexvc.com" type="email" />
                  <Field label="PHONE" name="phone" placeholder="+1 555 987 6543" />
                  <Field label="DATE OF BIRTH" name="dob" type="date" />
                  <Field label="NATIONALITY" name="nationality" placeholder="American" />
                  <div>
                    <label style={labelStyle}>NET WORTH (USD MILLIONS) *</label>
                    <input
                      {...register("netWorth", { required: "Required" })}
                      style={inputStyle} placeholder="340"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                    {errors.netWorth && <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#e05c5c", marginTop: 6 }}>{errors.netWorth.message as string}</p>}
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={labelStyle}>BIO</label>
                    <textarea {...register("bio")} style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} placeholder="Describe your investment philosophy…"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Company */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 32 }}>Your Company <span style={{ fontSize: 14, color: "#8892a4", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>(Optional)</span></h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
                  <Field label="COMPANY NAME" name="company.name" placeholder="Apex Ventures" />
                  <Select label="COMPANY TYPE" name="company.type" options={["VC","PE","Family Office","Conglomerate","Angel","Corporate"]} />
                  <Field label="WEBSITE" name="company.website" placeholder="https://apexventures.com" />
                  <Field label="AUM (USD MILLIONS)" name="company.aum" placeholder="850" />
                  <Field label="CITY" name="company.city" placeholder="New York" />
                  <Field label="COUNTRY" name="company.country" placeholder="United States" />
                </div>
              </div>
            )}

            {/* Step 2: Expertise */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 32 }}>Your Expertise</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {expertiseFields.fields.map((field, idx) => (
                    <div key={field.id} style={{ border: "1px solid rgba(201,168,76,0.12)", padding: 24, background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: "#c9a84c" }}>EXPERTISE {idx + 1}</span>
                        {idx > 0 && (
                          <button type="button" onClick={() => expertiseFields.remove(idx)}
                            style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer" }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "0 20px", alignItems: "end" }}>
                        <div>
                          <label style={labelStyle}>DOMAIN</label>
                          <input {...register(`expertise.${idx}.domain`)} style={inputStyle} placeholder="Machine Learning"
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>YEARS EXP</label>
                          <input {...register(`expertise.${idx}.years`)} style={inputStyle} placeholder="12"
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                          />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 2 }}>
                          <input type="checkbox" {...register(`expertise.${idx}.isPrimary`)}
                            style={{ width: 14, height: 14, accentColor: "#c9a84c", cursor: "pointer" }} />
                          <label style={{ ...labelStyle, marginBottom: 0, fontSize: 9 }}>PRIMARY</label>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => expertiseFields.append({ domain: "", years: "", isPrimary: false })}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#c9a84c", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", padding: 0 }}
                  >
                    <Plus size={12} /> ADD EXPERTISE
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Portfolio */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 32 }}>Portfolio Investments</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {portfolioFields.fields.map((field, idx) => (
                    <div key={field.id} style={{ border: "1px solid rgba(201,168,76,0.12)", padding: 24, background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: "#c9a84c" }}>INVESTMENT {idx + 1}</span>
                        {idx > 0 && (
                          <button type="button" onClick={() => portfolioFields.remove(idx)}
                            style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer" }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                        <div>
                          <label style={labelStyle}>STARTUP</label>
                          <select {...register(`portfolio.${idx}.startup_id`)} style={{ ...inputStyle, cursor: "pointer" }}>
                            <option value="" style={{ background: "#0f1420" }}>Select Startup</option>
                            {startups.map((s: any) => <option key={s.startup_id} value={s.startup_id} style={{ background: "#0f1420" }}>{s.startup_name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>TOTAL INVESTED (USD)</label>
                          <input {...register(`portfolio.${idx}.totalInvested`)} style={inputStyle} placeholder="2000000"
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>CURRENT EQUITY %</label>
                          <input {...register(`portfolio.${idx}.equity`)} style={inputStyle} placeholder="15"
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>STATUS</label>
                          <select {...register(`portfolio.${idx}.status`)} style={{ ...inputStyle, cursor: "pointer" }}>
                            {["Active","Exited","Written Off"].map(s => <option key={s} style={{ background: "#0f1420" }}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>FIRST INVESTMENT DATE</label>
                          <input {...register(`portfolio.${idx}.firstDate`)} type="date" style={{ ...inputStyle, colorScheme: "dark" }}
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>CURRENT VALUATION (USD)</label>
                          <input {...register(`portfolio.${idx}.valuation`)} style={inputStyle} placeholder="12000000"
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>ROI %</label>
                          <input {...register(`portfolio.${idx}.roi`)} style={inputStyle} placeholder="145"
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => portfolioFields.append({ startup_id: "", totalInvested: "", equity: "", status: "Active", firstDate: "", valuation: "", roi: "" })}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#c9a84c", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", padding: 0 }}
                  >
                    <Plus size={12} /> ADD INVESTMENT
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Deal */}
            {step === 4 && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 32 }}>Add a Deal <span style={{ fontSize: 14, color: "#8892a4", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>(Optional)</span></h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
                  <div>
                    <label style={labelStyle}>STARTUP</label>
                    <select {...register("deal.startup_id")} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="" style={{ background: "#0f1420" }}>Select Startup</option>
                      {startups.map((s: any) => <option key={s.startup_id} value={s.startup_id} style={{ background: "#0f1420" }}>{s.startup_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>DEAL AMOUNT (USD)</label>
                    <input {...register("deal.amount")} style={inputStyle} placeholder="1500000"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>DEAL EQUITY %</label>
                    <input {...register("deal.equity")} style={inputStyle} placeholder="10"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                  <Select label="DEAL TYPE" name="deal.type" options={["Equity","Royalty","Loan","Convertible Note","Hybrid"]} />
                  <div>
                    <label style={labelStyle}>HANDSHAKE DATE</label>
                    <input {...register("deal.date")} type="date" style={{ ...inputStyle, colorScheme: "dark" }}
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                  <Select label="DEAL STATUS" name="deal.status" options={["Pending","Handshake","Active","Closed","Cancelled"]} />
                  <div>
                    <label style={labelStyle}>YOUR CONTRIBUTION (USD)</label>
                    <input {...register("deal.contribution")} style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>YOUR EQUITY SHARE %</label>
                    <input {...register("deal.equityShare")} style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input type="checkbox" {...register("deal.isLead")}
                      style={{ width: 16, height: 16, accentColor: "#c9a84c", cursor: "pointer" }} />
                    <label style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>IS LEAD INVESTOR</label>
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={labelStyle}>DEAL NOTES</label>
                    <textarea {...register("deal.notes")} style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} placeholder="Additional deal terms or notes…"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 32 }}>Review & Submit</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "rgba(201,168,76,0.12)" }}>
                  {[
                    { title: "Profile",   data: `${allData.firstName} ${allData.lastName} · ${allData.email} · $${allData.netWorth}M net worth`, editStep: 0 },
                    { title: "Company",   data: `${allData.company.name || "None"} · ${allData.company.type || "—"}`, editStep: 1 },
                    { title: "Expertise", data: allData.expertise.map(e => `${e.domain} (${e.years}yr)`).filter(e => e.trim() !== " (yr)").join(", ") || "Not specified", editStep: 2 },
                    { title: "Portfolio", data: `${allData.portfolio.filter(p => p.startup_id).length} investment(s)`, editStep: 3 },
                    { title: "Deal",      data: allData.deal.startup_id ? `${startups.find(s => String(s.startup_id) === String(allData.deal.startup_id))?.startup_name || `Startup #${allData.deal.startup_id}`} · ${allData.deal.type}` : "None", editStep: 4 },
                  ].map(({ title, data, editStep }) => (
                    <div key={title} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 24px", background: "#0f1420" }}>
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: "#c9a84c", marginBottom: 8 }}>{title.toUpperCase()}</div>
                        <div style={{ fontSize: 15, fontWeight: 300, color: "#8892a4" }}>{data}</div>
                      </div>
                      <button onClick={() => setStep(editStep)}
                        style={{ background: "none", border: "none", color: "#c9a84c", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", flexShrink: 0, marginLeft: 16 }}>
                        EDIT
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, paddingTop: 28, borderTop: "1px solid rgba(201,168,76,0.12)" }}>
              <button
                type="button" onClick={prev} disabled={step === 0}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", color: step === 0 ? "rgba(136,146,164,0.3)" : "#8892a4", cursor: step === 0 ? "default" : "pointer", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.1em", padding: 0 }}
              >
                <ChevronLeft size={14} /> BACK
              </button>

              {step < steps.length - 1 ? (
                <button
                  type="button" onClick={next}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 32px", border: "1px solid #c9a84c", background: "transparent", color: "#e8c97a", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", cursor: "pointer", transition: "background 0.3s" }}
                  onMouseOver={e => (e.currentTarget.style.background = "rgba(201,168,76,0.1)")}
                  onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                >
                  NEXT <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button" onClick={handleSubmit(onSubmit)} disabled={submitting}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 32px", border: "1px solid #c9a84c", background: "rgba(201,168,76,0.12)", color: "#e8c97a", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1, transition: "background 0.3s" }}
                  onMouseOver={e => { if (!submitting) e.currentTarget.style.background = "rgba(201,168,76,0.2)"; }}
                  onMouseOut={e => (e.currentTarget.style.background = "rgba(201,168,76,0.12)")}
                >
                  {submitting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />}
                  {submitting ? "SUBMITTING…" : "SUBMIT PROFILE"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </>
  );
};

export default InvestorOnboarding;
