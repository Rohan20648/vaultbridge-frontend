import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { ChevronLeft, ChevronRight, Plus, Trash2, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import { toast } from "@/hooks/use-toast";

const steps = ["Profile", "Education", "Startup", "Legal", "Products", "Funding", "Review"];

const FounderOnboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "", dob: "", gender: "", nationality: "", linkedin: "", bio: "",
      education: [{ degree: "", field: "", institution: "", gradYear: "", gpa: "" }],
      startup: { name: "", tagline: "", industry: "", city: "", state: "", country: "", website: "", foundedYear: "", revenue: "", profitLoss: "", employees: "", totalFunding: "", status: "Active" },
      legal: { entityType: "", registeredName: "", regNumber: "", incDate: "", incCountry: "", taxId: "", isCompliant: false, lastAudit: "" },
      products: [{ name: "", description: "", price: "", launchDate: "", isPatented: false, unitsSold: "", category: "" }],
      funding: { stage: "", enteredDate: "", totalRaised: "", leadInvestor: "" },
    },
  });

  const educationFields = useFieldArray({ control, name: "education" });
  const productFields = useFieldArray({ control, name: "products" });

  const allData = watch();

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = () => {
    toast({ title: "Profile Created!", description: "Your founder profile has been submitted successfully." });
    navigate("/dashboard/founder");
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
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                        i < step ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
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

            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="glass-card rounded-2xl p-8"
            >
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Your Profile</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className={labelClass}>First Name</label><input {...register("firstName")} className={inputClass} placeholder="John" /></div>
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
                  <h2 className="text-xl font-bold mb-4">Your Education</h2>
                  {educationFields.fields.map((field, idx) => (
                    <div key={field.id} className="p-4 rounded-xl bg-accent/30 border border-border/50 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Degree {idx + 1}</span>
                        {idx > 0 && <button type="button" onClick={() => educationFields.remove(idx)} className="text-destructive hover:text-destructive/80"><Trash2 size={16} /></button>}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div><label className={labelClass}>Degree</label><input {...register(`education.${idx}.degree`)} className={inputClass} placeholder="B.S." /></div>
                        <div><label className={labelClass}>Field of Study</label><input {...register(`education.${idx}.field`)} className={inputClass} placeholder="Computer Science" /></div>
                        <div><label className={labelClass}>Institution</label><input {...register(`education.${idx}.institution`)} className={inputClass} placeholder="MIT" /></div>
                        <div><label className={labelClass}>Graduation Year</label><input {...register(`education.${idx}.gradYear`)} className={inputClass} placeholder="2020" /></div>
                        <div><label className={labelClass}>GPA</label><input {...register(`education.${idx}.gpa`)} className={inputClass} placeholder="3.8" /></div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => educationFields.append({ degree: "", field: "", institution: "", gradYear: "", gpa: "" })} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    <Plus size={14} /> Add Another Degree
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Your Startup</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className={labelClass}>Startup Name</label><input {...register("startup.name")} className={inputClass} placeholder="NeuralForge AI" /></div>
                    <div><label className={labelClass}>Tagline</label><input {...register("startup.tagline")} className={inputClass} placeholder="Enterprise LLM infrastructure" /></div>
                    <div>
                      <label className={labelClass}>Industry</label>
                      <select {...register("startup.industry")} className={inputClass}>
                        <option value="">Select Industry</option>
                        {["AI/ML", "FinTech", "Healthcare", "Clean Energy", "SaaS", "E-commerce", "EdTech", "AgTech", "SpaceTech", "Cybersecurity"].map(i => <option key={i}>{i}</option>)}
                      </select>
                    </div>
                    <div><label className={labelClass}>City</label><input {...register("startup.city")} className={inputClass} placeholder="San Francisco" /></div>
                    <div><label className={labelClass}>State</label><input {...register("startup.state")} className={inputClass} placeholder="California" /></div>
                    <div><label className={labelClass}>Country</label><input {...register("startup.country")} className={inputClass} placeholder="United States" /></div>
                    <div><label className={labelClass}>Website URL</label><input {...register("startup.website")} className={inputClass} placeholder="https://neuralforge.ai" /></div>
                    <div><label className={labelClass}>Founded Year</label><input {...register("startup.foundedYear")} className={inputClass} placeholder="2023" /></div>
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

              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Startup Legal & Registration</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Entity Type</label>
                      <select {...register("legal.entityType")} className={inputClass}>
                        <option value="">Select</option>
                        {["Private Limited", "LLP", "LLC", "C-Corp", "S-Corp", "Sole Proprietorship", "Partnership"].map(e => <option key={e}>{e}</option>)}
                      </select>
                    </div>
                    <div><label className={labelClass}>Registered Name</label><input {...register("legal.registeredName")} className={inputClass} /></div>
                    <div><label className={labelClass}>Registration Number</label><input {...register("legal.regNumber")} className={inputClass} /></div>
                    <div><label className={labelClass}>Incorporation Date</label><input {...register("legal.incDate")} type="date" className={inputClass} /></div>
                    <div><label className={labelClass}>Incorporation Country</label><input {...register("legal.incCountry")} className={inputClass} /></div>
                    <div><label className={labelClass}>Tax ID</label><input {...register("legal.taxId")} className={inputClass} /></div>
                    <div><label className={labelClass}>Last Audit Date</label><input {...register("legal.lastAudit")} type="date" className={inputClass} /></div>
                    <div className="flex items-center gap-3 pt-6">
                      <input type="checkbox" {...register("legal.isCompliant")} className="w-4 h-4 rounded border-border" />
                      <label className="text-sm text-muted-foreground">Is Compliant</label>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Your Product(s)</h2>
                  {productFields.fields.map((field, idx) => (
                    <div key={field.id} className="p-4 rounded-xl bg-accent/30 border border-border/50 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Product {idx + 1}</span>
                        {idx > 0 && <button type="button" onClick={() => productFields.remove(idx)} className="text-destructive"><Trash2 size={16} /></button>}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div><label className={labelClass}>Product Name</label><input {...register(`products.${idx}.name`)} className={inputClass} /></div>
                        <div><label className={labelClass}>Unit Price (USD)</label><input {...register(`products.${idx}.price`)} className={inputClass} /></div>
                        <div><label className={labelClass}>Launch Date</label><input {...register(`products.${idx}.launchDate`)} type="date" className={inputClass} /></div>
                        <div><label className={labelClass}>Units Sold</label><input {...register(`products.${idx}.unitsSold`)} className={inputClass} /></div>
                        <div>
                          <label className={labelClass}>Category</label>
                          <select {...register(`products.${idx}.category`)} className={inputClass}>
                            <option value="">Select</option>
                            {["SaaS", "Hardware", "Mobile App", "API", "Marketplace", "Platform", "Consumer Goods"].map(c => <option key={c}>{c}</option>)}
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
                  <button type="button" onClick={() => productFields.append({ name: "", description: "", price: "", launchDate: "", isPatented: false, unitsSold: "", category: "" })} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    <Plus size={14} /> Add Another Product
                  </button>
                </div>
              )}

              {step === 5 && (
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

              {step === 6 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-4">Review & Submit</h2>
                  <div className="space-y-4">
                    <ReviewSection title="Profile" data={`${allData.firstName} ${allData.lastName} · ${allData.email}`} onEdit={() => setStep(0)} />
                    <ReviewSection title="Education" data={allData.education.map(e => `${e.degree} in ${e.field} from ${e.institution}`).join(", ")} onEdit={() => setStep(1)} />
                    <ReviewSection title="Startup" data={`${allData.startup.name} · ${allData.startup.industry} · ${allData.startup.status}`} onEdit={() => setStep(2)} />
                    <ReviewSection title="Legal" data={`${allData.legal.entityType} · ${allData.legal.registeredName}`} onEdit={() => setStep(3)} />
                    <ReviewSection title="Products" data={allData.products.map(p => p.name).filter(Boolean).join(", ") || "No products added"} onEdit={() => setStep(4)} />
                    <ReviewSection title="Funding" data={`${allData.funding.stage} · $${allData.funding.totalRaised || "0"}`} onEdit={() => setStep(5)} />
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border/30">
                <button
                  type="button"
                  onClick={prev}
                  disabled={step === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-success text-success-foreground text-sm font-medium hover:bg-success/90 transition-colors"
                  >
                    <Check size={16} /> Submit & Create Profile
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
