import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  if (isDashboard) return null;

  const navLinks = [
    { label: "ABOUT",     to: "/#about" },
    { label: "STARTUPS",  to: "/explore" },
    { label: "INVESTORS", to: "/explore" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 56px",
        height: 68,
        background: "rgba(10,13,20,0.92)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(201,168,76,0.18)",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{
          fontSize: 19,
          fontWeight: 600,
          letterSpacing: "0.12em",
          color: "#e8c97a",
          textDecoration: "none",
          fontFamily: "'Cormorant Garamond', Georgia, serif",
        }}
      >
        VAULTBRIDGE
      </Link>

      {/* Desktop nav */}
      <div
        className="hidden md:flex"
        style={{ display: "flex", gap: 40, alignItems: "center" }}
      >
        {navLinks.map((l) => (
          <Link
            key={l.label}
            to={l.to}
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              color: "#8892a4",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseOver={e => (e.currentTarget.style.color = "#f0ece2")}
            onMouseOut={e => (e.currentTarget.style.color = "#8892a4")}
          >
            {l.label}
          </Link>
        ))}
        <Link
          to="/join"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            padding: "11px 28px",
            border: "1px solid #c9a84c",
            background: "transparent",
            color: "#e8c97a",
            textDecoration: "none",
            transition: "all 0.3s",
          }}
          onMouseOver={e => (e.currentTarget.style.background = "rgba(201,168,76,0.1)")}
          onMouseOut={e => (e.currentTarget.style.background = "transparent")}
        >
          JOIN THE VAULT
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          display: "none",
          background: "none",
          border: "none",
          color: "#e8c97a",
          cursor: "pointer",
        }}
        className="md-hamburger"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          style={{
            position: "absolute",
            top: 68,
            left: 0,
            right: 0,
            background: "rgba(10,13,20,0.98)",
            borderBottom: "1px solid rgba(201,168,76,0.18)",
            padding: "24px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {[...navLinks, { label: "JOIN THE VAULT", to: "/join" }].map((l) => (
            <Link
              key={l.label}
              to={l.to}
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                color: "#8892a4",
                textDecoration: "none",
              }}
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .md-hamburger { display: block !important; }
          nav > div.hidden { display: none !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
