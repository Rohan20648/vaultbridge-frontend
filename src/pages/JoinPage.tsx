import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Rocket, Briefcase, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";

const tiles = [
  { icon: Rocket, label: "Startup Founder", desc: "Submit your venture and connect with investors", to: "/onboarding/founder", emoji: "🚀" },
  { icon: Briefcase, label: "Investor (Shark)", desc: "Discover promising startups and close deals", to: "/onboarding/investor", emoji: "💼" },
  { icon: Eye, label: "Browse as Viewer", desc: "Explore the startup and investor directory", to: "/explore", emoji: "👁️" },
];

const JoinPage = () => (
  <>
    <Navbar />
    <PageTransition>
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12"
          >
            <div className="text-5xl mb-4">🏦</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">How do you want to join VaultBridge?</h1>
            <p className="text-muted-foreground">Select your role to get started</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {tiles.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Link
                  to={t.to}
                  className="glass-card glass-card-hover rounded-2xl p-8 text-center block h-full hover:scale-[1.02] transition-transform"
                >
                  <div className="text-4xl mb-4">{t.emoji}</div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{t.label}</h3>
                  <p className="text-sm text-muted-foreground">{t.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  </>
);

export default JoinPage;
