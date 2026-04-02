import { useEffect, useRef, useState, useCallback } from "react";

type Phase = "idle" | "spin" | "unlock" | "open" | "reveal" | "done";

const VaultAnimation = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [hidden, setHidden] = useState(false);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  };

  const dismiss = useCallback(() => {
    clearTimers();
    setPhase("open");
    const t = setTimeout(() => setHidden(true), 2200);
    timerRefs.current.push(t);
  }, []);

  useEffect(() => {
    const t0 = setTimeout(() => setPhase("spin"),   120);
    const t1 = setTimeout(() => setPhase("unlock"), 2800);
    const t2 = setTimeout(() => setPhase("open"),   4200);
    const t3 = setTimeout(() => dismiss(),          6600);
    timerRefs.current = [t0, t1, t2, t3];
    return () => clearTimers();
  }, [dismiss]);

  if (hidden) return null;

  const isOpen = phase === "open" || phase === "reveal" || phase === "done";

  const statusMap: Record<Phase, string> = {
    idle:   "– locked –",
    spin:   "engaging tumblers",
    unlock: "combination matched ✓",
    open:   "vault open",
    reveal: "vault open",
    done:   "vault open",
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        zIndex: 9999,
        background: "radial-gradient(ellipse at 50% 40%, #1c1c1c 0%, #080808 70%)",
        opacity: isOpen ? 0 : 1,
        transition: isOpen
          ? "opacity 2.0s cubic-bezier(0.4, 0, 0.2, 1)"
          : "none",
        pointerEvents: isOpen ? "none" : "all",
      }}
    >
      <style>{`
        @keyframes spinDial1   { from{transform:rotate(0deg)}   to{transform:rotate(-360deg)} }
        @keyframes spinDial2   { from{transform:rotate(0deg)}   to{transform:rotate(360deg)}  }
        @keyframes spinDial3   { from{transform:rotate(0deg)}   to{transform:rotate(-360deg)} }
        @keyframes shimmer     { from{stroke-dashoffset:0}      to{stroke-dashoffset:-260}    }
        @keyframes steelGlow   { 0%,100%{opacity:.04} 50%{opacity:.18} }
        @keyframes doorSwing3D {
          0%   { transform: perspective(900px) rotateY(0deg); }
          60%  { transform: perspective(900px) rotateY(-82deg); }
          75%  { transform: perspective(900px) rotateY(-85deg); }
          100% { transform: perspective(900px) rotateY(-88deg); }
        }
        @keyframes boltSlide   { from{transform:translateX(0)} to{transform:translateX(20px)} }
        @keyframes boltSlideUp { from{transform:translateY(0)} to{transform:translateY(-18px)} }
        @keyframes boltSlideDown { from{transform:translateY(0)} to{transform:translateY(18px)} }
        @keyframes beamFade    { 0%{opacity:0} 25%{opacity:1} 100%{opacity:1} }
        @keyframes handleClick { 0%{transform:rotate(0deg)} 30%{transform:rotate(-32deg)} 100%{transform:rotate(-32deg)} }
        @keyframes glowPulse   { 0%,100%{opacity:0} 50%{opacity:1} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
        @keyframes bloomIn     { from{opacity:0} to{opacity:1} }
        @keyframes statusFade  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floorShadow { 0%,100%{opacity:.15} 50%{opacity:.35} }
        @keyframes numberFlick { 0%{opacity:0} 50%{opacity:1} 100%{opacity:0} }
        @keyframes lockGreen   { from{opacity:0} to{opacity:1} }

        .dial-r1,.dial-r2,.dial-r3 { transform-origin: 220px 190px; }
        .sw { animation: shimmer 2.8s linear infinite; }

        .phase-spin .dial-r1  { animation: spinDial1 3.2s cubic-bezier(.4,0,.6,1) infinite; }
        .phase-spin .dial-r2  { animation: spinDial2 2.3s cubic-bezier(.4,0,.6,1) infinite; }
        .phase-spin .dial-r3  { animation: spinDial3 4.0s cubic-bezier(.4,0,.6,1) infinite; }
        .phase-spin #vglow    { animation: steelGlow 1.6s ease-in-out infinite; }

        .phase-unlock .dial-r1 { animation: spinDial1 0.18s linear 8 forwards; }
        .phase-unlock .dial-r2 { animation: spinDial2 0.18s linear 8 forwards; }
        .phase-unlock .dial-r3 { animation: spinDial3 0.18s linear 8 forwards; }
        .phase-unlock #vbolt-r { animation: boltSlide     0.5s cubic-bezier(.22,1,.36,1) 1.0s forwards; }
        .phase-unlock #vbolt-t { animation: boltSlideUp   0.5s cubic-bezier(.22,1,.36,1) 1.1s forwards; }
        .phase-unlock #vbolt-b { animation: boltSlideDown 0.5s cubic-bezier(.22,1,.36,1) 1.2s forwards; }
        .phase-unlock #vhandle { animation: handleClick   0.9s cubic-bezier(.34,1.56,.64,1) 0.8s forwards; transform-origin: 220px 190px; }
        .phase-unlock #vlock-light { animation: lockGreen 0.4s ease 1.3s both; }

        .phase-open #vdoor,
        .phase-reveal #vdoor,
        .phase-done #vdoor {
          animation: doorSwing3D 2.2s cubic-bezier(.16,1,.3,1) forwards;
          transform-origin: 80px 190px;
        }
        .phase-open #vbeam,
        .phase-reveal #vbeam,
        .phase-done #vbeam  { animation: beamFade 2.0s ease forwards; }
        .phase-open #votag,
        .phase-reveal #votag,
        .phase-done #votag  { animation: fadeSlideIn 0.9s cubic-bezier(.22,1,.36,1) 1.6s both; }

        .vault-status { animation: statusFade 0.35s ease forwards; }
      `}</style>

      <button
        onClick={dismiss}
        className="absolute top-6 right-6 text-sm px-4 py-2 rounded-lg z-10 transition-all duration-200 hover:scale-105"
        style={{
          background: "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.35)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        Skip
      </button>

      {isOpen && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 62% 50%, rgba(200,195,180,0.14) 0%, transparent 55%)",
            animation: "bloomIn 1.6s ease-out forwards",
          }}
        />
      )}

      <svg
        className={`phase-${phase}`}
        width="440"
        height="360"
        viewBox="0 0 440 360"
        style={{
          overflow: "visible",
          filter: "drop-shadow(0 16px 60px rgba(0,0,0,0.95))",
          transform: isOpen ? "scale(1.05)" : "scale(1)",
          transition: "transform 2.2s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <defs>
          {/* Vault body steel - main face */}
          <linearGradient id="bodyFace" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#2a2a2a"/>
            <stop offset="10%"  stopColor="#484848"/>
            <stop offset="22%"  stopColor="#323232"/>
            <stop offset="38%"  stopColor="#5a5a5a"/>
            <stop offset="52%"  stopColor="#3e3e3e"/>
            <stop offset="65%"  stopColor="#686868"/>
            <stop offset="78%"  stopColor="#4a4a4a"/>
            <stop offset="90%"  stopColor="#585858"/>
            <stop offset="100%" stopColor="#222"/>
          </linearGradient>

          {/* Vault body - top bevel */}
          <linearGradient id="topBevel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#888"/>
            <stop offset="40%"  stopColor="#3a3a3a"/>
            <stop offset="100%" stopColor="#1a1a1a"/>
          </linearGradient>

          {/* Vault body - right side depth */}
          <linearGradient id="sideDepth" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#3a3a3a"/>
            <stop offset="40%"  stopColor="#222"/>
            <stop offset="100%" stopColor="#111"/>
          </linearGradient>

          {/* Vault body - bottom */}
          <linearGradient id="bottomBevel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#1a1a1a"/>
            <stop offset="100%" stopColor="#080808"/>
          </linearGradient>

          {/* Door face - heavy brushed steel */}
          <linearGradient id="doorFace" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#3c3c3c"/>
            <stop offset="6%"   stopColor="#6a6a6a"/>
            <stop offset="14%"  stopColor="#484848"/>
            <stop offset="25%"  stopColor="#828282"/>
            <stop offset="38%"  stopColor="#565656"/>
            <stop offset="50%"  stopColor="#9e9e9e"/>
            <stop offset="62%"  stopColor="#686868"/>
            <stop offset="74%"  stopColor="#888"/>
            <stop offset="86%"  stopColor="#525252"/>
            <stop offset="100%" stopColor="#2e2e2e"/>
          </linearGradient>

          {/* Door edge bevel */}
          <linearGradient id="doorEdge" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#ccc"/>
            <stop offset="30%"  stopColor="#666"/>
            <stop offset="70%"  stopColor="#444"/>
            <stop offset="100%" stopColor="#999"/>
          </linearGradient>

          {/* Ring steel */}
          <linearGradient id="ringSteel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#b0b0b0"/>
            <stop offset="35%"  stopColor="#585858"/>
            <stop offset="70%"  stopColor="#909090"/>
            <stop offset="100%" stopColor="#c0c0c0"/>
          </linearGradient>

          {/* Dial center */}
          <radialGradient id="dialFace" cx="35%" cy="28%" r="70%">
            <stop offset="0%"   stopColor="#d0d0d0"/>
            <stop offset="35%"  stopColor="#888"/>
            <stop offset="100%" stopColor="#2a2a2a"/>
          </radialGradient>

          {/* Handle */}
          <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#c8c8c8"/>
            <stop offset="40%"  stopColor="#707070"/>
            <stop offset="100%" stopColor="#aaa"/>
          </linearGradient>

          {/* Bolt steel */}
          <linearGradient id="boltSteel" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#c8c8c8"/>
            <stop offset="50%"  stopColor="#707070"/>
            <stop offset="100%" stopColor="#a0a0a0"/>
          </linearGradient>

          {/* Hinge */}
          <linearGradient id="hingeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#bbb"/>
            <stop offset="50%"  stopColor="#444"/>
            <stop offset="100%" stopColor="#999"/>
          </linearGradient>

          {/* Interior glow when open */}
          <radialGradient id="interiorGlow" cx="0%" cy="50%" r="100%">
            <stop offset="0%"   stopColor="#c8c4a8" stopOpacity="0.9"/>
            <stop offset="50%"  stopColor="#9a9280" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#555"    stopOpacity="0"/>
          </radialGradient>

          {/* Ambient */}
          <radialGradient id="ambGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#888" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#888" stopOpacity="0"/>
          </radialGradient>

          {/* Floor shadow */}
          <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0"/>
          </radialGradient>

          {/* Lock indicator glow */}
          <radialGradient id="lockGreen" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#00ff88" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#00aa55" stopOpacity="0.2"/>
          </radialGradient>

          <filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>
          <filter id="blur4"><feGaussianBlur stdDeviation="4"/></filter>
          <filter id="blur16"><feGaussianBlur stdDeviation="16"/></filter>
        </defs>

        {/* Floor shadow ellipse */}
        <ellipse cx="220" cy="332" rx="145" ry="14"
          fill="url(#floorShadow)" filter="url(#blur8)" opacity="0.55"
          style={{animation: "floorShadow 3s ease-in-out infinite"}}
        />

        {/* VAULT BODY (3D box structure) */}
        {/* Right side panel - gives depth illusion */}
        <polygon points="356,64 392,82 392,298 356,314"
          fill="url(#sideDepth)" opacity="0.9"/>
        {/* Top panel */}
        <polygon points="76,64 356,64 392,82 112,82"
          fill="url(#topBevel)" opacity="0.9"/>
        {/* Bottom panel */}
        <polygon points="76,314 356,314 392,298 112,298"
          fill="url(#bottomBevel)" opacity="0.9"/>

        {/* Main vault body face */}
        <rect x="76" y="64" width="280" height="250" rx="6"
          fill="url(#bodyFace)" stroke="#1a1a1a" strokeWidth="1.5"/>

        {/* Body surface detail — horizontal brushing lines */}
        {[0,14,28,42,56,70,84,98,112,126,140,154,168,182,196,210,224,238].map((y, i) => (
          <line key={i} x1="78" y1={66+y} x2="354" y2={66+y}
            stroke="#fff" strokeWidth="0.4" opacity="0.03"/>
        ))}

        {/* Body frame / border bevel */}
        <rect x="76" y="64" width="280" height="250" rx="6"
          fill="none" stroke="url(#doorEdge)" strokeWidth="2.5"/>
        {/* Inner frame highlight */}
        <rect x="80" y="68" width="272" height="242" rx="4"
          fill="none" stroke="#888" strokeWidth="0.5" opacity="0.1"/>

        {/* Vault brand text on body */}
        <text x="316" y="205" textAnchor="middle"
          fontFamily="'Georgia', serif" fontSize="7" fontWeight="700"
          letterSpacing="0.3em" fill="#555" opacity="0.6"
          transform="rotate(90, 316, 190)">VAULT BRIDGE</text>

        {/* Interior - visible when door swings */}
        <polygon id="vbeam"
          points="360,70 440,50 440,330 360,310"
          fill="url(#interiorGlow)" filter="url(#blur16)" opacity="0"/>

        {/* Interior dark cavity */}
        <rect x="78" y="66" width="276" height="246" rx="5"
          fill="#111" opacity="0.6"/>

        {/* Interior shelves (visible through door) */}
        <rect x="90" y="130" width="255" height="3" rx="1.5"
          fill="#2a2a2a" opacity="0.8"/>
        <rect x="90" y="200" width="255" height="3" rx="1.5"
          fill="#2a2a2a" opacity="0.8"/>
        <rect x="90" y="260" width="255" height="3" rx="1.5"
          fill="#2a2a2a" opacity="0.8"/>

        {/* Ambient glow center */}
        <circle id="vglow" cx="220" cy="190" r="160"
          fill="url(#ambGrad)" filter="url(#blur16)" opacity="0.04"/>

        {/* ━━━━━━ VAULT DOOR ━━━━━━ */}
        <g id="vdoor">

          {/* Door shadow behind */}
          <rect x="82" y="67" width="276" height="246" rx="5"
            fill="#000" opacity="0.5"/>

          {/* DOOR MAIN BODY */}
          <rect x="80" y="65" width="276" height="248" rx="5"
            fill="url(#doorFace)" stroke="url(#doorEdge)" strokeWidth="3"/>

          {/* Door specular sweep top */}
          <rect x="82" y="66" width="210" height="5" rx="2.5"
            fill="#fff" opacity="0.08"/>
          {/* Door specular sweep left edge */}
          <rect x="82" y="72" width="4" height="220" rx="2"
            fill="#fff" opacity="0.07"/>

          {/* DOOR RECESSED PANEL */}
          <rect x="96" y="82" width="242" height="214" rx="8"
            fill="#2c2c2c" stroke="#1a1a1a" strokeWidth="1.5"/>
          {/* Panel inner bevel highlight */}
          <rect x="98" y="84" width="238" height="210" rx="7"
            fill="none" stroke="#666" strokeWidth="0.6" opacity="0.4"/>
          <rect x="98" y="84" width="130" height="3" rx="1.5"
            fill="#fff" opacity="0.05"/>

          {/* DOOR BOLTS — right side, top, bottom */}
          {/* Right bolt */}
          <g id="vbolt-r">
            <rect x="352" y="140" width="28" height="14" rx="7"
              fill="url(#boltSteel)" stroke="#222" strokeWidth="1"/>
            <rect x="355" y="143" width="8" height="8" rx="4"
              fill="#ddd" opacity="0.45"/>
            <rect x="361" y="144" width="16" height="6" rx="3"
              fill="#555"/>
            <rect x="352" y="195" width="28" height="14" rx="7"
              fill="url(#boltSteel)" stroke="#222" strokeWidth="1"/>
            <rect x="355" y="198" width="8" height="8" rx="4"
              fill="#ddd" opacity="0.45"/>
            <rect x="361" y="199" width="16" height="6" rx="3"
              fill="#555"/>
            <rect x="352" y="250" width="28" height="14" rx="7"
              fill="url(#boltSteel)" stroke="#222" strokeWidth="1"/>
            <rect x="355" y="253" width="8" height="8" rx="4"
              fill="#ddd" opacity="0.45"/>
            <rect x="361" y="254" width="16" height="6" rx="3"
              fill="#555"/>
          </g>
          {/* Top bolt */}
          <g id="vbolt-t">
            <rect x="160" y="47" width="14" height="24" rx="7"
              fill="url(#boltSteel)" stroke="#222" strokeWidth="1"
              style={{transform: "rotate(90deg)", transformOrigin: "167px 59px"}}/>
            <rect x="200" y="47" width="14" height="24" rx="7"
              fill="url(#boltSteel)" stroke="#222" strokeWidth="1"
              style={{transform: "rotate(90deg)", transformOrigin: "207px 59px"}}/>
            <rect x="240" y="47" width="14" height="24" rx="7"
              fill="url(#boltSteel)" stroke="#222" strokeWidth="1"
              style={{transform: "rotate(90deg)", transformOrigin: "247px 59px"}}/>
          </g>
          {/* Bottom bolt */}
          <g id="vbolt-b">
            <rect x="160" y="309" width="14" height="24" rx="7"
              fill="url(#boltSteel)" stroke="#222" strokeWidth="1"
              style={{transform: "rotate(90deg)", transformOrigin: "167px 321px"}}/>
            <rect x="200" y="309" width="14" height="24" rx="7"
              fill="url(#boltSteel)" stroke="#222" strokeWidth="1"
              style={{transform: "rotate(90deg)", transformOrigin: "207px 321px"}}/>
            <rect x="240" y="309" width="14" height="24" rx="7"
              fill="url(#boltSteel)" stroke="#222" strokeWidth="1"
              style={{transform: "rotate(90deg)", transformOrigin: "247px 321px"}}/>
          </g>

          {/* HINGES — left edge, 3 hinges */}
          {[95, 175, 255].map((y, i) => (
            <g key={i}>
              <rect x="76" y={y} width="12" height="32" rx="4"
                fill="url(#hingeGrad)" stroke="#111" strokeWidth="1"/>
              <circle cx="82" cy={y+8}  r="3.5" fill="#111" stroke="#777" strokeWidth="0.6"/>
              <circle cx="82" cy={y+16} r="3.5" fill="#111" stroke="#777" strokeWidth="0.6"/>
              <circle cx="82" cy={y+24} r="3.5" fill="#111" stroke="#777" strokeWidth="0.6"/>
            </g>
          ))}

          {/* Corner bolts / rivets */}
          {([[100,88],[334,88],[100,284],[334,284]] as [number,number][]).map(([x,y]) => (
            <g key={`${x}${y}`}>
              <circle cx={x}   cy={y}   r="6"   fill="url(#boltSteel)" stroke="#111" strokeWidth="1"/>
              <circle cx={x-2} cy={y-2} r="2"   fill="#e0e0e0" opacity="0.5"/>
            </g>
          ))}

          {/* ━━━ COMBINATION LOCK DIAL SYSTEM ━━━ */}
          {/* Outer decorative ring */}
          <g className="dial-r3">
            <circle cx="220" cy="190" r="92"
              fill="none" stroke="url(#ringSteel)" strokeWidth="9"/>
            <circle cx="220" cy="190" r="92"
              fill="none" stroke="#0a0a0a" strokeWidth="1" opacity="0.8"/>
            <circle cx="220" cy="190" r="89"
              fill="none" stroke="#ccc" strokeWidth="0.4" opacity="0.12"/>
            {/* Major tick marks */}
            {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => (
              <line key={a} x1="220" y1="98" x2="220" y2="113"
                stroke="#bbb" strokeWidth="2" opacity="0.7"
                transform={`rotate(${a} 220 190)`}/>
            ))}
            {/* Minor tick marks */}
            {Array.from({length: 60}, (_,i) => i*6).filter(a => a%30!==0).map(a => (
              <line key={a} x1="220" y1="98" x2="220" y2="106"
                stroke="#666" strokeWidth="0.8" opacity="0.4"
                transform={`rotate(${a} 220 190)`}/>
            ))}
            {/* Number labels */}
            {[0,10,20,30,40,50,60,70,80,90].map(n => {
              const angle = n * 3.6 - 90;
              const rad = angle * Math.PI / 180;
              const r = 82;
              const x = 220 + r * Math.cos(rad);
              const y = 190 + r * Math.sin(rad);
              return (
                <text key={n} x={x} y={y+2.5}
                  textAnchor="middle" dominantBaseline="middle"
                  fontFamily="monospace" fontSize="6.5" fill="#777" opacity="0.6">
                  {n}
                </text>
              );
            })}
            <circle cx="220" cy="190" r="92"
              fill="none" stroke="#e0e0d8" strokeWidth="4"
              strokeDasharray="40 540" className="sw" opacity="0.25"/>
          </g>

          {/* Mid ring */}
          <g className="dial-r2">
            <circle cx="220" cy="190" r="70"
              fill="none" stroke="url(#ringSteel)" strokeWidth="6"/>
            <circle cx="220" cy="190" r="70"
              fill="none" stroke="#0a0a0a" strokeWidth="1"/>
            {[0,45,90,135,180,225,270,315].map(a => (
              <line key={a} x1="220" y1="120" x2="220" y2="130"
                stroke="#999" strokeWidth="1.5" opacity="0.5"
                transform={`rotate(${a} 220 190)`}/>
            ))}
            <circle cx="220" cy="190" r="70"
              fill="none" stroke="#d0d0c0" strokeWidth="2.5"
              strokeDasharray="28 420" className="sw"
              opacity="0.22" style={{animationDelay: "-1.3s"}}/>
          </g>

          {/* Inner ring */}
          <g className="dial-r1">
            <circle cx="220" cy="190" r="50"
              fill="none" stroke="url(#ringSteel)" strokeWidth="5"/>
            <circle cx="220" cy="190" r="50"
              fill="none" stroke="#0a0a0a" strokeWidth="1"/>
            {[0,60,120,180,240,300].map(a => (
              <line key={a} x1="220" y1="140" x2="220" y2="148"
                stroke="#888" strokeWidth="1.2" opacity="0.45"
                transform={`rotate(${a} 220 190)`}/>
            ))}
          </g>

          {/* Dark ring channels */}
          <circle cx="220" cy="190" r="97"  fill="none" stroke="#0d0d0d" strokeWidth="5"/>
          <circle cx="220" cy="190" r="74"  fill="none" stroke="#0d0d0d" strokeWidth="4"/>
          <circle cx="220" cy="190" r="54"  fill="none" stroke="#0d0d0d" strokeWidth="4"/>

          {/* DIAL FACE */}
          <circle cx="220" cy="190" r="38" fill="url(#dialFace)" stroke="#111" strokeWidth="2"/>
          <circle cx="220" cy="190" r="35" fill="none" stroke="#fff" strokeWidth="0.3" opacity="0.08"/>
          <circle cx="220" cy="190" r="30" fill="none" stroke="#fff" strokeWidth="0.3" opacity="0.06"/>
          <circle cx="220" cy="190" r="25" fill="none" stroke="#fff" strokeWidth="0.3" opacity="0.05"/>
          {/* Specular on dial */}
          <path d="M 193 173 A 38 38 0 0 1 247 173"
            fill="none" stroke="#fff" strokeWidth="2" opacity="0.14" strokeLinecap="round"/>

          {/* Handle arm */}
          <g id="vhandle">
            {/* Crosshairs / pointer */}
            <line x1="220" y1="160" x2="220" y2="222"
              stroke="#c0c0c0" strokeWidth="3.5" strokeLinecap="round"/>
            <line x1="198" y1="190" x2="242" y2="190"
              stroke="#c0c0c0" strokeWidth="3.5" strokeLinecap="round"/>
            {/* Center hub */}
            <circle cx="220" cy="190" r="12" fill="url(#dialFace)" stroke="#222" strokeWidth="2"/>
            <circle cx="220" cy="190" r="5.5" fill="#d0d0d0" stroke="#444" strokeWidth="1"/>
            {/* Pointer dot at top */}
            <circle cx="220" cy="153" r="5" fill="#c8c8c8" stroke="#333" strokeWidth="1"/>
          </g>

          {/* Lock status indicator */}
          <g id="vlock-light" opacity="0">
            <circle cx="220" cy="252" r="6" fill="url(#lockGreen)" filter="url(#blur4)"/>
            <circle cx="220" cy="252" r="3" fill="#00ff88" opacity="0.95"/>
          </g>

          {/* Brand text */}
          <text x="220" y="298" textAnchor="middle"
            fontFamily="'Georgia', 'Times New Roman', serif"
            fontSize="9" fontWeight="700" letterSpacing="0.22em" fill="#666" opacity="0.65">
            VAULT BRIDGE
          </text>
          <line x1="148" y1="303" x2="292" y2="303"
            stroke="#555" strokeWidth="0.5" opacity="0.4"/>

        </g>{/* end #vdoor */}

        {/* Light beam when open */}
        <polygon id="vbeam"
          points="358,70 440,35 440,345 358,310"
          fill="url(#interiorGlow)" filter="url(#blur16)" opacity="0"/>

        {/* Open indicator tag */}
        <g id="votag" opacity="0">
          <circle cx="406" cy="190" r="28" fill="#888" opacity="0.1" stroke="#aaa" strokeWidth="0.5"/>
          <text x="406" y="186" textAnchor="middle" fontFamily="Georgia, serif"
            fontSize="18" fill="#ccc" opacity="0.9">↑</text>
          <text x="406" y="204" textAnchor="middle" fontFamily="monospace"
            fontSize="7.5" fontWeight="700" letterSpacing="0.16em" fill="#888">OPEN</text>
        </g>

      </svg>

      <p
        key={phase}
        className="mt-8 text-xs tracking-widest uppercase vault-status"
        style={{ color: "#4a4a4a", minHeight: "1rem", letterSpacing: "0.3em" }}
      >
        {statusMap[phase]}
      </p>
    </div>
  );
};

export default VaultAnimation;
