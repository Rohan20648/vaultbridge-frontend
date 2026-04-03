import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import { toast } from "@/hooks/use-toast";
import { createFounder, createStartup, createProduct, getIndustries, getLocations, getProductCategories } from "@/lib/api";

const steps = ["Profile", "Startup", "Products", "Funding", "Review"];

const FounderOnboarding = () => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [industries, setIndustries] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);
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

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "", dob: "", gender: "", nationality: "", linkedin: "", bio: "",
      startup: { name: "", tagline: "", industry_id: "", location_id: "", website: "", foundedYear: "", revenue: "", profitLoss: "", employees: "", totalFunding: "", status: "Active" },
      products: [{ name: "", description: "", price: "", launchDate: "", isPatented: false, unitsSold: "", category_id: "" }],
      funding: { stage: "", enteredDate: "", totalRaised: "", leadInvestor: "" },
    },
  });

  const productFields = useFieldArray({ control, name: "products" });
  const allData = watch();

  const next = async () => {
    // Validate required fields before advancing
    if (step === 0) {
      const valid = await handleSubmit(() => {})() !== undefined || !errors.firstName;
      if (errors.firstName) return;
    }
    if (step === 1) {
      if (!allData.startup.name || !allData.startup.foundedYear) {
        // trigger validation display
        await handleSubmit(() => {})();
        return;
      }
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async () => {
    if (!allData.startup.name) {
      toast({ title: "Error", description: "Startup name is required. Please go back to Step 2.", variant: "destructive" });
      return;
    }
    if (!allData.startup.foundedYear) {
      toast({ title: "Error", description: "Founded year is required. Please go back to Step 2.", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      // 1. Create startup
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
      if (startup_id) {
        localStorage.setItem("vaultbridge_founder_startup_id", String(startup_id));
      }

      // 2. Create founder and link to startup
      await createFounder({
        first_name: allData.firstName,
        last_name: allData.lastName,
        email: allData.email,
        phone: allData.phone,
        date_of_birth: allData.dob || null,
        gender: allData.gender || null,
        nationality: allData.nationality,
        linkedin_url: allData.linkedin,
        bio: allData.bio,
        startup_id,
        role: "Founder",
      });

      // 3. Create products
      for (const p of allData.products) {
        if (p.name && startup_id) {
          await createProduct({
            startup_id,
            product_name: p.name,
            description: p.description,
            unit_price_usd: p.price ? parseFloat(p.price) : null,
            launch_date: p.launchDate || null,
            is_patented: p.isPatented ? 1 : 0,
            units_sold: p.unitsSold ? parseInt(p.unitsSold) : null,
            category_id: p.category_id || null,
          });
        }
      }

      toast({ title: "Profile Created!", description: "Your founder profile has been submitted successfully." });
      navigate("/dashboard/founder");
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
            {/* Progress */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-3">
                {steps.map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${i < step ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {i < step ? <Check size={14} /> : i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`hidden sm:block w-8 md:w-16 h-0.5 mx-1 ${i < step ? "bg-success" : "bg-border"}`} />
                    )}
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
                    <div><label className={labelClass}>First Name *</label><input {...register("firstName", { required: true })} className={inputClass} placeholder="John" /></div>
                    <div><label className={labelClass}>Last Name</label><input {...register("lastName")} className={inputClass} placeholder="Doe" /></div>
                    <div><label className={labelClass}>Email</label><input {...register("email")} type="email" className={inputClass} placeholder="john@startup.com" /></div>
                    <div><label className={labelClass}>Phone</label><input {...register("phone")} className={inputClass} placeholder="+1 555 123 4567" /></div>
                    <div><label className={labelClass}>Date of Birth</label><input {...register("dob")} type="date" className={inputClass} /></div>
                    <div>
                      <label className={labelClass}>Gender</label>
                      <select {...register("gender")} className={inputClass}>
                        <option value="">Select</option><option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
                      </select>
                    </div>
                    <div><label className={labelClass}>Nationality</label><input {...register("nationality")} className={inputClass} placeholder="American" /></div>
                    <div><label className={labelClass}>LinkedIn URL</label><input {...register("linkedin")} className={inputClass} placeholder="linkedin.com/in/johndoe" /></div>
                  </div>
                  <div><label className={labelClass}>Bio</label><textarea {...register("bio")} className={inputClass + " min-h-[100px]"} placeholder="Tell us about yourself and your entrepreneurial journey..." /></div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Your Startup</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Startup Name *</label>
                      <input {...register("startup.name", { required: "Startup name is required" })} className={inputClass} placeholder="NeuralForge AI" />
                      {errors.startup?.name && <p className="text-destructive text-xs mt-1">{errors.startup.name.message as string}</p>}
                    </div>
                    <div><label className={labelClass}>Tagline</label><input {...register("startup.tagline")} className={inputClass} placeholder="Enterprise LLM infrastructure" /></div>
                    <div>
                      <label className={labelClass}>Industry</label>
                      <select {...register("startup.industry_id")} className={inputClass}>
                        <option value="">Select Industry</option>
                        {industries.map((i: any) => <option key={i.industry_id} value={i.industry_id}>{i.industry_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Location</label>
                      <select {...register("startup.location_id")} className={inputClass}>
                        <option value="">Select Location</option>
                        {locations.map((l: any) => <option key={l.location_id} value={l.location_id}>{l.city}, {l.country}</option>)}
                      </select>
                    </div>
                    <div><label className={labelClass}>Website URL</label><input {...register("startup.website")} className={inputClass} placeholder="https://example.com" /></div>
                    <div>
                      <label className={labelClass}>Founded Year *</label>
                      <input {...register("startup.foundedYear", { required: "Founded year is required" })} className={inputClass} placeholder="2023" />
                      {errors.startup?.foundedYear && <p className="text-destructive text-xs mt-1">{errors.startup.foundedYear.message as string}</p>}
                    </div>
                    <div><label className={labelClass}>Annual Revenue (USD)</label><input {...register("startup.revenue")} className={inputClass} placeholder="500000" /></div>
                    <div><label className={labelClass}>Profit/Loss (USD)</label><input {...register("startup.profitLoss")} className={inputClass} placeholder="-120000" /></div>
                    <div><label className={labelClass}>Number of Employees</label><input {...register("startup.employees")} className={inputClass} placeholder="25" /></div>
                    <div><label className={labelClass}>Total Funding (USD)</label><input {...register("startup.totalFunding")} className={inputClass} placeholder="4200000" /></div>
                    <div>
                      <label className={labelClass}>Status</label>
                      <select {...register("startup.status")} className={inputClass}>
                        {["Active", "Acquired", "Shutdown", "IPO", "Dormant", "Pivoting"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Your Product(s)</h2>
                  {productFields.fields.map((field, idx) => (
                    <div key={field.id} className="p-4 rounded-xl bg-accent/30 border border-border/50 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Product {idx + 1}</span>
                        {idx > 0 && <button type="button" onClick={() => productFields.remove(idx)} className="text-destructive"><Trash2 size={16} /></button>}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div><label className={labelClass}>Product Name *</label><input {...register(`products.${idx}.name`)} className={inputClass} /></div>
                        <div><label className={labelClass}>Unit Price (USD)</label><input {...register(`products.${idx}.price`)} className={inputClass} /></div>
                        <div><label className={labelClass}>Launch Date</label><input {...register(`products.${idx}.launchDate`)} type="date" className={inputClass} /></div>
                        <div><label className={labelClass}>Units Sold</label><input {...register(`products.${idx}.unitsSold`)} className={inputClass} /></div>
                        <div>
                          <label className={labelClass}>Category</label>
                          <select {...register(`products.${idx}.category_id`)} className={inputClass}>
                            <option value="">Select</option>
                            {productCategories.map((c: any) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <input type="checkbox" {...register(`products.${idx}.isPatented`)} className="w-4 h-4 rounded" />
                          <label className="text-sm text-muted-foreground">Is Patented</label>
                        </div>
                      </div>
                      <div><label className={labelClass}>Description</label><textarea {...register(`products.${idx}.description`)} className={inputClass + " min-h-[80px]"} /></div>
                    </div>
                  ))}
                  <button type="button" onClick={() => productFields.append({ name: "", description: "", price: "", launchDate: "", isPatented: false, unitsSold: "", category_id: "" })} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    <Plus size={14} /> Add Another Product
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Funding Stage</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Stage Name</label>
                      <select {...register("funding.stage")} className={inputClass}>
                        <option value="">Select</option>
                        {["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Series D+", "Growth", "Pre-IPO"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div><label className={labelClass}>Entered Date</label><input {...register("funding.enteredDate")} type="date" className={inputClass} /></div>
                    <div><label className={labelClass}>Total Raised (USD)</label><input {...register("funding.totalRaised")} className={inputClass} placeholder="4200000" /></div>
                    <div><label className={labelClass}>Lead Investor</label><input {...register("funding.leadInvestor")} className={inputClass} placeholder="Apex Ventures" /></div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Review & Submit</h2>
                  <div className="space-y-4">
                    <ReviewSection title="Profile" data={`${allData.firstName} ${allData.lastName} · ${allData.email}`} onEdit={() => setStep(0)} />
                    <ReviewSection title="Startup" data={`${allData.startup.name} · ${allData.startup.status} · Founded ${allData.startup.foundedYear}`} onEdit={() => setStep(1)} />
                    <ReviewSection title="Products" data={allData.products.map(p => p.name).filter(Boolean).join(", ") || "No products added"} onEdit={() => setStep(2)} />
                    <ReviewSection title="Funding" data={`${allData.funding.stage || "N/A"} · $${allData.funding.totalRaised || "0"}`} onEdit={() => setStep(3)} />
                  </div>
                </div>
              )}

              {/* Navigation */}
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
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-sm text-muted-foreground mt-1">{data}</p>
    </div>
    <button onClick={onEdit} className="text-xs text-primary hover:underline shrink-0 ml-4">Edit</button>
  </div>
);

export default FounderOnboarding;
