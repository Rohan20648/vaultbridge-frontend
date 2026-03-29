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
    const t = setTimeout(() => setHidden(true), 2000);
    timerRefs.current.push(t);
  }, []);

  useEffect(() => {
    const t0 = setTimeout(() => setPhase("spin"),   120);
    const t1 = setTimeout(() => setPhase("unlock"), 2800);
    const t2 = setTimeout(() => setPhase("open"),   4200);
    const t3 = setTimeout(() => dismiss(),          6400);
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
        background: "linear-gradient(160deg, #1a1a1a 0%, #0d0d0d 100%)",
        opacity: isOpen ? 0 : 1,
        transition: isOpen
          ? "opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1)"
          : "none",
        pointerEvents: isOpen ? "none" : "all",
      }}
    >
      <style>{`
        @keyframes spinRing1    { from{transform:rotate(0deg)}   to{transform:rotate(-360deg)} }
        @keyframes spinRing2    { from{transform:rotate(0deg)}   to{transform:rotate(360deg)}  }
        @keyframes spinRing3    { from{transform:rotate(0deg)}   to{transform:rotate(-360deg)} }
        @keyframes shimmerSweep { from{stroke-dashoffset:0}      to{stroke-dashoffset:-200}    }
        @keyframes steelPulse   { 0%,100%{opacity:.06} 50%{opacity:.22} }
        @keyframes doorSwing    {
          0%   { transform: perspective(1200px) rotateY(0deg); }
          60%  { transform: perspective(1200px) rotateY(-78deg); }
          75%  { transform: perspective(1200px) rotateY(-81deg); }
          100% { transform: perspective(1200px) rotateY(-85deg); }
        }
        @keyframes beamFade     { 0%{opacity:0} 30%{opacity:1} 100%{opacity:1} }
        @keyframes boltRetract  { from{transform:translateX(0)} to{transform:translateX(16px)} }
        @keyframes fadeSlideIn  { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes handlePop    { 0%{transform:scale(1)} 50%{transform:scale(1.12)} 100%{transform:scale(1)} }
        @keyframes bloomIn      { from{opacity:0} to{opacity:1} }
        @keyframes statusFade   { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

        .r1,.r2,.r3 { transform-origin: 160px 160px; }
        .ind        { transform-origin: 160px 160px; }
        .sw         { animation: shimmerSweep 2.6s linear infinite; }

        .phase-spin .r1  { animation: spinRing1 3.4s cubic-bezier(.4,0,.6,1) infinite; }
        .phase-spin .r2  { animation: spinRing2 2.5s cubic-bezier(.4,0,.6,1) infinite; }
        .phase-spin .r3  { animation: spinRing3 4.2s cubic-bezier(.4,0,.6,1) infinite; }
        .phase-spin .ind { animation: spinRing2 1.1s ease-in-out infinite; }
        .phase-spin #va  { animation: steelPulse 1.8s ease-in-out infinite; }

        .phase-unlock .r1  { animation: spinRing1 0.22s cubic-bezier(.4,0,.2,1) 6 forwards; }
        .phase-unlock .r2  { animation: spinRing2 0.22s cubic-bezier(.4,0,.2,1) 6 forwards; }
        .phase-unlock .r3  { animation: spinRing3 0.22s cubic-bezier(.4,0,.2,1) 6 forwards; }
        .phase-unlock .ind { animation: spinRing2 0.22s cubic-bezier(.4,0,.2,1) 6 forwards; }
        .phase-unlock #vbt { animation: boltRetract 0.45s cubic-bezier(.22,1,.36,1) 1.0s  forwards; }
        .phase-unlock #vbb { animation: boltRetract 0.45s cubic-bezier(.22,1,.36,1) 1.15s forwards; }
        .phase-unlock #vhp { animation: handlePop   0.5s  cubic-bezier(.34,1.56,.64,1) 0.7s forwards; }

        .phase-open #vdoor,
        .phase-reveal #vdoor,
        .phase-done #vdoor {
          animation: doorSwing 2.0s cubic-bezier(.16,1,.3,1) forwards;
          transform-origin: 62px 160px;
        }
        .phase-open #vbeam,
        .phase-reveal #vbeam,
        .phase-done #vbeam  { animation: beamFade 2.0s ease forwards; }
        .phase-open #votag,
        .phase-reveal #votag,
        .phase-done #votag  { animation: fadeSlideIn 0.8s cubic-bezier(.22,1,.36,1) 1.5s both; }

        .vault-status { animation: statusFade 0.35s ease forwards; }
      `}</style>

      <button
        onClick={dismiss}
        className="absolute top-6 right-6 text-sm px-4 py-2 rounded-lg z-10 transition-all duration-200 hover:scale-105"
        style={{
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.4)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        Skip
      </button>

      {isOpen && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 58% 50%, rgba(210,210,200,0.12) 0%, transparent 55%)",
            animation: "bloomIn 1.4s ease-out forwards",
          }}
        />
      )}

      <svg
        className={`phase-${phase}`}
        width="320"
        height="320"
        viewBox="0 0 320 320"
        style={{
          overflow: "visible",
          filter: "drop-shadow(0 8px 40px rgba(0,0,0,0.9))",
          transform: isOpen ? "scale(1.04)" : "scale(1)",
          transition: "transform 2.0s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <defs>
          <linearGradient id="doorFace" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#4a4a4a"/>
            <stop offset="8%"   stopColor="#7a7a7a"/>
            <stop offset="16%"  stopColor="#5a5a5a"/>
            <stop offset="28%"  stopColor="#909090"/>
            <stop offset="40%"  stopColor="#606060"/>
            <stop offset="55%"  stopColor="#aaaaaa"/>
            <stop offset="66%"  stopColor="#707070"/>
            <stop offset="78%"  stopColor="#939393"/>
            <stop offset="90%"  stopColor="#585858"/>
            <stop offset="100%" stopColor="#3d3d3d"/>
          </linearGradient>
          <linearGradient id="edgeBevel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#d0d0d0"/>
            <stop offset="50%"  stopColor="#5a5a5a"/>
            <stop offset="100%" stopColor="#888"/>
          </linearGradient>
          <linearGradient id="ringSteel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#999"/>
            <stop offset="50%"  stopColor="#555"/>
            <stop offset="100%" stopColor="#aaa"/>
          </linearGradient>
          <linearGradient id="boltSteel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#c0c0c0"/>
            <stop offset="50%"  stopColor="#707070"/>
            <stop offset="100%" stopColor="#aaa"/>
          </linearGradient>
          <linearGradient id="hingeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#bbb"/>
            <stop offset="50%"  stopColor="#555"/>
            <stop offset="100%" stopColor="#999"/>
          </linearGradient>
          <radialGradient id="dialSteel" cx="38%" cy="32%" r="68%">
            <stop offset="0%"   stopColor="#c8c8c8"/>
            <stop offset="40%"  stopColor="#888"/>
            <stop offset="100%" stopColor="#3a3a3a"/>
          </radialGradient>
          <radialGradient id="dotGrad" cx="35%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="#e0e0e0"/>
            <stop offset="100%" stopColor="#888"/>
          </radialGradient>
          <radialGradient id="ambGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#999" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#999" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="vbeamGrad" cx="15%" cy="50%" r="85%">
            <stop offset="0%"   stopColor="#e8e8e0" stopOpacity="0.85"/>
            <stop offset="55%"  stopColor="#c0bfb0" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#888"    stopOpacity="0"/>
          </radialGradient>
          <filter id="vgf"><feGaussianBlur stdDeviation="12"/></filter>
        </defs>

        {/* Ambient glow */}
        <circle id="va" cx="160" cy="160" r="134" fill="url(#ambGrad)" filter="url(#vgf)" opacity="0.06"/>

        {/* Light beam */}
        <polygon id="vbeam" points="258,55 322,15 322,305 258,245" fill="url(#vbeamGrad)" filter="url(#vgf)" opacity="0"/>

        <g id="vdoor">
          {/* Door shadow */}
          <rect x="63" y="53" width="198" height="218" rx="14" fill="#111" opacity="0.7"/>
          {/* Door body — brushed steel */}
          <rect x="60" y="50" width="198" height="218" rx="14" fill="url(#doorFace)" stroke="url(#edgeBevel)" strokeWidth="2"/>
          {/* Specular highlights */}
          <rect x="72" y="52" width="160" height="6" rx="3" fill="#fff" opacity="0.12"/>
          <rect x="61" y="62" width="5"   height="180" rx="2" fill="#fff" opacity="0.1"/>
          {/* Recessed panel */}
          <rect x="74" y="64" width="170" height="190" rx="10" fill="#3a3a3a" stroke="#252525" strokeWidth="1"/>
          <rect x="76" y="66" width="166" height="186" rx="9"  fill="none"    stroke="#666"    strokeWidth="0.5" opacity="0.6"/>
          <rect x="76" y="66" width="80"  height="3"   rx="1.5" fill="#fff"   opacity="0.07"/>

          {/* Side bolts */}
          <g id="vbt">
            <rect x="238" y="90"  width="22" height="10" rx="5" fill="url(#boltSteel)" stroke="#333" strokeWidth="0.5"/>
            <rect x="240" y="92"  width="6"  height="6"  rx="3" fill="#ddd" opacity="0.5"/>
            <rect x="244" y="93"  width="12" height="4"  rx="2" fill="#555"/>
          </g>
          <g id="vbb">
            <rect x="238" y="218" width="22" height="10" rx="5" fill="url(#boltSteel)" stroke="#333" strokeWidth="0.5"/>
            <rect x="240" y="220" width="6"  height="6"  rx="3" fill="#ddd" opacity="0.5"/>
            <rect x="244" y="221" width="12" height="4"  rx="2" fill="#555"/>
          </g>

          {/* Hinges */}
          <rect x="58" y="85"  width="10" height="26" rx="3" fill="url(#hingeGrad)" stroke="#222" strokeWidth="0.8"/>
          <circle cx="63" cy="91"  r="2.5" fill="#222" stroke="#888" strokeWidth="0.5"/>
          <circle cx="63" cy="105" r="2.5" fill="#222" stroke="#888" strokeWidth="0.5"/>
          <rect x="58" y="208" width="10" height="26" rx="3" fill="url(#hingeGrad)" stroke="#222" strokeWidth="0.8"/>
          <circle cx="63" cy="214" r="2.5" fill="#222" stroke="#888" strokeWidth="0.5"/>
          <circle cx="63" cy="228" r="2.5" fill="#222" stroke="#888" strokeWidth="0.5"/>

          {/* Outer ring */}
          <g className="r3">
            <circle cx="160" cy="160" r="84" fill="none" stroke="url(#ringSteel)" strokeWidth="7"/>
            <circle cx="160" cy="160" r="84" fill="none" stroke="#222" strokeWidth="0.5" opacity="0.8"/>
            <circle cx="160" cy="160" r="81" fill="none" stroke="#ccc" strokeWidth="0.4" opacity="0.15"/>
            {[0,90,180,270].map(a => (
              <line key={a} x1="160" y1="76" x2="160" y2="88" stroke="#bbb" strokeWidth="1.5" opacity="0.7" transform={`rotate(${a} 160 160)`}/>
            ))}
            {[30,60,120,150,210,240,300,330].map(a => (
              <line key={a} x1="160" y1="76" x2="160" y2="83" stroke="#888" strokeWidth="0.8" opacity="0.5" transform={`rotate(${a} 160 160)`}/>
            ))}
            <circle cx="160" cy="160" r="84" fill="none" stroke="#e8e8e8" strokeWidth="3" strokeDasharray="30 500" className="sw" opacity="0.35"/>
          </g>

          {/* Mid ring */}
          <g className="r2">
            <circle cx="160" cy="160" r="64" fill="none" stroke="url(#ringSteel)" strokeWidth="5"/>
            <circle cx="160" cy="160" r="64" fill="none" stroke="#111" strokeWidth="0.5"/>
            <circle cx="160" cy="160" r="62" fill="none" stroke="#bbb" strokeWidth="0.3" opacity="0.2"/>
            {[0,45,90,135,180,225,270,315].map(a => (
              <line key={a} x1="160" y1="96" x2="160" y2="104" stroke="#999" strokeWidth="1" opacity="0.55" transform={`rotate(${a} 160 160)`}/>
            ))}
            <circle cx="160" cy="160" r="64" fill="none" stroke="#d0d0c8" strokeWidth="2" strokeDasharray="20 400" className="sw" opacity="0.3" style={{ animationDelay: "-1.1s" }}/>
          </g>

          {/* Inner ring */}
          <g className="r1">
            <circle cx="160" cy="160" r="46" fill="none" stroke="url(#ringSteel)" strokeWidth="4"/>
            <circle cx="160" cy="160" r="46" fill="none" stroke="#111" strokeWidth="0.5"/>
            {[0,60,120,180,240,300].map(a => (
              <line key={a} x1="160" y1="114" x2="160" y2="120" stroke="#999" strokeWidth="1" opacity="0.5" transform={`rotate(${a} 160 160)`}/>
            ))}
          </g>

          {/* Dark channels between rings */}
          <circle cx="160" cy="160" r="88" fill="none" stroke="#111" strokeWidth="4"/>
          <circle cx="160" cy="160" r="68" fill="none" stroke="#111" strokeWidth="3"/>
          <circle cx="160" cy="160" r="50" fill="none" stroke="#111" strokeWidth="3"/>

          {/* Dial face */}
          <circle cx="160" cy="160" r="33" fill="url(#dialSteel)" stroke="#222" strokeWidth="1.5"/>
          <circle cx="160" cy="160" r="30" fill="none" stroke="#fff" strokeWidth="0.3" opacity="0.08"/>
          <circle cx="160" cy="160" r="26" fill="none" stroke="#fff" strokeWidth="0.3" opacity="0.06"/>
          <circle cx="160" cy="160" r="22" fill="none" stroke="#fff" strokeWidth="0.3" opacity="0.06"/>
          <path d="M 135 140 A 33 33 0 0 1 185 140" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.18" strokeLinecap="round"/>

          {/* Handle + indicator */}
          <g id="vhp">
            <g className="ind">
              <line x1="160" y1="140" x2="160" y2="180" stroke="#bbb" strokeWidth="3" strokeLinecap="round"/>
              <line x1="140" y1="160" x2="180" y2="160" stroke="#bbb" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="160" cy="160" r="9" fill="url(#dialSteel)" stroke="#333" strokeWidth="1.2"/>
              <circle cx="160" cy="160" r="4" fill="url(#dotGrad)"/>
              <circle cx="160" cy="131" r="3.5" fill="url(#dotGrad)" stroke="#333" strokeWidth="0.8"/>
            </g>
          </g>

          {/* Corner rivets */}
          {([[ 78,68],[240,68],[ 78,250],[240,250]] as [number,number][]).map(([x,y]) => (
            <g key={`${x}${y}`}>
              <circle cx={x}   cy={y}   r="4"   fill="url(#boltSteel)" stroke="#222" strokeWidth="0.6"/>
              <circle cx={x-2} cy={y-2} r="1.2" fill="#ddd" opacity="0.6"/>
            </g>
          ))}

          <text x="160" y="228" textAnchor="middle" fontFamily="Inter, sans-serif"
            fontSize="8.5" fontWeight="600" letterSpacing="0.25em" fill="#888" opacity="0.7">
            VAULT BRIDGE
          </text>
        </g>

        {/* Open tag */}
        <g id="votag" opacity="0">
          <circle cx="292" cy="160" r="24" fill="#888" opacity="0.12" stroke="#aaa" strokeWidth="0.5"/>
          <text x="292" y="156" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="16" fill="#ccc" opacity="0.9">↑</text>
          <text x="292" y="173" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="7.5" fontWeight="600" letterSpacing="0.14em" fill="#999">OPEN</text>
        </g>
      </svg>

      <p
        key={phase}
        className="mt-6 text-xs tracking-widest uppercase vault-status"
        style={{ color: "#555", minHeight: "1rem" }}
      >
        {statusMap[phase]}
      </p>
    </div>
  );
};

export default VaultAnimation;
