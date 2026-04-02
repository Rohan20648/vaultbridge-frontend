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
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
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
    scene.add(new THREE.AmbientLight(0x0d1020, 1.2));

    // Key light — warm top-left front
    const key = new THREE.DirectionalLight(0xfff4e0, 2.4);
    key.position.set(8, 12, 14);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 60;
    key.shadow.camera.left = -12;
    key.shadow.camera.right = 12;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    key.shadow.bias = -0.001;
    scene.add(key);

    // Gold rim — bounces warm gold from behind/left
    const rim = new THREE.DirectionalLight(0xc9a84c, 1.2);
    rim.position.set(-10, 3, -6);
    scene.add(rim);

    // Interior fill — soft warm point inside vault opening
    const fill = new THREE.PointLight(0xc9a84c, 1.4, 40);
    fill.position.set(0, 0, 5);
    scene.add(fill);

    // Ground bounce
    const ground = new THREE.DirectionalLight(0x1a2040, 0.5);
    ground.position.set(0, -10, 5);
    scene.add(ground);

    // ── Materials ─────────────────────────────────────────────────────────────
    const steelDark = new THREE.MeshStandardMaterial({ color: 0x1c2030, metalness: 0.92, roughness: 0.28 });
    const steelMid  = new THREE.MeshStandardMaterial({ color: 0x252d3e, metalness: 0.88, roughness: 0.35 });
    const steelBody = new THREE.MeshStandardMaterial({ color: 0x141824, metalness: 0.90, roughness: 0.30 });
    const goldMat   = new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: 1.0,  roughness: 0.12, emissive: 0x3a2500, emissiveIntensity: 0.2 });
    const goldDimMat= new THREE.MeshStandardMaterial({ color: 0x9a7830, metalness: 0.95, roughness: 0.20 });
    const interiorMat = new THREE.MeshStandardMaterial({ color: 0x0a0e18, metalness: 0.4, roughness: 0.9 });
    const dialFaceMat = new THREE.MeshStandardMaterial({ color: 0x101520, metalness: 0.95, roughness: 0.18 });

    // ── Vault group ───────────────────────────────────────────────────────────
    const vaultGroup = new THREE.Group();
    // Slight 3/4 view angle — shift left so vault sits right of centre on page
    vaultGroup.position.set(-1.0, 0, 0);
    scene.add(vaultGroup);

    // ═══════════════════════════════════════════════════════════════════════
    //  VAULT BODY — a thick box with open front face (the cavity)
    // ═══════════════════════════════════════════════════════════════════════
    const W = 6.0,  // width
          H = 7.2,  // height
          D = 4.8;  // depth — this is what makes it look like a real safe, not a book

    const bodyGroup = new THREE.Group();
    vaultGroup.add(bodyGroup);

    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.35), steelBody.clone());
    backWall.position.set(0, 0, -D / 2 + 0.175);
    backWall.castShadow = true; backWall.receiveShadow = true;
    bodyGroup.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, H, D), steelBody.clone());
    leftWall.position.set(-W / 2 + 0.2, 0, 0);
    leftWall.castShadow = true; leftWall.receiveShadow = true;
    bodyGroup.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, H, D), steelBody.clone());
    rightWall.position.set(W / 2 - 0.2, 0, 0);
    rightWall.castShadow = true; rightWall.receiveShadow = true;
    bodyGroup.add(rightWall);

    // Top wall
    const topWall = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, D), steelBody.clone());
    topWall.position.set(0, H / 2 - 0.2, 0);
    topWall.castShadow = true; topWall.receiveShadow = true;
    bodyGroup.add(topWall);

    // Bottom wall
    const botWall = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, D), steelBody.clone());
    botWall.position.set(0, -H / 2 + 0.2, 0);
    botWall.castShadow = true; botWall.receiveShadow = true;
    bodyGroup.add(botWall);

    // Interior floor/ceiling/back — dark cavity
    const cavity = new THREE.Mesh(new THREE.BoxGeometry(W - 0.82, H - 0.82, D - 0.4), interiorMat);
    cavity.position.set(0, 0, 0);
    bodyGroup.add(cavity);

    // Interior shelves
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x1a2030, metalness: 0.6, roughness: 0.7 });
    for (const sy of [-1.0, 0.8]) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(W - 1.0, 0.08, D - 0.6), shelfMat);
      shelf.position.set(0, sy, 0);
      bodyGroup.add(shelf);
    }

    // Body outer gold trim lines — edges along front face opening
    const frontFrameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(W + 0.06, H + 0.06, 0.12));
    const frontFrame = new THREE.LineSegments(frontFrameGeo,
      new THREE.LineBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.5 }));
    frontFrame.position.z = D / 2;
    bodyGroup.add(frontFrame);

    // Body corner vertical gold strips
    for (const [sx, ex] of [[-W / 2, 0.04], [W / 2, -0.04]] as [number, number][]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, H, 0.08), goldDimMat);
      strip.position.set(sx + ex, 0, D / 2 - 0.04);
      bodyGroup.add(strip);
    }
    for (const sy of [-H / 2, H / 2]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, 0.08), goldDimMat);
      strip.position.set(0, sy, D / 2 - 0.04);
      bodyGroup.add(strip);
    }

    // Bolt holes on body sides (right side) — cylindrical recesses
    const holeRingMat = new THREE.MeshStandardMaterial({ color: 0x0a0d14, metalness: 0.6, roughness: 0.9 });
    for (const by of [2.2, 0.7, -0.7, -2.2]) {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.45, 20), holeRingMat);
      hole.rotation.z = Math.PI / 2;
      hole.position.set(W / 2 - 0.05, by, D / 2 - 0.6);
      bodyGroup.add(hole);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  VAULT DOOR — thick slab hinged on left
    // ═══════════════════════════════════════════════════════════════════════
    const doorGroup = new THREE.Group();
    // Hinge pivot at left edge of door, at z = D/2 (front face of body)
    doorGroup.position.set(-W / 2 + 0.2, 0, D / 2);
    vaultGroup.add(doorGroup);

    const doorThickness = 0.72;
    const doorInnerX = W - 0.4; // slightly narrower than body opening

    // Door body
    const doorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorInnerX, H - 0.4, doorThickness),
      steelDark.clone()
    );
    doorMesh.position.set(doorInnerX / 2, 0, doorThickness / 2);
    doorMesh.castShadow = true;
    doorGroup.add(doorMesh);

    // Door edge bevel highlight — gold
    const doorEdgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(doorInnerX + 0.06, H - 0.34, doorThickness + 0.04));
    const doorEdge = new THREE.LineSegments(doorEdgeGeo,
      new THREE.LineBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.55 }));
    doorEdge.position.set(doorInnerX / 2, 0, doorThickness / 2);
    doorGroup.add(doorEdge);

    // Door recessed panel
    const panelW = doorInnerX - 1.0, panelH = H - 1.6, panelD = 0.10;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(panelW, panelH, panelD), steelMid);
    panel.position.set(doorInnerX / 2, 0, doorThickness + panelD / 2 - 0.01);
    doorGroup.add(panel);
    const panelEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(panelW + 0.04, panelH + 0.04, panelD)),
      new THREE.LineBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.28 })
    );
    panelEdge.position.copy(panel.position);
    doorGroup.add(panelEdge);

    // ── Combination lock dial system ────────────────────────────────────────
    const dialCX = doorInnerX / 2, dialCZ = doorThickness + 0.01;

    // Outer ring mount — thick ring flush with door
    const mountRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.05, 0.14, 20, 100),
      goldDimMat.clone()
    );
    mountRing.position.set(dialCX, 0, dialCZ + 0.06);
    doorGroup.add(mountRing);

    // Spinning rings (3 concentric)
    const rings: THREE.Mesh[] = [];
    const ringRadii = [1.65, 1.22, 0.84];
    for (let i = 0; i < 3; i++) {
      const rMat = goldMat.clone();
      rMat.transparent = true;
      rMat.opacity = 0.75 - i * 0.14;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(ringRadii[i], 0.055 - i * 0.008, 18, 120),
        rMat
      );
      ring.position.set(dialCX, 0, dialCZ + 0.10 + i * 0.04);
      doorGroup.add(ring);
      rings.push(ring);
    }

    // Tick marks on outer ring
    const tickMat = new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: 1.0, roughness: 0.1 });
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const isMain = i % 5 === 0;
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(isMain ? 0.05 : 0.03, isMain ? 0.22 : 0.12, 0.04),
        tickMat
      );
      tick.position.set(
        dialCX + Math.cos(angle) * 1.95,
        Math.sin(angle) * 1.95,
        dialCZ + 0.07
      );
      tick.rotation.z = angle;
      doorGroup.add(tick);
    }

    // Dial face — main cylinder
    const dialFace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.72, 0.20, 64),
      dialFaceMat
    );
    dialFace.rotation.x = Math.PI / 2;
    dialFace.position.set(dialCX, 0, dialCZ + 0.16);
    doorGroup.add(dialFace);

    // Dial rim ring
    const dialRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.06, 16, 80),
      goldMat.clone()
    );
    dialRim.position.set(dialCX, 0, dialCZ + 0.26);
    doorGroup.add(dialRim);

    // Indicator needle
    const needle = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.52, 0.055),
      new THREE.MeshStandardMaterial({ color: 0xe8d080, emissive: 0xc9a84c, emissiveIntensity: 0.6, metalness: 1.0, roughness: 0.05 })
    );
    needle.position.set(dialCX, 0, dialCZ + 0.30);
    doorGroup.add(needle);

    // Center hub
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.18, 32),
      goldMat.clone()
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.set(dialCX, 0, dialCZ + 0.30);
    doorGroup.add(hub);

    // ── Lock bolts — protruding cylinders on right edge ─────────────────────
    const boltGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.80, 20);
    for (const by of [2.2, 0.7, -0.7, -2.2]) {
      const bolt = new THREE.Mesh(boltGeo, goldDimMat.clone());
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(doorInnerX + 0.10, by, doorThickness / 2);
      doorGroup.add(bolt);

      // Bolt tip cap
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), goldMat.clone());
      cap.position.set(doorInnerX + 0.50, by, doorThickness / 2);
      doorGroup.add(cap);
    }

    // ── Hinges — left edge, 3 hinges ────────────────────────────────────────
    const hingeBodyGeo = new THREE.BoxGeometry(0.30, 0.90, 0.30);
    const hingeMat = new THREE.MeshStandardMaterial({ color: 0xb09840, metalness: 0.98, roughness: 0.12 });
    for (const hy of [2.4, 0, -2.4]) {
      const h = new THREE.Mesh(hingeBodyGeo, hingeMat);
      h.position.set(-0.05, hy, doorThickness / 2);
      doorGroup.add(h);

      // Hinge pin
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 16), goldMat.clone());
      pin.position.set(-0.05, hy, doorThickness / 2);
      doorGroup.add(pin);
    }

    // ── Corner rivets ───────────────────────────────────────────────────────
    const rivetMat = new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: 1.0, roughness: 0.08, emissive: 0x2a1800, emissiveIntensity: 0.3 });
    for (const [rx, ry] of [
      [doorInnerX * 0.2, H * 0.36],
      [doorInnerX * 0.8, H * 0.36],
      [doorInnerX * 0.2, -H * 0.36],
      [doorInnerX * 0.8, -H * 0.36],
    ] as [number, number][]) {
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), rivetMat);
      rivet.position.set(rx, ry, doorThickness + 0.06);
      doorGroup.add(rivet);

      // Rivet ring
      const rRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.03, 8, 32),
        goldDimMat.clone()
      );
      rRing.position.copy(rivet.position);
      doorGroup.add(rRing);
    }

    // ── Floating particles ───────────────────────────────────────────────────
    const ptCount = 150;
    const ptPos = new Float32Array(ptCount * 3);
    const ptVel: { x: number; y: number }[] = [];
    for (let i = 0; i < ptCount; i++) {
      ptPos[i * 3]     = (Math.random() - 0.5) * 22;
      ptPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      ptPos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
      ptVel.push({ x: (Math.random() - 0.5) * 0.007, y: (Math.random() - 0.5) * 0.007 });
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(ptPos, 3));
    const particles = new THREE.Points(ptGeo,
      new THREE.PointsMaterial({ color: 0xc9a84c, size: 0.045, transparent: true, opacity: 0.45 }));
    scene.add(particles);

    // ── Ground shadow plane ──────────────────────────────────────────────────
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 20),
      new THREE.ShadowMaterial({ opacity: 0.35 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -H / 2 - 0.22;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // ── Mouse interaction ────────────────────────────────────────────────────
    // Default angle: slightly tilted so you see depth + top face clearly
    let targetRotX = 0.18, targetRotY = 0.32;
    let curRotX = 0.18, curRotY = 0.32;
    let hovering = false;

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      targetRotY = ((e.clientX - r.left) / r.width - 0.5) * 0.85 + 0.2;
      targetRotX = -((e.clientY - r.top)  / r.height - 0.5) * 0.55 + 0.12;
      hovering = true;
    };
    const onLeave = () => { hovering = false; };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    // ── Animation loop ────────────────────────────────────────────────────────
    let t = 0, rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.014;

      // Smooth rotation follow
      curRotX += (targetRotX - curRotX) * 0.055;
      curRotY += (targetRotY - curRotY) * 0.055;
      if (!hovering) targetRotY = Math.sin(t * 0.28) * 0.28 + 0.22;

      vaultGroup.rotation.x = curRotX;
      vaultGroup.rotation.y = curRotY;

      // Needle spin
      needle.rotation.z = t * 0.75;

      // Rings counter-rotate at different speeds
      rings[0].rotation.z =  t * 0.18;
      rings[1].rotation.z = -t * 0.12;
      rings[2].rotation.z =  t * 0.08;
      rings.forEach((r, i) => {
        (r.material as THREE.MeshStandardMaterial).opacity =
          0.60 + Math.sin(t * 1.1 + i * 1.4) * 0.18;
      });

      // Pulsing fill light
      fill.intensity = 1.1 + Math.sin(t * 0.85) * 0.4;

      // Particles drift
      const pos = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < ptCount; i++) {
        pos[i * 3]     += ptVel[i].x;
        pos[i * 3 + 1] += ptVel[i].y;
        if (Math.abs(pos[i * 3]) > 11)     ptVel[i].x *= -1;
        if (Math.abs(pos[i * 3 + 1]) > 8)  ptVel[i].y *= -1;
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
