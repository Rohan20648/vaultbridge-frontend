import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
    camera.position.set(0, 1, 14);
    camera.lookAt(0, 0, 0);

    const resize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    // Lighting
    scene.add(new THREE.AmbientLight(0x1a1a2e, 0.6));
    const key = new THREE.DirectionalLight(0xffeebb, 1.8);
    key.position.set(6, 8, 10); key.castShadow = true; scene.add(key);
    const rim = new THREE.DirectionalLight(0xc9a84c, 0.6);
    rim.position.set(-8, 2, -4); scene.add(rim);
    const fill = new THREE.PointLight(0xc9a84c, 0.8, 30);
    fill.position.set(0, 0, 6); scene.add(fill);

    // Vault group
    const vaultGroup = new THREE.Group();
    scene.add(vaultGroup);

    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1a2035, metalness: 0.9, roughness: 0.25 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(5.6, 7, 0.6), doorMat);
    door.castShadow = true;
    vaultGroup.add(door);

    // Gold edge trim
    const trimEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(5.8, 7.2, 0.55));
    vaultGroup.add(new THREE.LineSegments(trimEdges, new THREE.LineBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.6 })));

    // Recessed panel
    const panelGeo = new THREE.BoxGeometry(4.4, 5.8, 0.15);
    const panel = new THREE.Mesh(panelGeo, new THREE.MeshStandardMaterial({ color: 0x0f1520, metalness: 0.8, roughness: 0.4 }));
    panel.position.z = 0.28;
    vaultGroup.add(panel);
    const panelEdge = new THREE.LineSegments(new THREE.EdgesGeometry(panelGeo), new THREE.LineBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.3 }));
    panelEdge.position.z = 0.28;
    vaultGroup.add(panelEdge);

    // Concentric rings
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: 1.0, roughness: 0.15, side: THREE.DoubleSide, transparent: true });
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.6 - i * 0.45, 0.04 - i * 0.006, 16, 80),
        ringMat.clone()
      );
      (ring.material as THREE.MeshStandardMaterial).opacity = 0.7 - i * 0.15;
      ring.position.z = 0.32;
      vaultGroup.add(ring);
      rings.push(ring);
    }

    // Central dial
    const dial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.58, 0.18, 40),
      new THREE.MeshStandardMaterial({ color: 0x1c2540, metalness: 0.95, roughness: 0.2 })
    );
    dial.rotation.x = Math.PI / 2; dial.position.z = 0.38;
    vaultGroup.add(dial);

    // Dial indicator
    const indicator = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.36, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xe8c97a, emissive: 0xc9a84c, emissiveIntensity: 0.4 })
    );
    indicator.position.z = 0.47;
    vaultGroup.add(indicator);

    // Orbiting dot
    const dot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.05, 20),
      new THREE.MeshStandardMaterial({ color: 0xe8c97a, metalness: 1.0, roughness: 0.05, emissive: 0xc9a84c, emissiveIntensity: 0.3 })
    );
    dot.rotation.x = Math.PI / 2; dot.position.set(0, 0.38, 0.48);
    vaultGroup.add(dot);

    // Bolts
    const boltMat = new THREE.MeshStandardMaterial({ color: 0xb09040, metalness: 0.9, roughness: 0.2 });
    const boltGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 12);
    for (const [bx, by] of [[3.2, 2.0], [3.2, 0.6], [3.2, -0.6], [3.2, -2.0]] as [number, number][]) {
      const bolt = new THREE.Mesh(boltGeo, boltMat);
      bolt.rotation.z = Math.PI / 2; bolt.position.set(bx, by, 0.1);
      vaultGroup.add(bolt);
    }

    // Hinges
    const hingeGeo = new THREE.BoxGeometry(0.3, 0.8, 0.2);
    const hingeMat = new THREE.MeshStandardMaterial({ color: 0x9a7830, metalness: 0.95, roughness: 0.15 });
    for (const [hx, hy] of [[-3.0, 2.4], [-3.0, -2.4]] as [number, number][]) {
      const h = new THREE.Mesh(hingeGeo, hingeMat);
      h.position.set(hx, hy, 0.1); vaultGroup.add(h);
    }

    // Corner rivets
    const rivetMat = new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: 1.0, roughness: 0.1 });
    for (const [rx, ry] of [[-2.2, 3.0], [2.2, 3.0], [-2.2, -3.0], [2.2, -3.0]] as [number, number][]) {
      const r = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), rivetMat);
      r.position.set(rx, ry, 0.33); vaultGroup.add(r);
    }

    // Handle arc
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      pts.push(new THREE.Vector3(Math.cos(t * Math.PI * 1.2 - 0.1) * 0.5, Math.sin(t * Math.PI * 1.2 - 0.1) * 0.5, 0));
    }
    const handle = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.07, 10, false),
      new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: 1.0, roughness: 0.1 })
    );
    handle.position.set(1.6, 0, 0.5);
    vaultGroup.add(handle);

    // Floating particles
    const ptCount = 120;
    const ptPos = new Float32Array(ptCount * 3);
    const ptVel: { x: number; y: number }[] = [];
    for (let i = 0; i < ptCount; i++) {
      ptPos[i * 3] = (Math.random() - 0.5) * 18;
      ptPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      ptPos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
      ptVel.push({ x: (Math.random() - 0.5) * 0.008, y: (Math.random() - 0.5) * 0.008 });
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(ptPos, 3));
    const particles = new THREE.Points(ptGeo, new THREE.PointsMaterial({ color: 0xc9a84c, size: 0.04, transparent: true, opacity: 0.5 }));
    scene.add(particles);

    // Mouse
    let targetRotX = 0.08, targetRotY = 0.15, curRotX = 0.08, curRotY = 0.15;
    let hovering = false;
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      targetRotY = ((e.clientX - r.left) / r.width - 0.5) * 0.7;
      targetRotX = -((e.clientY - r.top) / r.height - 0.5) * 0.5;
      hovering = true;
    };
    const onLeave = () => { hovering = false; };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    let t = 0, rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.016;
      curRotX += (targetRotX - curRotX) * 0.06;
      curRotY += (targetRotY - curRotY) * 0.06;
      if (!hovering) targetRotY = Math.sin(t * 0.3) * 0.25 + 0.1;
      vaultGroup.rotation.x = curRotX;
      vaultGroup.rotation.y = curRotY;

      indicator.rotation.z = t * 0.8;
      dot.position.x = Math.cos(t * 0.8) * 0.38;
      dot.position.y = Math.sin(t * 0.8) * 0.38;
      rings.forEach((ring, i) => {
        ring.rotation.z = t * (0.15 - i * 0.04);
        (ring.material as THREE.MeshStandardMaterial).opacity = 0.55 + Math.sin(t * 1.2 + i * 1.2) * 0.15;
      });
      fill.intensity = 0.6 + Math.sin(t * 0.9) * 0.3;

      const pos = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < ptCount; i++) {
        pos[i * 3] += ptVel[i].x; pos[i * 3 + 1] += ptVel[i].y;
        if (Math.abs(pos[i * 3]) > 10) ptVel[i].x *= -1;
        if (Math.abs(pos[i * 3 + 1]) > 7) ptVel[i].y *= -1;
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

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
    Promise.all([getStartups(), getSharks(), getDeals()])
      .then(([s, sh, d]) => {
        setStartups((s.data || []).slice(0, 6));
        setSharks(sh.data || []);
        setDeals(d.data || []);
      })
      .catch(() => {});
  }, []);

  // Trigger counters when stats section visible
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

  return (
    <div className="min-h-screen" style={{ background: "#0a0d14", color: "#f0ece2", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>

      {/* ── NAVBAR ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 56px", height: 68, background: "rgba(10,13,20,0.92)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(201,168,76,0.18)" }}>
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
          <div key={i} style={{ background: "#0a0d14", padding: "40px 48px" }}>
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
