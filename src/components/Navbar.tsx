import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  if (isDashboard) return null;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50"
      style={{ background: "hsla(222,47%,6%,0.85)", backdropFilter: "blur(12px)" }}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="text-xl font-bold tracking-tight">
          <span className="gradient-text">Vault</span>
          <span className="text-foreground">Bridge</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "About", to: "/#about" },
            { label: "Startups", to: "/explore" },
            { label: "Investors", to: "/explore" },
            { label: "Login", to: "/join" },
          ].map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/join"
            className="text-sm font-medium px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Join the Ecosystem
          </Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-border/50 px-4 pb-4 pt-2 space-y-3"
          style={{ background: "hsla(222,47%,6%,0.95)" }}
        >
          {["About", "Startups", "Investors", "Login"].map((l) => (
            <Link
              key={l}
              to={l === "Login" ? "/join" : "/explore"}
              className="block text-sm text-muted-foreground py-2"
              onClick={() => setMobileOpen(false)}
            >
              {l}
            </Link>
          ))}
          <Link
            to="/join"
            className="block text-center text-sm font-medium px-5 py-2.5 rounded-lg bg-primary text-primary-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Join the Ecosystem
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
