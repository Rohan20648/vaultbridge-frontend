import { Link } from "react-router-dom";
import { Rocket, Briefcase, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroBackground from "@/components/HeroBackground";

const tiles = [
  {
    icon: Rocket,
    label: "Startup Founder",
    desc: "Submit your venture and connect with investors who believe in your vision.",
    to: "/onboarding/founder",
    tag: "01",
  },
  {
    icon: Briefcase,
    label: "Investor",
    desc: "Discover promising startups and close deals that define the next decade.",
    to: "/onboarding/investor",
    tag: "02",
  },
  {
    icon: Eye,
    label: "Browse as Viewer",
    desc: "Explore the startup and investor directory without committing.",
    to: "/explore",
    tag: "03",
  },
];

const JoinPage = () => (
  <>
    <Navbar />

    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#0a0d14",
        color: "#f0ece2",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <HeroBackground opacity={0.55} />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 980,
          padding: "120px 40px 80px",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.2em",
              color: "#c9a84c",
              marginBottom: 20,
            }}
          >
            — SELECT YOUR ROLE —
          </div>
          <h1
            style={{
              fontSize: "clamp(40px, 5vw, 64px)",
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              marginBottom: 16,
            }}
          >
            How do you want to<br />
            <em style={{ color: "#e8c97a", fontStyle: "italic" }}>join the Vault?</em>
          </h1>
          <div style={{ width: 48, height: 1, background: "#c9a84c", margin: "0 auto" }} />
        </div>

        {/* Tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            background: "rgba(201,168,76,0.18)",
          }}
        >
          {tiles.map(({ icon: Icon, label, desc, to, tag }) => (
            <Link
              key={label}
              to={to}
              style={{
                background: "#0f1420",
                padding: "48px 40px",
                textDecoration: "none",
                color: "inherit",
                display: "block",
                transition: "background 0.3s",
                cursor: "pointer",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "#161c2d")}
              onMouseOut={e => (e.currentTarget.style.background = "#0f1420")}
            >
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  color: "#c9a84c",
                  marginBottom: 28,
                }}
              >
                {tag}
              </div>

              <div
                style={{
                  width: 44,
                  height: 44,
                  border: "1px solid rgba(201,168,76,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 28,
                  color: "#c9a84c",
                }}
              >
                <Icon size={20} />
              </div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                  marginBottom: 12,
                  color: "#f0ece2",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 300,
                  color: "#8892a4",
                  lineHeight: 1.75,
                  marginBottom: 36,
                }}
              >
                {desc}
              </div>

              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  color: "#c9a84c",
                  borderTop: "1px solid rgba(201,168,76,0.18)",
                  paddingTop: 20,
                }}
              >
                ENTER →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default JoinPage;
