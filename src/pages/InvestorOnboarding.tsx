import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import { toast } from "@/hooks/use-toast";
import { createShark, createPortfolio, createDeal, getStartups } from "@/lib/api";

const steps = ["Profile", "Company", "Expertise", "Portfolio", "Deal", "Review"];

const InvestorOnboarding = () => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [startups, setStartups] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getStartups().then(r => setStartups(r.data || [])).catch(() => {});
  }, []);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "", dob: "", nationality: "", netWorth: "", bio: "",
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
    if (step === 0) {
      if (!allData.firstName || !allData.netWorth) {
        await handleSubmit(() => {})();
        return;
      }
    }
    setStep(s => Math.min(s + 1, steps.length - 1));
  };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const onSubmit = async () => {
    if (!allData.firstName) {
      toast({ title: "Error", description: "First name is required. Please go back to Step 1.", variant: "destructive" });
      return;
    }
    if (!allData.netWorth) {
      toast({ title: "Error", description: "Net worth is required. Please go back to Step 1.", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);

      // 1. Create shark
      const sharkRes = await createShark({
        first_name: allData.firstName,
        last_name: allData.lastName,
        email: allData.email,
        phone: allData.phone,
        date_of_birth: allData.dob || null,
        nationality: allData.nationality,
        net_worth_usd_millions: allData.netWorth ? parseFloat(allData.netWorth) : null,
        bio: allData.bio,
        expertise_domain: allData.expertise[0]?.domain || null,
      });
      const shark_id = sharkRes.data?.shark_id;

      // 2. Create portfolio entries
      for (const p of allData.portfolio) {
        if (p.startup_id && shark_id) {
          await createPortfolio({
            shark_id,
            startup_id: parseInt(p.startup_id),
            total_invested_usd: p.totalInvested ? parseFloat(p.totalInvested) : null,
            current_equity_percent: p.equity ? parseFloat(p.equity) : null,
            portfolio_status: p.status,
            first_investment_date: p.firstDate || null,
            current_valuation_usd: p.valuation ? parseFloat(p.valuation) : null,
            roi_percent: p.roi ? parseFloat(p.roi) : null,
          });
        }
      }

      // 3. Create deal if startup provided
      if (allData.deal.startup_id) {
        await createDeal({
          startup_id: parseInt(allData.deal.startup_id),
          deal_amount_usd: allData.deal.amount ? parseFloat(allData.deal.amount) : null,
          deal_equity_percent: allData.deal.equity ? parseFloat(allData.deal.equity) : null,
          deal_type: allData.deal.type,
          handshake_date: allData.deal.date || null,
          deal_status: allData.deal.status,
          deal_notes: allData.deal.notes,
          sharks: shark_id ? [{
            shark_id,
            contribution: allData.deal.contribution ? parseFloat(allData.deal.contribution) : 0,
            equity: allData.deal.equityShare ? parseFloat(allData.deal.equityShare) : 0,
            is_lead: allData.deal.isLead ? 1 : 0,
          }] : [],
        });
      }

      toast({ title: "Profile Created!", description: "Your investor profile has been submitted successfully." });
      navigate("/dashboard/investor");
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.error || "Failed to create profile. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-sm font-medium text-muted-foreground mb-1.5";

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="min-h-screen pt-20 pb-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="mb-10">
              <div className="flex items-center justify-between mb-3">
                {steps.map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${i < step ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {i < step ? <Check size={14} /> : i + 1}
                    </div>
                    {i < steps.length - 1 && <div className={`hidden sm:block w-8 md:w-16 h-0.5 mx-1 ${i < step ? "bg-success" : "bg-border"}`} />}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground text-center">Step {step + 1}: {steps[step]}</p>
            </div>

            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="glass-card rounded-2xl p-8">

              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Your Profile</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>First Name *</label>
                      <input {...register("firstName", { required: "First name is required" })} className={inputClass} placeholder="Sarah" />
                      {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName.message as string}</p>}
                    </div>
                    <div><label className={labelClass}>Last Name</label><input {...register("lastName")} className={inputClass} placeholder="Chen" /></div>
                    <div><label className={labelClass}>Email</label><input {...register("email")} type="email" className={inputClass} placeholder="sarah@apexvc.com" /></div>
                    <div><label className={labelClass}>Phone</label><input {...register("phone")} className={inputClass} placeholder="+1 555 987 6543" /></div>
                    <div><label className={labelClass}>Date of Birth</label><input {...register("dob")} type="date" className={inputClass} /></div>
                    <div><label className={labelClass}>Nationality</label><input {...register("nationality")} className={inputClass} placeholder="American" /></div>
                    <div>
                      <label className={labelClass}>Net Worth (USD millions) *</label>
                      <input {...register("netWorth", { required: "Net worth is required" })} className={inputClass} placeholder="340" />
                      {errors.netWorth && <p className="text-destructive text-xs mt-1">{errors.netWorth.message as string}</p>}
                    </div>
                  </div>
                  <div><label className={labelClass}>Bio</label><textarea {...register("bio")} className={inputClass + " min-h-[100px]"} placeholder="Describe your investment philosophy..." /></div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Your Company (Optional)</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className={labelClass}>Company Name</label><input {...register("company.name")} className={inputClass} placeholder="Apex Ventures" /></div>
                    <div>
                      <label className={labelClass}>Company Type</label>
                      <select {...register("company.type")} className={inputClass}>
                        <option value="">Select</option>
                        {["VC", "PE", "Family Office", "Conglomerate", "Angel", "Corporate"].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div><label className={labelClass}>Website</label><input {...register("company.website")} className={inputClass} placeholder="https://apexventures.com" /></div>
                    <div><label className={labelClass}>AUM (USD millions)</label><input {...register("company.aum")} className={inputClass} placeholder="850" /></div>
                    <div><label className={labelClass}>City</label><input {...register("company.city")} className={inputClass} placeholder="New York" /></div>
                    <div><label className={labelClass}>Country</label><input {...register("company.country")} className={inputClass} placeholder="United States" /></div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Your Expertise</h2>
                  {expertiseFields.fields.map((field, idx) => (
                    <div key={field.id} className="p-4 rounded-xl bg-accent/30 border border-border/50 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Expertise {idx + 1}</span>
                        {idx > 0 && <button type="button" onClick={() => expertiseFields.remove(idx)} className="text-destructive"><Trash2 size={16} /></button>}
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div><label className={labelClass}>Domain</label><input {...register(`expertise.${idx}.domain`)} className={inputClass} placeholder="Machine Learning" /></div>
                        <div><label className={labelClass}>Years of Experience</label><input {...register(`expertise.${idx}.years`)} className={inputClass} placeholder="12" /></div>
                        <div className="flex items-center gap-3 pt-6">
                          <input type="checkbox" {...register(`expertise.${idx}.isPrimary`)} className="w-4 h-4 rounded" />
                          <label className="text-sm text-muted-foreground">Is Primary</label>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => expertiseFields.append({ domain: "", years: "", isPrimary: false })} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    <Plus size={14} /> Add Expertise
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Portfolio Investments</h2>
                  {portfolioFields.fields.map((field, idx) => (
                    <div key={field.id} className="p-4 rounded-xl bg-accent/30 border border-border/50 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Investment {idx + 1}</span>
                        {idx > 0 && <button type="button" onClick={() => portfolioFields.remove(idx)} className="text-destructive"><Trash2 size={16} /></button>}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Startup</label>
                          <select {...register(`portfolio.${idx}.startup_id`)} className={inputClass}>
                            <option value="">Select Startup</option>
                            {startups.map((s: any) => <option key={s.startup_id} value={s.startup_id}>{s.startup_name}</option>)}
                          </select>
                        </div>
                        <div><label className={labelClass}>Total Invested (USD)</label><input {...register(`portfolio.${idx}.totalInvested`)} className={inputClass} placeholder="2000000" /></div>
                        <div><label className={labelClass}>Current Equity %</label><input {...register(`portfolio.${idx}.equity`)} className={inputClass} placeholder="15" /></div>
                        <div>
                          <label className={labelClass}>Portfolio Status</label>
                          <select {...register(`portfolio.${idx}.status`)} className={inputClass}>
                            {["Active", "Exited", "Written Off"].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div><label className={labelClass}>First Investment Date</label><input {...register(`portfolio.${idx}.firstDate`)} type="date" className={inputClass} /></div>
                        <div><label className={labelClass}>Current Valuation (USD)</label><input {...register(`portfolio.${idx}.valuation`)} className={inputClass} placeholder="12000000" /></div>
                        <div><label className={labelClass}>ROI %</label><input {...register(`portfolio.${idx}.roi`)} className={inputClass} placeholder="145" /></div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => portfolioFields.append({ startup_id: "", totalInvested: "", equity: "", status: "Active", firstDate: "", valuation: "", roi: "" })} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    <Plus size={14} /> Add Another Investment
                  </button>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Add a Deal (Optional)</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Startup</label>
                      <select {...register("deal.startup_id")} className={inputClass}>
                        <option value="">Select Startup</option>
                        {startups.map((s: any) => <option key={s.startup_id} value={s.startup_id}>{s.startup_name}</option>)}
                      </select>
                    </div>
                    <div><label className={labelClass}>Deal Amount (USD)</label><input {...register("deal.amount")} className={inputClass} placeholder="1500000" /></div>
                    <div><label className={labelClass}>Deal Equity %</label><input {...register("deal.equity")} className={inputClass} placeholder="10" /></div>
                    <div>
                      <label className={labelClass}>Deal Type</label>
                      <select {...register("deal.type")} className={inputClass}>
                        {["Equity", "Royalty", "Loan", "Convertible Note", "Hybrid"].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div><label className={labelClass}>Handshake Date</label><input {...register("deal.date")} type="date" className={inputClass} /></div>
                    <div>
                      <label className={labelClass}>Deal Status</label>
                      <select {...register("deal.status")} className={inputClass}>
                        {["Pending", "Handshake", "Active", "Closed", "Cancelled"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div><label className={labelClass}>Your Contribution (USD)</label><input {...register("deal.contribution")} className={inputClass} /></div>
                    <div><label className={labelClass}>Your Equity Share %</label><input {...register("deal.equityShare")} className={inputClass} /></div>
                    <div className="flex items-center gap-3 pt-6">
                      <input type="checkbox" {...register("deal.isLead")} className="w-4 h-4 rounded" />
                      <label className="text-sm text-muted-foreground">Is Lead Investor</label>
                    </div>
                  </div>
                  <div><label className={labelClass}>Deal Notes</label><textarea {...register("deal.notes")} className={inputClass + " min-h-[80px]"} placeholder="Additional deal terms or notes..." /></div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Review & Submit</h2>
                  <div className="space-y-4">
                    <ReviewSection title="Profile" data={`${allData.firstName} ${allData.lastName} · ${allData.email} · $${allData.netWorth}M net worth`} onEdit={() => setStep(0)} />
                    <ReviewSection title="Company" data={`${allData.company.name || "None"} · ${allData.company.type || "—"}`} onEdit={() => setStep(1)} />
                    <ReviewSection title="Expertise" data={allData.expertise.map(e => `${e.domain} (${e.years}yr)`).filter(e => e.trim() !== " (yr)").join(", ") || "Not specified"} onEdit={() => setStep(2)} />
                    <ReviewSection title="Portfolio" data={`${allData.portfolio.filter(p => p.startup_id).length} investment(s)`} onEdit={() => setStep(3)} />
                    <ReviewSection title="Deal" data={`${allData.deal.startup_id ? `Startup ID ${allData.deal.startup_id}` : "None"} · ${allData.deal.type}`} onEdit={() => setStep(4)} />
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-border/30">
                <button type="button" onClick={prev} disabled={step === 0} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                  <ChevronLeft size={16} /> Back
                </button>
                {step < steps.length - 1 ? (
                  <button type="button" onClick={next} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit(onSubmit)} disabled={submitting} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-success text-success-foreground text-sm font-medium hover:bg-success/90 transition-colors disabled:opacity-70">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Submit & Create Profile
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

const ReviewSection = ({ title, data, onEdit }: { title: string; data: string; onEdit: () => void }) => (
  <div className="flex items-start justify-between p-4 rounded-xl bg-accent/30 border border-border/50">
    <div><h4 className="text-sm font-semibold text-foreground">{title}</h4><p className="text-sm text-muted-foreground mt-1">{data}</p></div>
    <button onClick={onEdit} className="text-xs text-primary hover:underline shrink-0 ml-4">Edit</button>
  </div>
);

export default InvestorOnboarding;
