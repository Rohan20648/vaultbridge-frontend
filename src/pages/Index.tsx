import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { getStartups, getSharks, getDeals } from "@/lib/api";

// ─── Animated counter hook ───────────────────────────────────────────────────
function useCounter(target: number, decimals = 0, startOnMount = false) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(startOnMount);
  useEffect(() => {
    if (!started || target === 0) return;
    let v = 0;
    const dur = 1800, step = 16, inc = target / (dur / step);
    const id = setInterval(() => {
      v = Math.min(v + inc, target);
      setValue(parseFloat(v.toFixed(decimals)));
      if (v >= target) clearInterval(id);
    }, step);
    return () => clearInterval(id);
  }, [target, started, decimals]);
  return { value, trigger: () => setStarted(true) };
}

// ─── 1. Gold Particle Cursor Trail ───────────────────────────────────────────
function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    const particles: { x: number; y: number; vx: number; vy: number; life: number; size: number }[] = [];
    let mx = -999, my = -999;

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: mx + (Math.random() - 0.5) * 8,
          y: my + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2 - 0.4,
          life: 1.0,
          size: 1.5 + Math.random() * 2.5,
        });
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", onResize);

    let rafId: number;
    const loop = () => {
      rafId = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, W, H);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.03;
        p.life -= 0.032;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        const alpha = p.life * 0.65;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `rgba(232,201,122,${alpha})`);
        grad.addColorStop(0.5, `rgba(201,168,76,${alpha * 0.5})`);
        grad.addColorStop(1, `rgba(201,168,76,0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    };
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9997, mixBlendMode: "screen" }}
    />
  );
}

// ─── 2. Vault Combination Dial Easter Egg ────────────────────────────────────
const CORRECT_COMBO = [24, 8, 16];

function CombinationDial() {
  const [values, setValues] = useState([0, 0, 0]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startValRef = useRef(0);

  const checkCombo = useCallback((vals: number[]) => {
    if (vals[0] === CORRECT_COMBO[0] && vals[1] === CORRECT_COMBO[1] && vals[2] === CORRECT_COMBO[2]) {
      setUnlocked(true);
      setTimeout(() => setShowModal(true), 300);
    }
  }, []);

  const spin = (index: number, delta: number) => {
    setValues(prev => {
      const next = [...prev];
      next[index] = ((next[index] + delta + 40) % 40);
      checkCombo(next);
      return next;
    });
  };

  const onWheelDial = (e: React.WheelEvent, i: number) => {
    e.preventDefault();
    spin(i, e.deltaY > 0 ? 1 : -1);
  };

  const onPointerDown = (e: React.PointerEvent, i: number) => {
    draggingRef.current = true;
    startYRef.current = e.clientY;
    startValRef.current = values[i];
    setActiveIndex(i);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent, i: number) => {
    if (!draggingRef.current || activeIndex !== i) return;
    const diff = Math.round((e.clientY - startYRef.current) / 8);
    setValues(prev => {
      const next = [...prev];
      next[i] = ((startValRef.current + diff + 400) % 40);
      checkCombo(next);
      return next;
    });
  };

  const onPointerUp = () => { draggingRef.current = false; };

  const copyCode = () => {
    navigator.clipboard.writeText("VAULT2024").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      {/* Fixed dial widget */}
      <div
        style={{
          position: "fixed", bottom: 32, right: 32, zIndex: 500,
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8,
        }}
      >
        {expanded && (
          <div
            style={{
              background: "rgba(10,13,20,0.96)", border: `1px solid ${unlocked ? "#e8c97a" : "rgba(201,168,76,0.35)"}`,
              backdropFilter: "blur(24px)", padding: "20px 20px 16px",
              boxShadow: unlocked ? "0 0 32px rgba(201,168,76,0.2)" : "0 8px 40px rgba(0,0,0,0.5)",
              transition: "border-color 0.5s, box-shadow 0.5s",
              minWidth: 220,
            }}
          >
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "#8892a4", marginBottom: 14, textAlign: "center" }}>
              COMBINATION LOCK
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 12 }}>
              {values.map((v, i) => (
                <div
                  key={i}
                  onWheel={e => onWheelDial(e, i)}
                  onPointerDown={e => onPointerDown(e, i)}
                  onPointerMove={e => onPointerMove(e, i)}
                  onPointerUp={onPointerUp}
                  style={{
                    width: 52, height: 64, background: "#0a0d14",
                    border: `1px solid ${activeIndex === i ? "rgba(201,168,76,0.6)" : "rgba(201,168,76,0.2)"}`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    cursor: "ns-resize", userSelect: "none", position: "relative", overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}
                >
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(201,168,76,0.3)", lineHeight: 1 }}>
                    {((v - 1 + 40) % 40).toString().padStart(2, "0")}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, color: "#e8c97a", lineHeight: 1.2 }}>
                    {v.toString().padStart(2, "0")}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(201,168,76,0.3)", lineHeight: 1 }}>
                    {((v + 1) % 40).toString().padStart(2, "0")}
                  </div>
                  <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", height: 28, border: "1px solid rgba(201,168,76,0.15)", pointerEvents: "none" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 1, 2].map(i => (
                <button
                  key={i}
                  onClick={() => { setActiveIndex(i); spin(i, 1); }}
                  style={{
                    flex: 1, height: 28, background: "rgba(201,168,76,0.08)",
                    border: "1px solid rgba(201,168,76,0.2)", color: "#c9a84c",
                    fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = "rgba(201,168,76,0.16)")}
                  onMouseOut={e => (e.currentTarget.style.background = "rgba(201,168,76,0.08)")}
                >↑</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {[0, 1, 2].map(i => (
                <button
                  key={i}
                  onClick={() => { setActiveIndex(i); spin(i, -1); }}
                  style={{
                    flex: 1, height: 28, background: "rgba(201,168,76,0.08)",
                    border: "1px solid rgba(201,168,76,0.2)", color: "#c9a84c",
                    fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = "rgba(201,168,76,0.16)")}
                  onMouseOut={e => (e.currentTarget.style.background = "rgba(201,168,76,0.08)")}
                >↓</button>
              ))}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "#8892a4", textAlign: "center", marginTop: 12, letterSpacing: "0.1em" }}>
              SCROLL OR DRAG DIALS
            </div>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setExpanded(p => !p)}
          style={{
            width: 48, height: 48, borderRadius: "50%",
            background: unlocked ? "rgba(201,168,76,0.18)" : "rgba(10,13,20,0.92)",
            border: `1px solid ${unlocked ? "#e8c97a" : "rgba(201,168,76,0.35)"}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(16px)", transition: "all 0.3s",
            boxShadow: unlocked ? "0 0 20px rgba(201,168,76,0.3)" : "none",
          }}
          title="Combination Lock Easter Egg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={unlocked ? "#e8c97a" : "#8892a4"} strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="3" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="21" />
            <line x1="3" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="21" y2="12" />
          </svg>
        </button>
      </div>

      {/* Unlock modal */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "rgba(5,7,12,0.88)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0a0d14", border: "1px solid #c9a84c",
              padding: "56px 64px", textAlign: "center", maxWidth: 420,
              boxShadow: "0 0 80px rgba(201,168,76,0.2), inset 0 0 40px rgba(201,168,76,0.03)",
              animation: "vb-modal-in 0.5s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔓</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.3em", color: "#c9a84c", marginBottom: 16 }}>
              — ACCESS GRANTED —
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 300, letterSpacing: "-0.01em", marginBottom: 8, color: "#f0ece2" }}>
              VAULT UNLOCKED
            </h3>
            <p style={{ fontSize: 14, color: "#8892a4", lineHeight: 1.8, marginBottom: 32, fontWeight: 300 }}>
              You cracked the combination. Early access is yours.
            </p>
            <div
              style={{
                background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.3)",
                padding: "16px 24px", marginBottom: 24, cursor: "pointer",
                transition: "background 0.2s",
              }}
              onClick={copyCode}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(201,168,76,0.12)")}
              onMouseOut={e => (e.currentTarget.style.background = "rgba(201,168,76,0.07)")}
            >
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, letterSpacing: "0.2em", color: "#e8c97a" }}>
                VAULT2024
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#8892a4", marginTop: 6, letterSpacing: "0.12em" }}>
                {copied ? "COPIED ✓" : "CLICK TO COPY"}
              </div>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#8892a4", letterSpacing: "0.15em", marginBottom: 24 }}>
              USE AT CHECKOUT FOR EARLY ACCESS
            </div>
            <button
              onClick={() => setShowModal(false)}
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em",
                padding: "12px 28px", border: "1px solid rgba(201,168,76,0.3)",
                background: "transparent", color: "#8892a4", cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.color = "#f0ece2"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.color = "#8892a4"; }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── 4. Scroll-reactive gradient mesh background hook ────────────────────────
function useScrollGradient() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

// ─── Hero Three.js background (floating wireframe polyhedra) ─────────────────
function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
    camera.position.set(0, 0, 50);

    const resize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const geos = [
      new THREE.IcosahedronGeometry(1.2, 0),
      new THREE.OctahedronGeometry(1.0, 0),
      new THREE.TetrahedronGeometry(1.1, 0),
    ];
    const shapes: { mesh: THREE.Mesh; rx: number; ry: number; vx: number; vy: number }[] = [];

    for (let i = 0; i < 28; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xc9a84c, wireframe: true, transparent: true,
        opacity: 0.06 + Math.random() * 0.1,
      });
      const mesh = new THREE.Mesh(geos[i % 3], mat);
      const s = 0.4 + Math.random() * 1.8;
      mesh.scale.setScalar(s);
      mesh.position.set(
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 60 - 20
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(mesh);
      shapes.push({ mesh, rx: (Math.random() - 0.5) * 0.003, ry: (Math.random() - 0.5) * 0.003, vx: (Math.random() - 0.5) * 0.015, vy: (Math.random() - 0.5) * 0.01 });
    }

    const grid = new THREE.GridHelper(200, 30, 0xc9a84c, 0xc9a84c);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.03;
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -40;
    scene.add(grid);

    let mouseX = 0, mouseY = 0;
    const onMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      camera.position.x += (mouseX * 6 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 4 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      for (const s of shapes) {
        s.mesh.rotation.x += s.rx;
        s.mesh.rotation.y += s.ry;
        s.mesh.position.x += s.vx;
        s.mesh.position.y += s.vy;
        if (Math.abs(s.mesh.position.x) > 65) s.vx *= -1;
        if (Math.abs(s.mesh.position.y) > 45) s.vy *= -1;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      renderer.dispose();
    };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full opacity-70 pointer-events-none" />;
}

// ─── Vault Three.js scene ────────────────────────────────────────────────────
function VaultCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(42, canvas.clientWidth / canvas.clientHeight, 0.1, 300);
    camera.position.set(3.5, 1.5, 18);
    camera.lookAt(0, 0, 0);

    const resize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Lighting ──────────────────────────────────────────────────────────────
    scene.add(new THREE.HemisphereLight(0x070912, 0x111625, 1.6));

    const key = new THREE.DirectionalLight(0xfff4e0, 4.2);
    key.position.set(8, 12, 14);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 60;
    key.shadow.camera.left = -12;
    key.shadow.camera.right = 12;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xeeba66, 3.5);
    rim.position.set(-10, 4, -8);
    scene.add(rim);

    const fill = new THREE.PointLight(0xffc55c, 4.5, 30);
    fill.position.set(0, 0, 4);
    scene.add(fill);

    const ground = new THREE.DirectionalLight(0x11182c, 1.2);
    ground.position.set(0, -10, 5);
    scene.add(ground);

    // ── Materials ─────────────────────────────────────────────────────────────
    const steelDark = new THREE.MeshPhysicalMaterial({ color: 0x10131d, metalness: 0.98, roughness: 0.15, clearcoat: 0.2, clearcoatRoughness: 0.2 });
    const steelMid  = new THREE.MeshPhysicalMaterial({ color: 0x1c2130, metalness: 0.94, roughness: 0.20, clearcoat: 0.15 });
    const steelBody = new THREE.MeshPhysicalMaterial({ color: 0x0e111a, metalness: 0.96, roughness: 0.18, clearcoat: 0.25 });
    const goldMat   = new THREE.MeshPhysicalMaterial({ color: 0xe0ba5a, metalness: 1.0,  roughness: 0.08, clearcoat: 0.4, clearcoatRoughness: 0.1 });
    const goldDimMat= new THREE.MeshPhysicalMaterial({ color: 0x9c7a2e, metalness: 0.98, roughness: 0.25 });
    const interiorMat = new THREE.MeshStandardMaterial({ color: 0x05070a, metalness: 0.5, roughness: 0.95 });
    const dialFaceMat = new THREE.MeshPhysicalMaterial({ color: 0x090b12, metalness: 0.98, roughness: 0.05, clearcoat: 0.5 });
    
    const particleMat = new THREE.PointsMaterial({ color: 0xffd470, size: 0.06, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });

    // ── Vault group ───────────────────────────────────────────────────────────
    const vaultGroup = new THREE.Group();
    vaultGroup.position.set(-1.0, 0, 0);
    scene.add(vaultGroup);

    const W = 6.0, H = 7.2, D = 4.8;

    const bodyGroup = new THREE.Group();
    vaultGroup.add(bodyGroup);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.35), steelBody.clone());
    backWall.position.set(0, 0, -D / 2 + 0.175);
    backWall.castShadow = true; backWall.receiveShadow = true;
    bodyGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, H, D), steelBody.clone());
    leftWall.position.set(-W / 2 + 0.2, 0, 0);
    leftWall.castShadow = true; leftWall.receiveShadow = true;
    bodyGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, H, D), steelBody.clone());
    rightWall.position.set(W / 2 - 0.2, 0, 0);
    rightWall.castShadow = true; rightWall.receiveShadow = true;
    bodyGroup.add(rightWall);

    const topWall = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, D), steelBody.clone());
    topWall.position.set(0, H / 2 - 0.2, 0);
    topWall.castShadow = true; topWall.receiveShadow = true;
    bodyGroup.add(topWall);

    const botWall = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, D), steelBody.clone());
    botWall.position.set(0, -H / 2 + 0.2, 0);
    botWall.castShadow = true; botWall.receiveShadow = true;
    bodyGroup.add(botWall);

    const innerBack = new THREE.Mesh(new THREE.BoxGeometry(W - 0.82, H - 0.82, 0.06), interiorMat);
    innerBack.position.set(0, 0, -D / 2 + 0.22);
    bodyGroup.add(innerBack);
    const innerLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, H - 0.82, D - 0.42), interiorMat);
    innerLeft.position.set(-(W - 0.82) / 2, 0, 0);
    bodyGroup.add(innerLeft);
    const innerRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, H - 0.82, D - 0.42), interiorMat);
    innerRight.position.set((W - 0.82) / 2, 0, 0);
    bodyGroup.add(innerRight);
    const innerFloor = new THREE.Mesh(new THREE.BoxGeometry(W - 0.82, 0.06, D - 0.42), interiorMat);
    innerFloor.position.set(0, -(H - 0.82) / 2, 0);
    bodyGroup.add(innerFloor);
    const innerCeil = new THREE.Mesh(new THREE.BoxGeometry(W - 0.82, 0.06, D - 0.42), interiorMat);
    innerCeil.position.set(0, (H - 0.82) / 2, 0);
    bodyGroup.add(innerCeil);

    const shelfMat = new THREE.MeshPhysicalMaterial({ color: 0x141824, metalness: 0.8, roughness: 0.5 });
    const shelfYs = [-1.0, 0.8];
    for (const sy of shelfYs) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(W - 1.0, 0.08, D - 0.6), shelfMat);
      shelf.position.set(0, sy, 0);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      bodyGroup.add(shelf);
    }

    const frontZ = 1.6, midZ = 0.5;

    const goldBarMat    = new THREE.MeshPhysicalMaterial({ color: 0xd4a017, metalness: 1.0, roughness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.04 });
    const goldBarDimMat = new THREE.MeshPhysicalMaterial({ color: 0x8a6510, metalness: 0.98, roughness: 0.2 });
    const paperMat      = new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.95 });
    const bandMat       = new THREE.MeshPhysicalMaterial({ color: 0xe0ba5a, metalness: 0.5, roughness: 0.4 });
    const coinMat       = new THREE.MeshPhysicalMaterial({ color: 0xf0c830, metalness: 1.0, roughness: 0.08, clearcoat: 0.5 });

    const barW = 0.78, barH = 0.30, barD = 0.42;
    const bottomY = -0.96 + barH / 2;

    for (const bx of [-1.55, -0.65, 0.25, 1.15]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(barW, barH, barD), goldBarMat.clone());
      bar.position.set(bx, bottomY, frontZ);
      bodyGroup.add(bar);
      const stamp = new THREE.Mesh(new THREE.BoxGeometry(barW * 0.55, barH * 0.45, 0.04), goldBarDimMat);
      stamp.position.set(bx, bottomY, frontZ + barD / 2 + 0.02);
      bodyGroup.add(stamp);
      const chamfer = new THREE.Mesh(new THREE.BoxGeometry(barW + 0.03, 0.05, barD + 0.03), goldBarDimMat);
      chamfer.position.set(bx, bottomY + barH / 2, frontZ);
      bodyGroup.add(chamfer);
    }

    for (const bx of [-1.55, -0.65, 0.25]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(barW, barH, barD), goldBarMat.clone());
      bar.position.set(bx, bottomY + barH, midZ);
      bodyGroup.add(bar);
      const chamfer = new THREE.Mesh(new THREE.BoxGeometry(barW + 0.03, 0.05, barD + 0.03), goldBarDimMat);
      chamfer.position.set(bx, bottomY + barH * 1.5, midZ);
      bodyGroup.add(chamfer);
    }

    for (let ci = 0; ci < 3; ci++) {
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.52, 24), coinMat);
      roll.rotation.z = Math.PI / 2;
      roll.position.set(1.55, -0.96 + 0.16, frontZ - ci * 0.52);
      bodyGroup.add(roll);
    }

    const stackDefs: [number, number, number, number, number][] = [
      [-1.55, frontZ, 0.85, 0.50, 0.38],
      [-0.58, frontZ, 0.85, 0.50, 0.44],
      [ 0.40, frontZ, 0.85, 0.50, 0.36],
      [ 1.38, frontZ, 0.72, 0.50, 0.42],
      [-1.55, midZ,   0.85, 0.50, 0.30],
      [-0.58, midZ,   0.85, 0.50, 0.34],
    ];
    const upperBase = 0.84;
    for (const [sx, sz, sw, sd, sh] of stackDefs) {
      const stack = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), paperMat.clone());
      stack.position.set(sx, upperBase + sh / 2, sz);
      bodyGroup.add(stack);
      const band = new THREE.Mesh(new THREE.BoxGeometry(sw + 0.04, 0.07, sd + 0.04), bandMat);
      band.position.set(sx, upperBase + sh * 0.6, sz);
      bodyGroup.add(band);
      const top = new THREE.Mesh(new THREE.BoxGeometry(sw - 0.02, 0.02, sd - 0.02),
        new THREE.MeshStandardMaterial({ color: 0x3a4e72, roughness: 0.9 }));
      top.position.set(sx, upperBase + sh + 0.01, sz);
      bodyGroup.add(top);
    }

    const panelLineMat = new THREE.MeshStandardMaterial({ color: 0x1a2540, emissive: 0x4060c0, emissiveIntensity: 0.6, roughness: 1.0 });
    for (let li = 0; li < 5; li++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(W - 1.0, 0.03, 0.03), panelLineMat);
      line.position.set(0, -1.8 + li * 0.9, -D / 2 + 0.24);
      bodyGroup.add(line);
    }
    for (let li = 0; li < 4; li++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.03, H - 1.2, 0.03), panelLineMat);
      line.position.set(-1.5 + li * 1.0, 0, -D / 2 + 0.24);
      bodyGroup.add(line);
    }

    const trimMat = goldMat.clone();
    for (const [sy, wy] of [[(H-0.1)/2, W], [-(H-0.1)/2, W]] as [number, number][]) {
        const hTrim = new THREE.Mesh(new THREE.BoxGeometry(wy - 0.6, 0.1, 0.1), trimMat);
        hTrim.position.set(0, sy, D/2 + 0.05);
        bodyGroup.add(hTrim);
    }
    for (const [sx, hx] of [[(W-0.1)/2, H], [-(W-0.1)/2, H]] as [number, number][]) {
        const vTrim = new THREE.Mesh(new THREE.BoxGeometry(0.1, hx - 0.6, 0.1), trimMat);
        vTrim.position.set(sx, 0, D/2 + 0.05);
        bodyGroup.add(vTrim);
    }

    for (const [sx, ex] of [[-W / 2, 0.04], [W / 2, -0.04]] as [number, number][]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.08, H, 0.1), goldDimMat);
      strip.position.set(sx + ex, 0, D / 2 - 0.04);
      bodyGroup.add(strip);
    }
    for (const sy of [-H / 2, H / 2]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, 0.1), goldDimMat);
      strip.position.set(0, sy, D / 2 - 0.04);
      bodyGroup.add(strip);
    }

    const holeRingMat = new THREE.MeshPhysicalMaterial({ color: 0x05070a, metalness: 0.8, roughness: 0.6 });
    for (const by of [2.2, 0.7, -0.7, -2.2]) {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.5, 32), holeRingMat);
      hole.rotation.z = Math.PI / 2;
      hole.position.set(W / 2 - 0.05, by, D / 2 - 0.6);
      
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 16, 32), goldDimMat);
      rim.rotation.y = Math.PI / 2;
      rim.position.set(W / 2 + 0.18, by, D / 2 - 0.6);
      
      bodyGroup.add(hole);
      bodyGroup.add(rim);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  VAULT DOOR
    // ═══════════════════════════════════════════════════════════════════════
    const doorGroup = new THREE.Group();
    doorGroup.position.set(-W / 2 + 0.22, 0, D / 2 + 0.01);
    vaultGroup.add(doorGroup);

    const doorThickness = 0.75;
    const doorInnerX = W - 0.42;

    const doorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorInnerX, H - 0.42, doorThickness),
      steelDark.clone()
    );
    doorMesh.position.set(doorInnerX / 2, 0, doorThickness / 2);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    doorGroup.add(doorMesh);

    const doorEdgeGeo = new THREE.BoxGeometry(doorInnerX + 0.04, H - 0.38, doorThickness - 0.1);
    const doorEdge = new THREE.Mesh(doorEdgeGeo, goldDimMat);
    doorEdge.position.set(doorInnerX / 2, 0, doorThickness / 2);
    doorGroup.add(doorEdge);

    const panelW = doorInnerX - 1.1, panelH = H - 1.7, panelD = 0.12;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(panelW, panelH, panelD), steelMid);
    panel.position.set(doorInnerX / 2, 0, doorThickness + panelD / 2 - 0.01);
    doorGroup.add(panel);
    
    for (const sy of [panelH/2 - 0.02, -panelH/2 + 0.02]) {
        const fr = new THREE.Mesh(new THREE.BoxGeometry(panelW, 0.04, panelD+0.04), goldMat);
        fr.position.set(doorInnerX / 2, sy, doorThickness + panelD / 2);
        doorGroup.add(fr);
    }
    for (const sx of [doorInnerX/2 + panelW/2 - 0.02, doorInnerX/2 - panelW/2 + 0.02]) {
        const fr = new THREE.Mesh(new THREE.BoxGeometry(0.04, panelH, panelD+0.04), goldMat);
        fr.position.set(sx, 0, doorThickness + panelD / 2);
        doorGroup.add(fr);
    }

    // ── Combination lock dial system ────────────────────────────────────────
    const dialCX = doorInnerX / 2, dialCZ = doorThickness + 0.02;

    const mountRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.05, 0.16, 32, 120),
      goldDimMat.clone()
    );
    mountRing.position.set(dialCX, 0, dialCZ + 0.06);
    doorGroup.add(mountRing);

    const rings: THREE.Mesh[] = [];
    const ringRadii = [1.68, 1.25, 0.86];
    for (let i = 0; i < 3; i++) {
      const rMat = goldMat.clone();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(ringRadii[i], 0.06 - i * 0.008, 32, 120),
        rMat
      );
      ring.position.set(dialCX, 0, dialCZ + 0.10 + i * 0.05);
      doorGroup.add(ring);
      rings.push(ring);
    }

    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const isMain = i % 5 === 0;
      const r = isMain ? 1.95 : 1.98;
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(isMain ? 0.06 : 0.03, isMain ? 0.28 : 0.14, 0.06),
        goldMat
      );
      tick.position.set(
        dialCX + Math.cos(angle) * r,
        Math.sin(angle) * r,
        dialCZ + 0.08
      );
      tick.rotation.z = angle;
      doorGroup.add(tick);
    }

    const dialFace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.74, 0.74, 0.22, 64),
      dialFaceMat
    );
    dialFace.rotation.x = Math.PI / 2;
    dialFace.position.set(dialCX, 0, dialCZ + 0.18);
    doorGroup.add(dialFace);

    const dialRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.74, 0.08, 32, 100),
      goldMat.clone()
    );
    dialRim.position.set(dialCX, 0, dialCZ + 0.28);
    doorGroup.add(dialRim);

    const needle = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.65, 0.08),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0xe5c15c, emissiveIntensity: 0.8, metalness: 1.0, roughness: 0.1 })
    );
    needle.position.set(dialCX, 0, dialCZ + 0.32);
    doorGroup.add(needle);

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.22, 32),
      goldMat.clone()
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.set(dialCX, 0, dialCZ + 0.30);
    doorGroup.add(hub);

    const boltGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.85, 32);
    for (const by of [2.2, 0.7, -0.7, -2.2]) {
      const bolt = new THREE.Mesh(boltGeo, steelMid.clone());
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(doorInnerX + 0.15, by, doorThickness / 2);
      doorGroup.add(bolt);

      const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.06, 16, 32), goldDimMat);
      baseRing.rotation.y = Math.PI / 2;
      baseRing.position.set(doorInnerX, by, doorThickness / 2);
      doorGroup.add(baseRing);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 16), steelMid.clone());
      cap.position.set(doorInnerX + 0.575, by, doorThickness / 2);
      doorGroup.add(cap);
    }

    const hingeBodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 32);
    const hingeMat = goldDimMat.clone();
    for (const hy of [2.4, 0, -2.4]) {
      const h = new THREE.Mesh(hingeBodyGeo, hingeMat);
      h.position.set(-0.1, hy, doorThickness / 2);
      doorGroup.add(h);

      const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 16), hingeMat);
      topCap.position.set(-0.1, hy + 0.4, doorThickness / 2);
      doorGroup.add(topCap);
      const botCap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 16), hingeMat);
      botCap.position.set(-0.1, hy - 0.4, doorThickness / 2);
      doorGroup.add(botCap);
      
      const conn = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.2), hingeMat);
      conn.position.set(0.1, hy, doorThickness / 2 - 0.1);
      doorGroup.add(conn);
    }

    for (const [rx, ry] of [
      [doorInnerX * 0.18, H * 0.38],
      [doorInnerX * 0.82, H * 0.38],
      [doorInnerX * 0.18, -H * 0.38],
      [doorInnerX * 0.82, -H * 0.38],
      [doorInnerX * 0.5, H * 0.41],
      [doorInnerX * 0.5, -H * 0.41]
    ] as [number, number][]) {
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 16), goldMat);
      rivet.position.set(rx, ry, doorThickness + 0.04);
      doorGroup.add(rivet);

      const rRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.16, 0.04, 16, 32),
        goldDimMat
      );
      rRing.position.copy(rivet.position);
      doorGroup.add(rRing);
    }

    const ptCount = 200;
    const ptPos = new Float32Array(ptCount * 3);
    const ptVel: { x: number; y: number }[] = [];
    for (let i = 0; i < ptCount; i++) {
      ptPos[i * 3]     = (Math.random() - 0.5) * 24;
      ptPos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      ptPos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;
      ptVel.push({ x: (Math.random() - 0.5) * 0.005, y: (Math.random() - 0.5) * 0.005 });
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(ptPos, 3));
    const particles = new THREE.Points(ptGeo, particleMat);
    scene.add(particles);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 30),
      new THREE.ShadowMaterial({ opacity: 0.5, color: 0x070912 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -H / 2 - 0.22;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    const vaultInteriorLight = new THREE.PointLight(0xffd060, 0.0, 18);
    vaultInteriorLight.position.set(0, 1.0, 1.2);
    scene.add(vaultInteriorLight);
    const vaultInteriorLight2 = new THREE.PointLight(0xffb030, 0.0, 14);
    vaultInteriorLight2.position.set(0, -1.2, 1.5);
    scene.add(vaultInteriorLight2);

    const innerGlowMat = new THREE.MeshStandardMaterial({ color: 0x3a2800, emissive: 0xffa030, emissiveIntensity: 0.0, roughness: 1.0 });
    const innerGlowPanel = new THREE.Mesh(new THREE.BoxGeometry(W - 0.84, H - 0.84, 0.04), innerGlowMat);
    innerGlowPanel.position.set(0, 0, -D / 2 + 0.22);
    bodyGroup.add(innerGlowPanel);

    let targetRotX = 0.15, targetRotY = 0.35;
    let curRotX = 0.15, curRotY = 0.35;
    let targetDoorOpen = 0;
    let curDoorOpen = 0;
    let hovering = false;
    let openProgress = 0;

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      targetRotY = ((e.clientX - r.left) / r.width - 0.5) * 0.45 + 0.28;
      targetRotX = -((e.clientY - r.top)  / r.height - 0.5) * 0.30 + 0.12;
      targetDoorOpen = -1.45;
      fill.intensity = 7.5;
      hovering = true;
    };
    const onLeave = () => { 
      hovering = false; 
      targetDoorOpen = 0;
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    let t = 0, rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.016;

      curRotX += (targetRotX - curRotX) * 0.05;
      curRotY += (targetRotY - curRotY) * 0.05;
      if (!hovering) {
          targetRotY = Math.sin(t * 0.25) * 0.2 + 0.25;
          fill.intensity = 3.5 + Math.sin(t * 1.5) * 1.0;
      }

      vaultGroup.rotation.x = curRotX;
      vaultGroup.rotation.y = curRotY;
      
      curDoorOpen += (targetDoorOpen - curDoorOpen) * 0.028;
      doorGroup.rotation.y = curDoorOpen;

      openProgress = Math.min(1, Math.abs(curDoorOpen) / 1.45);

      vaultInteriorLight.intensity = openProgress * 8.0;
      vaultInteriorLight2.intensity = openProgress * 6.0;
      innerGlowMat.emissiveIntensity = openProgress * 0.55;
      if (hovering) fill.intensity = 4.0 + openProgress * 3.5;

      needle.rotation.z = t * 1.2;

      rings[0].rotation.z =  t * 0.25 + Math.sin(t*0.5)*0.1;
      rings[1].rotation.z = -t * 0.18 + Math.cos(t*0.3)*0.1;
      rings[2].rotation.z =  t * 0.12 - Math.sin(t*0.4)*0.1;

      const pos = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < ptCount; i++) {
        pos[i * 3]     += ptVel[i].x;
        pos[i * 3 + 1] += ptVel[i].y;
        if (Math.abs(pos[i * 3]) > 12)     ptVel[i].x *= -1;
        if (Math.abs(pos[i * 3 + 1]) > 9)  ptVel[i].y *= -1;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      scene.environment?.dispose();
      pmremGenerator.dispose();
      innerGlowMat.dispose();
      vaultInteriorLight2.dispose();
      renderer.dispose();
    };
  }, []);
  return <canvas ref={ref} className="w-full h-full" />;
}

// ─── Scroll reveal hook ───────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── 3. Deal Room Preview Section ────────────────────────────────────────────
function DealRoomSection() {
  const { ref, visible } = useReveal();
  const [hovered, setHovered] = useState(false);

  return (
    <section
      ref={ref}
      style={{
        padding: "120px 56px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: "all 0.9s",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 56 }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#c9a84c", marginBottom: 20 }}>
              RESTRICTED ACCESS
            </div>
            <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
              Inside the<br /><em style={{ color: "#e8c97a" }}>Deal Room</em>
            </h2>
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#8892a4", letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c9a84c", animation: "vb-pulse 2s ease-in-out infinite" }} />
            NDA-PROTECTED ENVIRONMENT
          </div>
        </div>

        {/* Frosted glass deal room card */}
        <div
          style={{
            position: "relative", overflow: "hidden",
            border: "1px solid rgba(201,168,76,0.2)",
            background: "rgba(15,20,32,0.8)",
            boxShadow: hovered ? "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.15)" : "0 16px 48px rgba(0,0,0,0.4)",
            transition: "box-shadow 0.4s",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Blurred inner content preview */}
          <div style={{ filter: "blur(6px)", opacity: 0.45, pointerEvents: "none", padding: "48px 48px 32px", userSelect: "none" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 32 }}>
              {/* Pitch deck mockup */}
              <div style={{ background: "#0a0d14", border: "1px solid rgba(201,168,76,0.12)", padding: 24, aspectRatio: "4/3", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ width: "60%", height: 10, background: "rgba(201,168,76,0.4)", marginBottom: 8 }} />
                  <div style={{ width: "80%", height: 6, background: "rgba(255,255,255,0.1)", marginBottom: 4 }} />
                  <div style={{ width: "70%", height: 6, background: "rgba(255,255,255,0.1)" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[0.3, 0.6, 0.4, 0.8].map((h, i) => (
                    <div key={i} style={{ background: "rgba(201,168,76,0.2)", height: 40 * h + 20 }} />
                  ))}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#c9a84c", letterSpacing: "0.1em" }}>
                  SERIES A — PITCH DECK
                </div>
              </div>
              {/* Term sheet */}
              <div style={{ background: "#0a0d14", border: "1px solid rgba(201,168,76,0.12)", padding: 24 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#c9a84c", letterSpacing: "0.12em", marginBottom: 16 }}>TERM SHEET</div>
                {[
                  ["Pre-Money Val.", "$18,000,000"],
                  ["Investment", "$3,500,000"],
                  ["Equity Offered", "16.3%"],
                  ["Investor Rights", "Pro-Rata"],
                  ["Board Seat", "1 Observer"],
                  ["Liquidation", "1× Non-Part."],
                ].map(([k, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#8892a4" }}>{k}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#e8c97a" }}>{v}</span>
                  </div>
                ))}
              </div>
              {/* Investor list */}
              <div style={{ background: "#0a0d14", border: "1px solid rgba(201,168,76,0.12)", padding: 24 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#c9a84c", letterSpacing: "0.12em", marginBottom: 16 }}>INVESTOR LIST</div>
                {[
                  { name: "Apex Ventures", amount: "$1.2M", stage: "Lead" },
                  { name: "SandHill Capital", amount: "$800K", stage: "Co-Lead" },
                  { name: "Blue Horizon", amount: "$600K", stage: "Follow" },
                  { name: "NorthStar LP", amount: "$500K", stage: "Follow" },
                  { name: "Meridian Fund", amount: "$400K", stage: "Angel" },
                ].map((inv, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#c9a84c", fontWeight: 600, flexShrink: 0 }}>
                      {inv.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "#f0ece2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inv.name}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#8892a4" }}>{inv.stage}</div>
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#e8c97a", flexShrink: 0 }}>{inv.amount}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Activity feed */}
            <div style={{ background: "#0a0d14", border: "1px solid rgba(201,168,76,0.08)", padding: "16px 24px" }}>
              <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
                {[
                  { label: "LAST ACTIVITY", val: "2 hrs ago" },
                  { label: "DOCUMENTS", val: "14 files" },
                  { label: "MESSAGES", val: "47 total" },
                  { label: "DUE DILIGENCE", val: "86% complete" },
                  { label: "CLOSING DATE", val: "Mar 28, 2025" },
                ].map((item, i) => (
                  <div key={i} style={{ borderRight: i < 4 ? "1px solid rgba(255,255,255,0.06)" : "none", paddingRight: i < 4 ? 32 : 0 }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "#8892a4", letterSpacing: "0.1em", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#e8c97a" }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lock overlay */}
          <div
            style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, rgba(10,13,20,0.3) 0%, rgba(10,13,20,0.65) 60%, rgba(10,13,20,0.92) 100%)",
              backdropFilter: "blur(2px)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 24,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: 16 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.7)" strokeWidth="1">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.25em", color: "#c9a84c", marginBottom: 12 }}>
                CONFIDENTIAL — NDA REQUIRED
              </div>
              <h3 style={{ fontSize: "clamp(20px,2.5vw,30px)", fontWeight: 300, letterSpacing: "-0.01em", marginBottom: 12, color: "#f0ece2" }}>
                This Deal Room is Private
              </h3>
              <p style={{ fontSize: 14, color: "#8892a4", maxWidth: 380, margin: "0 auto 28px", lineHeight: 1.8, fontWeight: 300 }}>
                Verified investors get full access to pitch decks, term sheets, financials, and direct founder communication.
              </p>
              <Link
                to="/onboarding/investor"
                style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.14em",
                  padding: "14px 36px", background: "rgba(201,168,76,0.1)",
                  border: "1px solid #c9a84c", color: "#e8c97a", textDecoration: "none",
                  display: "inline-block", transition: "all 0.3s",
                }}
                onMouseOver={e => (e.currentTarget.style.background = "rgba(201,168,76,0.2)")}
                onMouseOut={e => (e.currentTarget.style.background = "rgba(201,168,76,0.1)")}
              >
                REQUEST ACCESS →
              </Link>
            </div>
          </div>

          {/* Top border gold glow */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)" }} />
        </div>
      </div>
    </section>
  );
}

// ─── 5. Before / After Section ────────────────────────────────────────────────
function BeforeAfterSection() {
  const { ref, visible } = useReveal();

  const before = [
    { icon: "✉", label: "Cold email campaigns", detail: "5% reply rate, if you're lucky" },
    { icon: "📊", label: "Manual spreadsheet tracking", detail: "Investor CRMs that never sync" },
    { icon: "🔗", label: "LinkedIn cold DMs", detail: "Ignored by partners, seen by interns" },
    { icon: "📅", label: "6-month fundraise timelines", detail: "While runway burns quietly" },
    { icon: "👻", label: "Ghosted after warm intros", detail: "\"We'll circle back next quarter\"" },
    { icon: "📄", label: "Generic pitch templates", detail: "No differentiation, no signal" },
  ];

  const after = [
    { icon: "✓", label: "Verified investor profiles", detail: "Thesis-matched, pre-screened capital" },
    { icon: "✓", label: "Intelligent deal matching", detail: "Stage, sector & check size aligned" },
    { icon: "✓", label: "NDA-protected deal rooms", detail: "Confidential, legally secured" },
    { icon: "✓", label: "Deals closed in weeks", detail: "Not months. Average: 23 days." },
    { icon: "✓", label: "Direct founder-investor line", detail: "Principals only, no gatekeepers" },
    { icon: "✓", label: "Structured term negotiation", detail: "Built-in tools, lawyers optional" },
  ];

  return (
    <section
      ref={ref}
      style={{
        padding: "120px 56px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: "all 0.9s",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#c9a84c", marginBottom: 20 }}>
            THE DIFFERENCE
          </div>
          <h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            The Old Way vs<br /><em style={{ color: "#e8c97a" }}>The VaultBridge Way</em>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(201,168,76,0.18)" }}>
          {/* BEFORE */}
          <div style={{ background: "#0a0d14", padding: "48px 48px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 40 }}>
              <div style={{ width: 36, height: 36, border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8892a4" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#8892a4" }}>BEFORE</div>
                <div style={{ fontSize: 18, fontWeight: 400, color: "#8892a4", letterSpacing: "-0.01em" }}>The Traditional Way</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {before.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", gap: 20, padding: "20px 0",
                    borderBottom: i < before.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    transition: "padding-left 0.3s",
                    cursor: "default",
                  }}
                  onMouseOver={e => (e.currentTarget.style.paddingLeft = "8px")}
                  onMouseOut={e => (e.currentTarget.style.paddingLeft = "0")}
                >
                  <span style={{ fontSize: 18, flexShrink: 0, opacity: 0.5, width: 24, textAlign: "center" }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 400, color: "#8892a4", marginBottom: 4, textDecoration: "line-through", textDecorationColor: "rgba(136,146,164,0.3)" }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(136,146,164,0.5)", letterSpacing: "0.06em" }}>
                      {item.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AFTER */}
          <div style={{ background: "#0d1018", padding: "48px 48px 56px", position: "relative", overflow: "hidden" }}>
            {/* Subtle gold radial glow */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.06), transparent 70%)", pointerEvents: "none" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 40 }}>
              <div style={{ width: 36, height: 36, border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#c9a84c" }}>AFTER</div>
                <div style={{ fontSize: 18, fontWeight: 400, color: "#f0ece2", letterSpacing: "-0.01em" }}>The VaultBridge Way</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {after.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", gap: 20, padding: "20px 0",
                    borderBottom: i < after.length - 1 ? "1px solid rgba(201,168,76,0.07)" : "none",
                    transition: "padding-left 0.3s",
                    cursor: "default",
                  }}
                  onMouseOver={e => (e.currentTarget.style.paddingLeft = "8px")}
                  onMouseOut={e => (e.currentTarget.style.paddingLeft = "0")}
                >
                  <div style={{ width: 24, height: 24, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 400, color: "#f0ece2", marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#8892a4", letterSpacing: "0.06em" }}>
                      {item.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const Homepage = () => {
  const [startups, setStartups] = useState<any[]>([]);
  const [sharks, setSharks] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [heroVisible, setHeroVisible] = useState(false);
  const process = useReveal();
  const portfolio = useReveal();
  const cta = useReveal();

  const startupCount = useCounter(startups.length || 240, 0);
  const sharkCount = useCounter(sharks.length || 87, 0);
  const dealCount = useCounter(deals.length || 124, 0);
  const fundingCount = useCounter(2.4, 1);

  // 4. Scroll-reactive gradient mesh
  const scrollProgress = useScrollGradient();

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 2400);
    Promise.all([getStartups(), getSharks(), getDeals()])
      .then(([s, sh, d]) => {
        setStartups((s.data || []).slice(0, 6));
        setSharks(sh.data || []);
        setDeals(d.data || []);
      })
      .catch(() => {});
  }, []);

  const statsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = statsRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        startupCount.trigger(); sharkCount.trigger(); dealCount.trigger(); fundingCount.trigger();
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [startups, sharks, deals]);

  const displayStartups = startups.length > 0 ? startups : [
    { startup_id: 1, startup_name: "NeuralForge AI", tagline: "Enterprise LLM infrastructure for Fortune 500 companies", industry_name: "AI / ML", status: "Active", total_funding_usd: 4200000 },
    { startup_id: 2, startup_name: "GreenVolt", tagline: "Next-generation battery technology for sustainable energy", industry_name: "CleanTech", status: "Active", total_funding_usd: 8100000 },
    { startup_id: 3, startup_name: "MedHive", tagline: "AI diagnostics platform connecting patients with specialists", industry_name: "HealthTech", status: "Active", total_funding_usd: 12500000 },
    { startup_id: 4, startup_name: "DeepFinance", tagline: "Automated hedge strategies powered by reinforcement learning", industry_name: "FinTech", status: "Active", total_funding_usd: 6800000 },
    { startup_id: 5, startup_name: "SpaceBase", tagline: "Low-orbit satellite mesh network for global connectivity", industry_name: "SpaceTech", status: "Active", total_funding_usd: 22000000 },
    { startup_id: 6, startup_name: "QuantumCure", tagline: "Quantum computing applications for drug discovery", industry_name: "BioTech", status: "Seed", total_funding_usd: 3000000 },
  ];

  const fmtFunding = (v: number) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v}`;

  // 4. Interpolate background color based on scroll
  const r1 = 10, g1 = 13, b1 = 20;  // #0a0d14 cold navy
  const r2 = 13, g2 = 10, b2 = 8;   // #0d0a08 warm near-black
  const bgR = Math.round(r1 + (r2 - r1) * scrollProgress);
  const bgG = Math.round(g1 + (g2 - g1) * scrollProgress);
  const bgB = Math.round(b1 + (b2 - b1) * scrollProgress);
  const bgColor = `rgb(${bgR},${bgG},${bgB})`;

  return (
    <div className="min-h-screen" style={{ background: bgColor, color: "#f0ece2", fontFamily: "'Cormorant Garamond', Georgia, serif", transition: "background 0.3s" }}>

      {/* ── 1. Cursor trail canvas ── */}
      <CursorTrail />

      {/* ── 2. Combination dial Easter egg ── */}
      <CombinationDial />

      {/* ── PURE CSS INTRO ANIMATIONS ── */}
      <style>{`
        @keyframes vb-curtain-left {
          0%   { transform: scaleX(1); transform-origin: left; }
          100% { transform: scaleX(0); transform-origin: left; }
        }
        @keyframes vb-curtain-right {
          0%   { transform: scaleX(1); transform-origin: right; }
          100% { transform: scaleX(0); transform-origin: right; }
        }
        @keyframes vb-wordmark-in {
          0%   { opacity: 0; letter-spacing: 0.6em; }
          60%  { opacity: 1; letter-spacing: 0.6em; }
          100% { opacity: 0; letter-spacing: 0.6em; }
        }
        @keyframes vb-line-grow {
          0%   { width: 0; opacity: 0; }
          100% { width: 120px; opacity: 1; }
        }
        @keyframes vb-nav-drop {
          0%   { opacity: 0; transform: translateY(-100%); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes vb-modal-in {
          0%   { opacity: 0; transform: scale(0.92) translateY(16px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes vb-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.4); }
        }
        .vb-intro-overlay-left {
          position: fixed; inset: 0 50% 0 0; z-index: 9998;
          background: #05070c;
          animation: vb-curtain-left 0.7s cubic-bezier(0.76, 0, 0.24, 1) 2.2s forwards;
        }
        .vb-intro-overlay-right {
          position: fixed; inset: 0 0 0 50%; z-index: 9998;
          background: #05070c;
          animation: vb-curtain-right 0.7s cubic-bezier(0.76, 0, 0.24, 1) 2.2s forwards;
        }
        .vb-intro-center {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          pointer-events: none;
          opacity: 1;
          animation: none;
        }
        .vb-intro-wordmark {
          font-family: 'DM Mono', monospace;
          font-size: 13px; letter-spacing: 0.6em;
          color: #c9a84c;
          animation: vb-wordmark-in 1.8s ease forwards;
        }
        .vb-intro-line {
          height: 1px; background: #c9a84c; margin-top: 20px;
          width: 0; opacity: 0;
          animation: vb-line-grow 0.8s ease 0.5s forwards;
        }
        .vb-intro-center {
          animation: vb-wordmark-in 0s 2.2s forwards;
        }
        @keyframes vb-center-fade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        .vb-intro-center {
          animation: vb-center-fade 0.3s ease 2.0s forwards;
        }
      `}</style>

      {/* Curtain panels */}
      <div className="vb-intro-overlay-left" />
      <div className="vb-intro-overlay-right" />
      <div className="vb-intro-center">
        <div className="vb-intro-wordmark">VAULTBRIDGE</div>
        <div className="vb-intro-line" />
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 56px", height: 68, background: "rgba(10,13,20,0.92)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(201,168,76,0.18)", animation: "vb-nav-drop 0.6s ease 2.6s both" }}>
        <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "0.12em", color: "#e8c97a" }}>VAULTBRIDGE</div>
        <div style={{ display: "flex", gap: 40, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.1em", color: "#8892a4" }}>
          <Link to="/#about" style={{ color: "#8892a4", textDecoration: "none" }} onMouseOver={e => (e.currentTarget.style.color = "#f0ece2")} onMouseOut={e => (e.currentTarget.style.color = "#8892a4")}>ABOUT</Link>
          <Link to="/explore" style={{ color: "#8892a4", textDecoration: "none" }} onMouseOver={e => (e.currentTarget.style.color = "#f0ece2")} onMouseOut={e => (e.currentTarget.style.color = "#8892a4")}>STARTUPS</Link>
          <Link to="/explore" style={{ color: "#8892a4", textDecoration: "none" }} onMouseOver={e => (e.currentTarget.style.color = "#f0ece2")} onMouseOut={e => (e.currentTarget.style.color = "#8892a4")}>INVESTORS</Link>
        </div>
        <Link to="/join" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", padding: "11px 28px", border: "1px solid #c9a84c", background: "transparent", color: "#e8c97a", cursor: "pointer", textDecoration: "none", transition: "all 0.3s" }} onMouseOver={e => (e.currentTarget.style.background = "rgba(201,168,76,0.1)")} onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
          JOIN THE VAULT
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: "92vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <HeroCanvas />

        {/* Left copy */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 680, padding: "0 56px" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "#c9a84c", marginBottom: 28, opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s 0.2s" }}>
            — EST. 2024 — PREMIER INCUBATION PLATFORM
          </div>
          <h1 style={{ fontSize: "clamp(52px, 6.5vw, 88px)", fontWeight: 300, lineHeight: 1.0, letterSpacing: "-0.01em", marginBottom: 12, opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(28px)", transition: "all 0.8s 0.4s" }}>
            Where Capital<br />
            <em style={{ fontStyle: "italic", color: "#e8c97a" }}>Meets Vision</em>
          </h1>
          <div style={{ width: 64, height: 1, background: "#c9a84c", margin: "28px 0", opacity: heroVisible ? 1 : 0, transition: "opacity 0.8s 0.55s" }} />
          <p style={{ fontSize: 17, fontWeight: 300, lineHeight: 1.8, color: "#8892a4", maxWidth: 440, marginBottom: 48, opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s 0.65s" }}>
            VaultBridge connects the world's most ambitious founders with strategic capital — forging partnerships that build the next generation of defining companies.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: "all 0.8s 0.8s" }}>
            <Link to="/onboarding/founder" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", padding: "15px 36px", border: "1px solid #c9a84c", background: "transparent", color: "#e8c97a", textDecoration: "none", transition: "all 0.3s" }} onMouseOver={e => (e.currentTarget.style.background = "rgba(201,168,76,0.12)")} onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
              I'M A FOUNDER →
            </Link>
            <Link to="/onboarding/investor" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", padding: "15px 36px", border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#8892a4", textDecoration: "none", transition: "all 0.3s" }} onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.color = "#f0ece2"; }} onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#8892a4"; }}>
              I'M AN INVESTOR
            </Link>
          </div>
        </div>

        {/* Right: Vault 3D */}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "55%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <VaultCanvas />
        </div>

        {/* Scroll cue */}
        <div style={{ position: "absolute", bottom: 32, left: 56, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", color: "#8892a4", display: "flex", alignItems: "center", gap: 16, opacity: heroVisible ? 1 : 0, transition: "opacity 0.8s 1.2s" }}>
          <div style={{ width: 32, height: 1, background: "#8892a4" }} />SCROLL
        </div>
      </section>

      {/* ── STATS ── */}
      <div style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }} />
      <div ref={statsRef} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "rgba(201,168,76,0.18)" }}>
        {[
          { value: startupCount.value, suffix: "+", label: "STARTUPS INCUBATED" },
          { value: sharkCount.value, suffix: "", label: "ACTIVE INVESTORS" },
          { value: dealCount.value, suffix: "", label: "DEALS CLOSED" },
          { value: fundingCount.value, prefix: "$", suffix: "B", label: "CAPITAL DEPLOYED", dec: 1 },
        ].map((s, i) => (
          <div key={i} style={{ background: bgColor, padding: "40px 48px", transition: "background 0.3s" }}>
            <div style={{ fontSize: "clamp(36px,4vw,56px)", fontWeight: 300, color: "#e8c97a", letterSpacing: "-0.02em" }}>
              {s.prefix || ""}{s.dec ? s.value.toFixed(1) : Math.floor(s.value)}{s.suffix}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#8892a4", marginTop: 8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }} />
      <section id="about" ref={process.ref} style={{ padding: "120px 56px", maxWidth: 1280, margin: "0 auto", opacity: process.visible ? 1 : 0, transform: process.visible ? "translateY(0)" : "translateY(40px)", transition: "all 0.9s" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 80, alignItems: "start" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#c9a84c", marginBottom: 20 }}>THE PROCESS</div>
            <h2 style={{ fontSize: "clamp(36px,4vw,52px)", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
              From Pitch<br /><em style={{ color: "#e8c97a" }}>to Close</em>
            </h2>
            <div style={{ width: 40, height: 1, background: "#c9a84c", marginTop: 24 }} />
          </div>
          <div>
            {[
              { n: "01", title: "Submit Your Venture", desc: "Create a comprehensive profile covering team, product, financials, and growth trajectory." },
              { n: "02", title: "Intelligent Matching", desc: "Our platform surfaces investors whose portfolio, thesis, and expertise align precisely with your stage and sector." },
              { n: "03", title: "Seal the Deal", desc: "Negotiate terms, run due diligence, and execute agreements — all within the VaultBridge ecosystem." },
            ].map((step, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 32, padding: "40px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none", transition: "padding-left 0.3s", cursor: "default" }} onMouseOver={e => (e.currentTarget.style.paddingLeft = "12px")} onMouseOut={e => (e.currentTarget.style.paddingLeft = "0")}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#c9a84c", paddingTop: 4 }}>{step.n}</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 10, letterSpacing: "-0.01em" }}>{step.title}</div>
                  <div style={{ fontSize: 15, fontWeight: 300, color: "#8892a4", lineHeight: 1.8 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PORTFOLIO ── */}
      <div style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }} />
      <section ref={portfolio.ref} style={{ padding: "120px 56px", opacity: portfolio.visible ? 1 : 0, transform: portfolio.visible ? "translateY(0)" : "translateY(40px)", transition: "all 0.9s" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 64, maxWidth: 1280, marginLeft: "auto", marginRight: "auto" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#c9a84c", marginBottom: 20 }}>PORTFOLIO</div>
            <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
              Built to<br /><em style={{ color: "#e8c97a" }}>Disrupt</em>
            </h2>
          </div>
          <Link to="/explore" style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#c9a84c", textDecoration: "none", borderBottom: "1px solid rgba(201,168,76,0.18)", paddingBottom: 4 }}>
            VIEW ALL VENTURES →
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(201,168,76,0.18)", maxWidth: 1280, margin: "0 auto" }}>
          {displayStartups.map((s: any) => (
            <div key={s.startup_id} style={{ background: "#0f1420", padding: 40, cursor: "pointer", transition: "background 0.3s" }} onMouseOver={e => (e.currentTarget.style.background = "#161c2d")} onMouseOut={e => (e.currentTarget.style.background = "#0f1420")}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#c9a84c", marginBottom: 24 }}>
                {s.industry_name || "TECHNOLOGY"}
              </div>
              <div style={{ fontSize: 24, fontWeight: 400, marginBottom: 10, letterSpacing: "-0.01em" }}>{s.startup_name}</div>
              <div style={{ fontSize: 14, fontWeight: 300, color: "#8892a4", lineHeight: 1.7, marginBottom: 32 }}>{s.tagline || "—"}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#8892a4" }}>{s.status?.toUpperCase() || "ACTIVE"}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#e8c97a" }}>
                  {s.total_funding_usd ? fmtFunding(s.total_funding_usd) : "N/A"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. DEAL ROOM PREVIEW ── */}
      <div style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }} />
      <DealRoomSection />

      {/* ── 5. BEFORE / AFTER ── */}
      <div style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }} />
      <BeforeAfterSection />

      {/* ── CTA ── */}
      <div style={{ borderTop: "1px solid rgba(201,168,76,0.18)" }} />
      <section ref={cta.ref} style={{ padding: "120px 56px", textAlign: "center", background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.04), transparent 60%)", opacity: cta.visible ? 1 : 0, transform: cta.visible ? "translateY(0)" : "translateY(40px)", transition: "all 0.9s" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", color: "#c9a84c", marginBottom: 24 }}>— READY TO BEGIN —</div>
        <h2 style={{ fontSize: "clamp(40px,5.5vw,72px)", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 20 }}>
          Open the <em style={{ color: "#e8c97a" }}>Vault</em>
        </h2>
        <p style={{ fontSize: 17, fontWeight: 300, color: "#8892a4", maxWidth: 400, margin: "0 auto 48px", lineHeight: 1.8 }}>
          Join hundreds of founders and investors already building the future through VaultBridge.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/onboarding/founder" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", padding: "16px 40px", border: "1px solid #c9a84c", background: "transparent", color: "#e8c97a", textDecoration: "none", transition: "all 0.3s" }} onMouseOver={e => (e.currentTarget.style.background = "rgba(201,168,76,0.1)")} onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
            GET STARTED AS FOUNDER →
          </Link>
          <Link to="/onboarding/investor" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", padding: "16px 40px", border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#8892a4", textDecoration: "none", transition: "all 0.3s" }} onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.color = "#f0ece2"; }} onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#8892a4"; }}>
            JOIN AS INVESTOR
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(201,168,76,0.18)", padding: "32px 56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.12em", color: "#c9a84c" }}>VAULTBRIDGE</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.08em", color: "#8892a4" }}>© 2025 VAULTBRIDGE INC.</div>
      </footer>

    </div>
  );
};

export default Homepage;
