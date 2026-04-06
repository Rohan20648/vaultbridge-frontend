import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroBackground from "@/components/HeroBackground";
import { toast } from "@/hooks/use-toast";
import { createFounder, createStartup, createProduct, getIndustries, getLocations, getProductCategories } from "@/lib/api";

const steps = ["Profile", "Startup", "Products", "Funding", "Review"];

type IndustryRecord    = { industry_id: number; industry_name: string };
type LocationRecord    = { location_id: number; city: string; country: string };
type ProductCategoryRecord = { category_id: number; category_name: string };

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error && "response" in error) {
    const r = (error as { response?: { data?: { message?: string; error?: string } } }).response;
    return r?.data?.message || r?.data?.error || fallback;
  }
  return fallback;
};

// Shared field styles
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

const errorStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 9,
  color: "#e05c5c",
  marginTop: 6,
  letterSpacing: "0.05em",
};

const FounderOnboarding = () => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [industries, setIndustries] = useState<IndustryRecord[]>([]);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategoryRecord[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getIndustries(), getLocations(), getProductCategories()])
      .then(([iRes, lRes, pcRes]) => {
        setIndustries(iRes.data || []);
        setLocations(lRes.data || []);
        setProductCategories(pcRes.data || []);
      })
      .catch(() => {});
  }, []);

  const { register, handleSubmit, control, watch, trigger, formState: { errors } } = useForm({
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "", dob: "", gender: "",
      nationality: "", linkedin: "", bio: "",
      startup: { name: "", tagline: "", industry_id: "", location_id: "", website: "",
        foundedYear: "", revenue: "", profitLoss: "", employees: "", totalFunding: "", status: "Active" },
      products: [{ name: "", description: "", price: "", launchDate: "", isPatented: false, unitsSold: "", category_id: "" }],
      funding: { stage: "", enteredDate: "", totalRaised: "", leadInvestor: "" },
    },
  });

  const productFields = useFieldArray({ control, name: "products" });
  const allData = watch();

  const next = async () => {
    if (step === 0) { const v = await trigger("firstName"); if (!v) return; }
    if (step === 1) { const v = await trigger(["startup.name", "startup.foundedYear"]); if (!v) return; }
    setStep(s => Math.min(s + 1, steps.length - 1));
  };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const onSubmit = async () => {
    if (!allData.firstName?.trim()) { toast({ title: "Error", description: "First name is required.", variant: "destructive" }); setStep(0); return; }
    if (!allData.startup.name)      { toast({ title: "Error", description: "Startup name is required.", variant: "destructive" }); setStep(1); return; }
    if (!allData.startup.foundedYear){ toast({ title: "Error", description: "Founded year is required.", variant: "destructive" }); setStep(1); return; }

    try {
      setSubmitting(true);
      const startupRes = await createStartup({
        startup_name: allData.startup.name,
        tagline: allData.startup.tagline,
        industry_id: allData.startup.industry_id || null,
        location_id: allData.startup.location_id || null,
        website: allData.startup.website,
        founded_year: allData.startup.foundedYear ? parseInt(allData.startup.foundedYear) : null,
        annual_revenue_usd: allData.startup.revenue ? parseFloat(allData.startup.revenue) : null,
        profit_loss_usd: allData.startup.profitLoss ? parseFloat(allData.startup.profitLoss) : null,
        num_employees: allData.startup.employees ? parseInt(allData.startup.employees) : null,
        total_funding_usd: allData.startup.totalFunding ? parseFloat(allData.startup.totalFunding) : 0,
        status: allData.startup.status,
      });
      const startup_id = startupRes.data?.startup_id;
      if (startup_id) localStorage.setItem("vaultbridge_founder_startup_id", String(startup_id));

      await createFounder({
        first_name: allData.firstName.trim(), last_name: allData.lastName,
        email: allData.email, phone: allData.phone, date_of_birth: allData.dob || null,
        gender: allData.gender || null, nationality: allData.nationality,
        linkedin_url: allData.linkedin, bio: allData.bio, startup_id, role: "Founder",
      });

      for (const p of allData.products) {
        if (p.name && startup_id) {
          await createProduct({
            startup_id, product_name: p.name, description: p.description,
            unit_price_usd: p.price ? parseFloat(p.price) : null,
            launch_date: p.launchDate || null, is_patented: p.isPatented ? 1 : 0,
            units_sold: p.unitsSold ? parseInt(p.unitsSold) : null,
            category_id: p.category_id || null,
          });
        }
      }

      toast({ title: "Profile Created!", description: "Your founder profile has been submitted." });
      navigate("/dashboard/founder");
    } catch (error: unknown) {
      toast({ title: "Error", description: getErrorMessage(error, "Failed to create profile."), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
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
        <HeroBackground opacity={0.4} />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 760,
            margin: "0 auto",
            padding: "104px 40px 80px",
          }}
        >
          {/* Page label */}
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "#c9a84c", marginBottom: 12 }}>
            — FOUNDER ONBOARDING —
          </div>
          <h1 style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: 48 }}>
            Join as a <em style={{ color: "#e8c97a" }}>Founder</em>
          </h1>

          {/* Step indicator */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 16 }}>
              {steps.map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      border: `1px solid ${i < step ? "#c9a84c" : i === step ? "#e8c97a" : "rgba(255,255,255,0.1)"}`,
                      background: i < step ? "rgba(201,168,76,0.2)" : i === step ? "rgba(232,201,122,0.12)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: i < step ? "#c9a84c" : i === step ? "#e8c97a" : "#8892a4",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      letterSpacing: "0.05em",
                      transition: "all 0.3s",
                    }}
                  >
                    {i < step ? <Check size={12} /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ flex: 1, height: 1, background: i < step ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.07)", margin: "0 8px" }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.16em", color: "#8892a4", textAlign: "center" }}>
              STEP {step + 1} / {steps.length} — {steps[step].toUpperCase()}
            </div>
          </div>

          {/* Card */}
          <div
            style={{
              background: "#0f1420",
              border: "1px solid rgba(201,168,76,0.15)",
              padding: 48,
            }}
          >
            {/* ── Step 0: Profile ── */}
            {step === 0 && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 32 }}>Your Profile</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
                  <div>
                    <label style={labelStyle}>FIRST NAME *</label>
                    <input {...register("firstName", { required: "Required" })} style={inputStyle}
                      placeholder="John"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                    {errors.firstName && <p style={errorStyle}>{errors.firstName.message as string}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>LAST NAME</label>
                    <input {...register("lastName")} style={inputStyle} placeholder="Doe"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>EMAIL</label>
                    <input {...register("email")} type="email" style={inputStyle} placeholder="john@startup.com"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>PHONE</label>
                    <input {...register("phone")} style={inputStyle} placeholder="+1 555 123 4567"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>DATE OF BIRTH</label>
                    <input {...register("dob")} type="date" style={{ ...inputStyle, colorScheme: "dark" }}
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>GENDER</label>
                    <select {...register("gender")} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="" style={{ background: "#0f1420" }}>Select</option>
                      {["Male","Female","Non-binary","Prefer not to say"].map(v => <option key={v} style={{ background: "#0f1420" }}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>NATIONALITY</label>
                    <input {...register("nationality")} style={inputStyle} placeholder="American"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>LINKEDIN URL</label>
                    <input {...register("linkedin")} style={inputStyle} placeholder="linkedin.com/in/johndoe"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={labelStyle}>BIO</label>
                    <textarea {...register("bio")} style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} placeholder="Tell us about your entrepreneurial journey…"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 1: Startup ── */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 32 }}>Your Startup</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
                  {[
                    { label: "STARTUP NAME *", key: "startup.name" as const, placeholder: "NeuralForge AI", required: true },
                    { label: "TAGLINE", key: "startup.tagline" as const, placeholder: "Enterprise LLM infrastructure" },
                    { label: "WEBSITE URL", key: "startup.website" as const, placeholder: "https://example.com" },
                    { label: "FOUNDED YEAR *", key: "startup.foundedYear" as const, placeholder: "2023", required: true },
                    { label: "ANNUAL REVENUE (USD)", key: "startup.revenue" as const, placeholder: "500000" },
                    { label: "PROFIT/LOSS (USD)", key: "startup.profitLoss" as const, placeholder: "-120000" },
                    { label: "EMPLOYEES", key: "startup.employees" as const, placeholder: "25" },
                    { label: "TOTAL FUNDING (USD)", key: "startup.totalFunding" as const, placeholder: "4200000" },
                  ].map(({ label, key, placeholder, required }) => (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <input
                        {...register(key as any, required ? { required: "Required" } : {})}
                        style={inputStyle}
                        placeholder={placeholder}
                        onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                        onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                      />
                      {required && errors.startup?.[key.split(".")[1] as keyof typeof errors.startup] && (
                        <p style={errorStyle}>Required</p>
                      )}
                    </div>
                  ))}
                  <div>
                    <label style={labelStyle}>INDUSTRY</label>
                    <select {...register("startup.industry_id")} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="" style={{ background: "#0f1420" }}>Select Industry</option>
                      {industries.map(i => <option key={i.industry_id} value={i.industry_id} style={{ background: "#0f1420" }}>{i.industry_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>LOCATION</label>
                    <select {...register("startup.location_id")} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="" style={{ background: "#0f1420" }}>Select Location</option>
                      {locations.map(l => <option key={l.location_id} value={l.location_id} style={{ background: "#0f1420" }}>{l.city}, {l.country}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>STATUS</label>
                    <select {...register("startup.status")} style={{ ...inputStyle, cursor: "pointer" }}>
                      {["Active","Acquired","Shutdown","IPO","Dormant","Pivoting"].map(s => <option key={s} style={{ background: "#0f1420" }}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Products ── */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 32 }}>Your Product(s)</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {productFields.fields.map((field, idx) => (
                    <div
                      key={field.id}
                      style={{ border: "1px solid rgba(201,168,76,0.12)", padding: 24, background: "rgba(255,255,255,0.02)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: "#c9a84c" }}>
                          PRODUCT {idx + 1}
                        </span>
                        {idx > 0 && (
                          <button type="button" onClick={() => productFields.remove(idx)}
                            style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer", padding: 4 }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                        {[
                          { label: "PRODUCT NAME *", key: `products.${idx}.name` as const, placeholder: "ProductName" },
                          { label: "UNIT PRICE (USD)", key: `products.${idx}.price` as const, placeholder: "49.99" },
                          { label: "UNITS SOLD", key: `products.${idx}.unitsSold` as const, placeholder: "1200" },
                        ].map(({ label, key, placeholder }) => (
                          <div key={key}>
                            <label style={labelStyle}>{label}</label>
                            <input {...register(key as any)} style={inputStyle} placeholder={placeholder}
                              onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                              onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                            />
                          </div>
                        ))}
                        <div>
                          <label style={labelStyle}>LAUNCH DATE</label>
                          <input {...register(`products.${idx}.launchDate`)} type="date" style={{ ...inputStyle, colorScheme: "dark" }}
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>CATEGORY</label>
                          <select {...register(`products.${idx}.category_id`)} style={{ ...inputStyle, cursor: "pointer" }}>
                            <option value="" style={{ background: "#0f1420" }}>Select</option>
                            {productCategories.map(c => <option key={c.category_id} value={c.category_id} style={{ background: "#0f1420" }}>{c.category_name}</option>)}
                          </select>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <input type="checkbox" {...register(`products.${idx}.isPatented`)}
                            style={{ width: 16, height: 16, accentColor: "#c9a84c", cursor: "pointer" }} />
                          <label style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>IS PATENTED</label>
                        </div>
                        <div style={{ gridColumn: "1/-1" }}>
                          <label style={labelStyle}>DESCRIPTION</label>
                          <textarea {...register(`products.${idx}.description`)} style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => productFields.append({ name: "", description: "", price: "", launchDate: "", isPatented: false, unitsSold: "", category_id: "" })}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#c9a84c", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", padding: 0 }}
                  >
                    <Plus size={12} /> ADD ANOTHER PRODUCT
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Funding ── */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 32 }}>Funding Stage</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 24px" }}>
                  <div>
                    <label style={labelStyle}>STAGE</label>
                    <select {...register("funding.stage")} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="" style={{ background: "#0f1420" }}>Select</option>
                      {["Pre-seed","Seed","Series A","Series B","Series C","Series D+","Growth","Pre-IPO"].map(s => <option key={s} style={{ background: "#0f1420" }}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>ENTERED DATE</label>
                    <input {...register("funding.enteredDate")} type="date" style={{ ...inputStyle, colorScheme: "dark" }}
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>TOTAL RAISED (USD)</label>
                    <input {...register("funding.totalRaised")} style={inputStyle} placeholder="4200000"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>LEAD INVESTOR</label>
                    <input {...register("funding.leadInvestor")} style={inputStyle} placeholder="Apex Ventures"
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Review ── */}
            {step === 4 && (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 32 }}>Review & Submit</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "rgba(201,168,76,0.12)" }}>
                  {[
                    { title: "Profile",  data: `${allData.firstName} ${allData.lastName} · ${allData.email}`, step: 0 },
                    { title: "Startup",  data: `${allData.startup.name} · ${allData.startup.status} · Founded ${allData.startup.foundedYear}`, step: 1 },
                    { title: "Products", data: allData.products.map(p => p.name).filter(Boolean).join(", ") || "No products added", step: 2 },
                    { title: "Funding",  data: `${allData.funding.stage || "N/A"} · $${allData.funding.totalRaised || "0"}`, step: 3 },
                  ].map(({ title, data, step: editStep }) => (
                    <div
                      key={title}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        padding: "20px 24px",
                        background: "#0f1420",
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: "#c9a84c", marginBottom: 8 }}>
                          {title.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 300, color: "#8892a4" }}>{data}</div>
                      </div>
                      <button
                        onClick={() => setStep(editStep)}
                        style={{ background: "none", border: "none", color: "#c9a84c", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", flexShrink: 0, marginLeft: 16 }}
                      >
                        EDIT
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 40,
                paddingTop: 28,
                borderTop: "1px solid rgba(201,168,76,0.12)",
              }}
            >
              <button
                type="button"
                onClick={prev}
                disabled={step === 0}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "none",
                  border: "none",
                  color: step === 0 ? "rgba(136,146,164,0.3)" : "#8892a4",
                  cursor: step === 0 ? "default" : "pointer",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  padding: 0,
                  transition: "color 0.2s",
                }}
              >
                <ChevronLeft size={14} /> BACK
              </button>

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 32px",
                    border: "1px solid #c9a84c",
                    background: "transparent",
                    color: "#e8c97a",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    cursor: "pointer",
                    transition: "background 0.3s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = "rgba(201,168,76,0.1)")}
                  onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                >
                  NEXT <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={submitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 32px",
                    border: "1px solid #c9a84c",
                    background: "rgba(201,168,76,0.12)",
                    color: "#e8c97a",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    cursor: submitting ? "default" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                    transition: "background 0.3s",
                  }}
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

export default FounderOnboarding;
