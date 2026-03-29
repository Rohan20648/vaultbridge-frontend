import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Rocket, Handshake, TrendingUp, ArrowRight, Building2, Users } from "lucide-react";
import VaultAnimation from "@/components/VaultAnimation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedCounter from "@/components/AnimatedCounter";
import StatusBadge from "@/components/StatusBadge";
import PageTransition from "@/components/PageTransition";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const mockStartups = [
  { id: 1, name: "NeuralForge AI", tagline: "Enterprise LLM infrastructure", industry: "Artificial Intelligence", status: "Active", stage: "Series A", funding: "$4.2M" },
  { id: 2, name: "GreenVolt Energy", tagline: "Next-gen battery recycling", industry: "Clean Energy", status: "Active", stage: "Seed", funding: "$1.8M" },
  { id: 3, name: "MedSync Health", tagline: "Remote patient monitoring", industry: "Healthcare", status: "IPO", stage: "Series C", funding: "$52M" },
  { id: 4, name: "FinStack", tagline: "Embedded banking APIs", industry: "FinTech", status: "Active", stage: "Series B", funding: "$18M" },
  { id: 5, name: "AgroSense", tagline: "Precision agriculture platform", industry: "AgTech", status: "Dormant", stage: "Pre-seed", funding: "$400K" },
  { id: 6, name: "Orbitra Labs", tagline: "Satellite data analytics", industry: "SpaceTech", status: "Acquired", stage: "Growth", funding: "$120M" },
];

const mockInvestors = [
  { id: 1, name: "Sarah Chen", company: "Apex Ventures", netWorth: "$340M", type: "VC" },
  { id: 2, name: "Marcus Rivera", company: "Titan Capital", netWorth: "$1.2B", type: "PE" },
  { id: 3, name: "Priya Sharma", company: "EmergeX Partners", netWorth: "$560M", type: "Angel" },
  { id: 4, name: "David Kim", company: "BlueHarbor Group", netWorth: "$890M", type: "Family Office" },
];

const Homepage = () => {
  return (
    <>
      <VaultAnimation />
      <Navbar />
      <PageTransition>
        <div className="min-h-screen pt-16">
          {/* Hero */}
          <section className="relative gradient-hero overflow-hidden py-24 md:py-36">
            {/* Floating blobs */}
            <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-10 animate-float" style={{ background: "radial-gradient(circle, hsl(217 91% 60%), transparent)" }} />
            <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full opacity-8 animate-float-delayed" style={{ background: "radial-gradient(circle, hsl(160 84% 39%), transparent)" }} />
            <div className="absolute top-40 right-40 w-48 h-48 rounded-full opacity-5 animate-float-slow" style={{ background: "radial-gradient(circle, hsl(38 92% 50%), transparent)" }} />

            <div className="container mx-auto px-4 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="max-w-3xl mx-auto text-center"
              >
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
                  Where Startups Meet
                  <br />
                  <span className="gradient-text">Their Sharks</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                  VaultBridge is the premier incubation platform that connects ambitious founders with strategic investors to build the next generation of world-changing companies.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/onboarding/founder"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:scale-[1.02]"
                  >
                    <Rocket size={18} /> I'm a Founder
                  </Link>
                  <Link
                    to="/onboarding/investor"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-border text-foreground font-semibold hover:bg-accent transition-all hover:scale-[1.02]"
                  >
                    <Building2 size={18} /> I'm an Investor
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Stats */}
          <section className="py-16 border-b border-border/30">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { label: "Startups Incubated", target: 482, suffix: "+" },
                  { label: "Active Investors", target: 156 },
                  { label: "Deals Closed", target: 1240 },
                  { label: "Funding Raised", target: 2, prefix: "$", suffix: ".4B" },
                ].map((s) => (
                  <div key={s.label}>
                    <AnimatedCounter target={s.target} prefix={s.prefix} suffix={s.suffix} />
                    <p className="text-sm text-muted-foreground mt-2">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-20" id="about">
            <div className="container mx-auto px-4">
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-center mb-14"
              >
                How It Works
              </motion.h2>
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid md:grid-cols-3 gap-6"
              >
                {[
                  { icon: Rocket, title: "Submit Your Startup", desc: "Create a detailed profile of your venture including team, product, financials, and growth metrics." },
                  { icon: Users, title: "Get Matched", desc: "Our platform matches you with investors whose expertise and portfolio align with your industry and stage." },
                  { icon: Handshake, title: "Close the Deal", desc: "Negotiate terms, complete due diligence, and finalize investment deals — all within VaultBridge." },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="glass-card glass-card-hover rounded-2xl p-8 text-center"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <item.icon className="text-primary" size={26} />
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Startup Directory Teaser */}
          <section className="py-20 border-t border-border/30">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl md:text-3xl font-bold">Featured Startups</h2>
                <Link to="/explore" className="text-sm text-primary flex items-center gap-1 hover:underline">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {mockStartups.map((s) => (
                  <motion.div
                    key={s.id}
                    variants={fadeUp}
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

              <div className="flex items-center justify-between mb-10 mt-16">
                <h2 className="text-2xl md:text-3xl font-bold">Top Investors</h2>
                <Link to="/explore" className="text-sm text-primary flex items-center gap-1 hover:underline">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
              >
                {mockInvestors.map((inv) => (
                  <motion.div
                    key={inv.id}
                    variants={fadeUp}
                    className="glass-card glass-card-hover rounded-xl p-6 text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
                      <span className="text-primary font-bold text-lg">{inv.name.charAt(0)}</span>
                    </div>
                    <h3 className="font-semibold text-foreground">{inv.name}</h3>
                    <p className="text-sm text-muted-foreground">{inv.company}</p>
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <span className="bg-accent/50 px-2 py-1 rounded">{inv.type}</span>
                      <span>{inv.netWorth}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="glass-card rounded-2xl p-12 md:p-16 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-5" style={{ background: "radial-gradient(circle at 30% 50%, hsl(217 91% 60%), transparent 60%)" }} />
                <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">Ready to Open the Vault?</h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto relative z-10">
                  Join hundreds of founders and investors already building the future through VaultBridge.
                </p>
                <Link
                  to="/join"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all relative z-10"
                >
                  <TrendingUp size={18} /> Get Started Now
                </Link>
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </PageTransition>
    </>
  );
};

export default Homepage;
