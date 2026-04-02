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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, canvas.clientWidth / canvas.clientHeight, 0.1, 300);
    camera.position.set(2.8, 1.2, 17);
    camera.lookAt(0, 0, 0);

    const resize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Lighting ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x101828, 2.5));

    // Key light — crisp top-right, gives sharp specular highlights on steel
    const key = new THREE.DirectionalLight(0xfff8ee, 3.8);
    key.position.set(10, 14, 16);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 80;
    key.shadow.camera.left = -14;
    key.shadow.camera.right = 14;
    key.shadow.camera.top = 14;
    key.shadow.camera.bottom = -14;
    key.shadow.bias = -0.0008;
    scene.add(key);

    // Strong gold rim light — backlit gold glow, bounces off metals dramatically
    const rim = new THREE.DirectionalLight(0xd4a843, 2.2);
    rim.position.set(-12, 4, -8);
    scene.add(rim);

    // Warm top fill — soft wash from above
    const topFill = new THREE.DirectionalLight(0xffe4b0, 1.1);
    topFill.position.set(0, 20, 8);
    scene.add(topFill);

    // Interior fill — warm point light inside cavity
    const fill = new THREE.PointLight(0xd4a843, 2.2, 30);
    fill.position.set(0, 0, 4);
    scene.add(fill);

    // Cold blue-grey fill from right — gives depth contrast
    const coldFill = new THREE.DirectionalLight(0x8baabb, 0.6);
    coldFill.position.set(14, -5, 10);
    scene.add(coldFill);

    // Ground bounce — dark warm
    const ground = new THREE.DirectionalLight(0x2a1a08, 0.8);
    ground.position.set(0, -12, 4);
    scene.add(ground);

    // ── Procedural steel texture using canvas ─────────────────────────────────
    function makeSteelTexture(w: number, h: number, baseColor: string, scratchOpacity = 0.18): THREE.CanvasTexture {
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d")!;
      // Base gradient
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0.0,  "#1a1e2a"); g.addColorStop(0.15, "#2e3340");
      g.addColorStop(0.30, "#181c26"); g.addColorStop(0.50, "#252b38");
      g.addColorStop(0.65, "#1c2030"); g.addColorStop(0.85, "#2a3040");
      g.addColorStop(1.0,  "#141820");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // Brushed metal horizontal lines
      ctx.globalAlpha = scratchOpacity;
      for (let i = 0; i < 90; i++) {
        const y = Math.random() * h;
        ctx.strokeStyle = Math.random() > 0.5 ? "#8899cc" : "#3a4050";
        ctx.lineWidth = Math.random() * 0.6 + 0.3;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + (Math.random()-0.5)*3); ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
      return new THREE.CanvasTexture(c);
    }

    function makeDoorTexture(): THREE.CanvasTexture {
      const c = document.createElement("canvas"); c.width = 512; c.height = 512;
      const ctx = c.getContext("2d")!;
      // Dark steel base with vertical brush direction (door face)
      const g = ctx.createLinearGradient(0, 0, 512, 0);
      g.addColorStop(0.0,  "#141824"); g.addColorStop(0.1, "#1e2435");
      g.addColorStop(0.25, "#161a28"); g.addColorStop(0.45, "#202638");
      g.addColorStop(0.60, "#181c2e"); g.addColorStop(0.80, "#1c2130");
      g.addColorStop(1.0,  "#12161e");
      ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
      // Vertical brush strokes
      ctx.globalAlpha = 0.22;
      for (let i = 0; i < 80; i++) {
        const x = Math.random() * 512;
        ctx.strokeStyle = Math.random() > 0.5 ? "#7080a8" : "#2a3040";
        ctx.lineWidth = Math.random() * 0.8 + 0.2;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (Math.random()-0.5)*4, 512); ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
      return new THREE.CanvasTexture(c);
    }

    const bodyTex = makeSteelTexture(512, 512, "#1a1e2a");
    const doorTex = makeDoorTexture();

    // ── Materials ─────────────────────────────────────────────────────────────
    const steelDark = new THREE.MeshStandardMaterial({
      map: doorTex, color: 0xffffff, metalness: 0.96, roughness: 0.22,
      envMapIntensity: 1.4,
    });
    const steelMid = new THREE.MeshStandardMaterial({
      color: 0x2a3248, metalness: 0.92, roughness: 0.32,
    });
    const steelBody = new THREE.MeshStandardMaterial({
      map: bodyTex, color: 0xffffff, metalness: 0.94, roughness: 0.28,
      envMapIntensity: 1.2,
    });
    const steelEdge = new THREE.MeshStandardMaterial({
      color: 0x3a4255, metalness: 0.98, roughness: 0.15,
    });
    // Brushed gold — high metalness, slight roughness for realism
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4a843, metalness: 1.0, roughness: 0.10,
      emissive: 0x4a2c00, emissiveIntensity: 0.15,
    });
    const goldDimMat = new THREE.MeshStandardMaterial({
      color: 0xb08c38, metalness: 0.97, roughness: 0.18,
      emissive: 0x2a1800, emissiveIntensity: 0.08,
    });
    const goldBrightMat = new THREE.MeshStandardMaterial({
      color: 0xf0c060, metalness: 1.0, roughness: 0.06,
      emissive: 0x6a3c00, emissiveIntensity: 0.25,
    });
    const interiorMat = new THREE.MeshStandardMaterial({
      color: 0x080c14, metalness: 0.3, roughness: 0.95,
    });
    const interiorShelfMat = new THREE.MeshStandardMaterial({
      color: 0x141c2c, metalness: 0.55, roughness: 0.75,
    });
    const dialFaceMat = new THREE.MeshStandardMaterial({
      color: 0x0c1018, metalness: 0.98, roughness: 0.12,
    });
    const hingeMat = new THREE.MeshStandardMaterial({
      color: 0xc8a030, metalness: 0.99, roughness: 0.08,
      emissive: 0x3a2000, emissiveIntensity: 0.2,
    });
    const boltMat = new THREE.MeshStandardMaterial({
      color: 0xaabdd0, metalness: 0.98, roughness: 0.14,
      emissive: 0x0a1020, emissiveIntensity: 0.1,
    });
    const boltEndMat = new THREE.MeshStandardMaterial({
      color: 0xd0e0f0, metalness: 1.0, roughness: 0.08,
    });
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xd4a843, metalness: 1.0, roughness: 0.08,
      emissive: 0x5a3500, emissiveIntensity: 0.3,
    });
    const handleGripMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, metalness: 0.3, roughness: 0.85,
    });
    const lockGreenMat = new THREE.MeshStandardMaterial({
      color: 0x00ff66, metalness: 0.0, roughness: 0.5,
      emissive: 0x00aa44, emissiveIntensity: 1.5,
    });

    // ── Vault group ───────────────────────────────────────────────────────────
    const vaultGroup = new THREE.Group();
    vaultGroup.position.set(-1.0, 0, 0);
    scene.add(vaultGroup);

    // ═══════════════════════════════════════════════════════════════════════
    //  VAULT BODY — thick steel shell with open front
    // ═══════════════════════════════════════════════════════════════════════
    const W = 6.2,   // width
          H = 7.6,   // height — taller for a more imposing presence
          D = 5.2;   // deep — makes the 3D look very real

    const bodyGroup = new THREE.Group();
    vaultGroup.add(bodyGroup);

    const wallT = 0.50; // thick steel walls

    // Back wall — thicker for realism
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, wallT), steelBody.clone());
    backWall.position.set(0, 0, -D / 2 + wallT / 2);
    backWall.castShadow = true; backWall.receiveShadow = true;
    bodyGroup.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, H, D), steelBody.clone());
    leftWall.position.set(-W / 2 + wallT / 2, 0, 0);
    leftWall.castShadow = true; leftWall.receiveShadow = true;
    bodyGroup.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, H, D), steelBody.clone());
    rightWall.position.set(W / 2 - wallT / 2, 0, 0);
    rightWall.castShadow = true; rightWall.receiveShadow = true;
    bodyGroup.add(rightWall);

    // Top wall
    const topWall = new THREE.Mesh(new THREE.BoxGeometry(W, wallT, D), steelBody.clone());
    topWall.position.set(0, H / 2 - wallT / 2, 0);
    topWall.castShadow = true; topWall.receiveShadow = true;
    bodyGroup.add(topWall);

    // Bottom wall
    const botWall = new THREE.Mesh(new THREE.BoxGeometry(W, wallT, D), steelBody.clone());
    botWall.position.set(0, -H / 2 + wallT / 2, 0);
    botWall.castShadow = true; botWall.receiveShadow = true;
    bodyGroup.add(botWall);

    // Interior dark cavity
    const cavity = new THREE.Mesh(
      new THREE.BoxGeometry(W - wallT * 2.1, H - wallT * 2.1, D - wallT * 1.2),
      interiorMat
    );
    cavity.position.set(0, 0, wallT * 0.3);
    bodyGroup.add(cavity);

    // Interior shelves — steel wire-style
    for (const sy of [-1.2, 0.6, 2.0]) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(W - wallT * 2.5, 0.06, D - wallT * 1.6),
        interiorShelfMat
      );
      shelf.position.set(0, sy, wallT * 0.3);
      bodyGroup.add(shelf);
      // Shelf lip — front edge strip
      const lip = new THREE.Mesh(new THREE.BoxGeometry(W - wallT * 2.5, 0.14, 0.06), interiorShelfMat);
      lip.position.set(0, sy - 0.04, D / 2 - wallT * 0.9);
      bodyGroup.add(lip);
    }

    // ── Body external reinforcement: thick corner columns ──────────────────
    const colMat = steelEdge;
    for (const [cx, cex] of [[-W / 2 + 0.12, -0.01], [W / 2 - 0.12, 0.01]] as [number, number][]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.20, H + 0.04, 0.22), colMat);
      col.position.set(cx + cex, 0, D / 2 - 0.11);
      col.castShadow = true;
      bodyGroup.add(col);
    }
    for (const ry of [-H / 2 + 0.10, H / 2 - 0.10]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(W + 0.04, 0.20, 0.22), colMat);
      beam.position.set(0, ry, D / 2 - 0.11);
      beam.castShadow = true;
      bodyGroup.add(beam);
    }

    // ── Gold accent strips on front opening frame ───────────────────────────
    for (const [sx, ex] of [[-W / 2, 0.045], [W / 2, -0.045]] as [number, number][]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.055, H, 0.055), goldDimMat);
      strip.position.set(sx + ex, 0, D / 2 - 0.03);
      bodyGroup.add(strip);
    }
    for (const sy of [-H / 2, H / 2]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(W, 0.055, 0.055), goldDimMat);
      strip.position.set(0, sy, D / 2 - 0.03);
      bodyGroup.add(strip);
    }

    // ── Manufacturer plate on body top ───────────────────────────────────────
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xc8a840, metalness: 1.0, roughness: 0.15 });
    const plate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.38, 0.055), plateMat);
    plate.position.set(0.4, H / 2 - wallT / 2, D / 2 - 1.2);
    plate.rotation.x = -0.12;
    bodyGroup.add(plate);

    // ── Bolt receiver holes on body right face ─────────────────────────────
    const boltHoleMat = new THREE.MeshStandardMaterial({ color: 0x04080e, metalness: 0.5, roughness: 0.9 });
    const boltHoleRingMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.98, roughness: 0.12 });
    for (const by of [2.5, 0.8, -0.8, -2.5]) {
      // Recess ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.055, 12, 32), boltHoleRingMat);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(W / 2 - 0.02, by, D / 2 - 0.62);
      bodyGroup.add(ring);
      // Dark hole
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.30, 20), boltHoleMat);
      hole.rotation.z = Math.PI / 2;
      hole.position.set(W / 2 - 0.08, by, D / 2 - 0.62);
      bodyGroup.add(hole);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  VAULT DOOR — massive steel slab hinged on left
    // ═══════════════════════════════════════════════════════════════════════
    const doorGroup = new THREE.Group();
    doorGroup.position.set(-W / 2 + wallT / 2, 0, D / 2);
    vaultGroup.add(doorGroup);

    const doorThickness = 0.88; // thick vault door
    const doorInnerX = W - wallT;

    // Door main body — textured brushed steel
    const doorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorInnerX, H - wallT, doorThickness),
      steelDark.clone()
    );
    doorMesh.position.set(doorInnerX / 2, 0, doorThickness / 2);
    doorMesh.castShadow = true;
    doorGroup.add(doorMesh);

    // Door bevel / chamfer edges — gold strips along perimeter
    const chamferMat = goldDimMat.clone();
    // Top chamfer
    const chamTop = new THREE.Mesh(new THREE.BoxGeometry(doorInnerX - 0.1, 0.08, 0.12), chamferMat);
    chamTop.position.set(doorInnerX / 2, (H - wallT) / 2 - 0.04, doorThickness + 0.01);
    doorGroup.add(chamTop);
    // Bottom chamfer
    const chamBot = chamTop.clone();
    chamBot.position.set(doorInnerX / 2, -(H - wallT) / 2 + 0.04, doorThickness + 0.01);
    doorGroup.add(chamBot);
    // Left chamfer
    const chamLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, H - wallT, 0.12), chamferMat);
    chamLeft.position.set(0.04, 0, doorThickness + 0.01);
    doorGroup.add(chamLeft);
    // Right chamfer
    const chamRight = chamLeft.clone();
    chamRight.position.set(doorInnerX - 0.04, 0, doorThickness + 0.01);
    doorGroup.add(chamRight);

    // ── TWO recessed decorative panels on door face ────────────────────────
    const panelW = doorInnerX * 0.78, panelD = 0.055;
    // Upper panel
    const upperPanel = new THREE.Mesh(
      new THREE.BoxGeometry(panelW, (H - wallT) * 0.36, panelD),
      steelMid.clone()
    );
    upperPanel.position.set(doorInnerX / 2, (H - wallT) * 0.24, doorThickness + panelD / 2);
    doorGroup.add(upperPanel);
    // Upper panel gold border
    const upEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(panelW + 0.06, (H - wallT) * 0.36 + 0.06, panelD)),
      new THREE.LineBasicMaterial({ color: 0xd4a843, transparent: true, opacity: 0.45 })
    );
    upEdge.position.copy(upperPanel.position);
    doorGroup.add(upEdge);

    // Lower panel — houses the lock mechanism
    const lowerPanel = new THREE.Mesh(
      new THREE.BoxGeometry(panelW, (H - wallT) * 0.52, panelD),
      steelMid.clone()
    );
    lowerPanel.position.set(doorInnerX / 2, -(H - wallT) * 0.20, doorThickness + panelD / 2);
    doorGroup.add(lowerPanel);
    const loEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(panelW + 0.06, (H - wallT) * 0.52 + 0.06, panelD)),
      new THREE.LineBasicMaterial({ color: 0xd4a843, transparent: true, opacity: 0.45 })
    );
    loEdge.position.copy(lowerPanel.position);
    doorGroup.add(loEdge);

    // ── COMBINATION LOCK DIAL SYSTEM ────────────────────────────────────────
    const dialCX = doorInnerX / 2;
    const dialCY = -(H - wallT) * 0.20; // centered on lower panel
    const dialCZ = doorThickness + panelD + 0.01;

    // Lock housing — raised cylinder base
    const lockHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(2.35, 2.40, 0.14, 64),
      steelEdge.clone()
    );
    lockHousing.rotation.x = Math.PI / 2;
    lockHousing.position.set(dialCX, dialCY, dialCZ + 0.05);
    doorGroup.add(lockHousing);

    // Housing gold ring
    const lockHousingRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.38, 0.06, 16, 100),
      goldDimMat.clone()
    );
    lockHousingRing.position.set(dialCX, dialCY, dialCZ + 0.12);
    doorGroup.add(lockHousingRing);

    // Three concentric spinning rings — the combination tumblers
    const rings: THREE.Mesh[] = [];
    const ringData = [
      { r: 1.95, tube: 0.065, mat: goldMat.clone() },
      { r: 1.42, tube: 0.055, mat: goldDimMat.clone() },
      { r: 0.95, tube: 0.048, mat: goldMat.clone() },
    ];
    for (let i = 0; i < 3; i++) {
      const rd = ringData[i];
      const ring = new THREE.Mesh(new THREE.TorusGeometry(rd.r, rd.tube, 20, 120), rd.mat);
      ring.position.set(dialCX, dialCY, dialCZ + 0.14 + i * 0.05);
      doorGroup.add(ring);
      rings.push(ring);
    }

    // Tick marks on outer ring — like a real combination dial
    const tickMat = new THREE.MeshStandardMaterial({ color: 0xf0c060, metalness: 1.0, roughness: 0.06 });
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2;
      const isMain = i % 5 === 0;
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(isMain ? 0.042 : 0.022, isMain ? 0.28 : 0.15, 0.032),
        tickMat
      );
      tick.position.set(
        dialCX + Math.cos(angle) * 1.84,
        dialCY + Math.sin(angle) * 1.84,
        dialCZ + 0.09
      );
      tick.rotation.z = angle;
      doorGroup.add(tick);
    }

    // Dial face — main heavy cylinder
    const dialFace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.78, 0.22, 64),
      dialFaceMat.clone()
    );
    dialFace.rotation.x = Math.PI / 2;
    dialFace.position.set(dialCX, dialCY, dialCZ + 0.20);
    doorGroup.add(dialFace);

    // Dial outer gold rim
    const dialRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.065, 18, 80),
      goldBrightMat.clone()
    );
    dialRim.position.set(dialCX, dialCY, dialCZ + 0.31);
    doorGroup.add(dialRim);

    // Dial knurled grip — serrated ring
    const knurlMat = new THREE.MeshStandardMaterial({ color: 0x1a1e2a, metalness: 0.8, roughness: 0.55 });
    const knurl = new THREE.Mesh(
      new THREE.TorusGeometry(0.64, 0.06, 8, 60),
      knurlMat
    );
    knurl.position.set(dialCX, dialCY, dialCZ + 0.32);
    doorGroup.add(knurl);

    // Pointer/indicator needle — glowing gold
    const needle = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.56, 0.048),
      new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0xd4a843, emissiveIntensity: 1.0, metalness: 1.0, roughness: 0.04 })
    );
    needle.position.set(dialCX, dialCY, dialCZ + 0.35);
    doorGroup.add(needle);

    // Center hub — raised gold button
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.22, 0.22, 32), goldBrightMat.clone());
    hub.rotation.x = Math.PI / 2;
    hub.position.set(dialCX, dialCY, dialCZ + 0.38);
    doorGroup.add(hub);
    // Hub face highlight
    const hubFace = new THREE.Mesh(new THREE.CircleGeometry(0.14, 32), new THREE.MeshStandardMaterial({ color: 0xffe888, metalness: 1.0, roughness: 0.04, emissive: 0x6a4000, emissiveIntensity: 0.3 }));
    hubFace.position.set(dialCX, dialCY, dialCZ + 0.50);
    doorGroup.add(hubFace);

    // ── Lock status indicator light ────────────────────────────────────────
    const lockLight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), lockGreenMat.clone());
    lockLight.position.set(dialCX, dialCY + 1.35, dialCZ + 0.20);
    doorGroup.add(lockLight);
    // Light housing
    const lightHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0x1a1e28, metalness: 0.9, roughness: 0.3 })
    );
    lightHousing.rotation.x = Math.PI / 2;
    lightHousing.position.set(dialCX, dialCY + 1.35, dialCZ + 0.15);
    doorGroup.add(lightHousing);

    // ── HANDLE — T-bar with grip ────────────────────────────────────────────
    // Real vault handles are on the right side of door, big T-bar shape
    const handleX = doorInnerX * 0.82;
    const handleZ = doorThickness + 0.12;

    // Handle base plate
    const handleBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 1.6, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x2a2e3a, metalness: 0.95, roughness: 0.20 })
    );
    handleBase.position.set(handleX, (H - wallT) * 0.04, handleZ - 0.05);
    doorGroup.add(handleBase);

    // Handle vertical rod
    const handleRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.095, 1.55, 24),
      handleMat.clone()
    );
    handleRod.position.set(handleX, (H - wallT) * 0.04, handleZ + 0.18);
    doorGroup.add(handleRod);

    // Handle cross bar (T-bar)
    const handleBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 1.10, 24),
      handleMat.clone()
    );
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(handleX, (H - wallT) * 0.04, handleZ + 0.18);
    doorGroup.add(handleBar);

    // T-bar end caps — spherical
    for (const ex of [-0.55, 0.55]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 20), goldBrightMat.clone());
      cap.position.set(handleX + ex, (H - wallT) * 0.04, handleZ + 0.18);
      doorGroup.add(cap);
    }
    // Vertical rod end caps
    for (const ey of [-0.775, 0.775]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.10, 20, 20), goldBrightMat.clone());
      cap.position.set(handleX, (H - wallT) * 0.04 + ey, handleZ + 0.18);
      doorGroup.add(cap);
    }

    // Handle grip (rubber/knurled section) in center
    for (let i = 0; i < 8; i++) {
      const grip = new THREE.Mesh(
        new THREE.TorusGeometry(0.095, 0.030, 8, 20),
        handleGripMat.clone()
      );
      grip.rotation.y = Math.PI / 2;
      grip.rotation.z = Math.PI / 2;
      grip.position.set(handleX, (H - wallT) * 0.04 + (i - 3.5) * 0.12, handleZ + 0.18);
      doorGroup.add(grip);
    }

    // ── LOCK BOLTS — heavy steel rods on right side ─────────────────────────
    const bolts: THREE.Mesh[] = [];
    for (const by of [2.5, 0.8, -0.8, -2.5]) {
      // Main bolt cylinder — chrome steel look
      const bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.95, 24),
        boltMat.clone()
      );
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(doorInnerX + 0.12, by, doorThickness / 2);
      doorGroup.add(bolt);
      bolts.push(bolt);

      // Bolt neck — narrower connection
      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.20, 20),
        boltMat.clone()
      );
      neck.rotation.z = Math.PI / 2;
      neck.position.set(doorInnerX - 0.04, by, doorThickness / 2);
      doorGroup.add(neck);

      // Bolt rounded end cap
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), boltEndMat.clone());
      cap.position.set(doorInnerX + 0.60, by, doorThickness / 2);
      doorGroup.add(cap);

      // Specular highlight band on bolt
      const highlight = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.025, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.02, emissive: 0xaaccff, emissiveIntensity: 0.15 })
      );
      highlight.rotation.y = Math.PI / 2;
      highlight.position.set(doorInnerX + 0.40, by, doorThickness / 2);
      doorGroup.add(highlight);
    }

    // ── HINGES — 3 massive barrel hinges on left ────────────────────────────
    for (const hy of [2.8, 0, -2.8]) {
      // Outer hinge leaf
      const outerLeaf = new THREE.Mesh(
        new THREE.BoxGeometry(0.30, 1.05, 0.22),
        hingeMat.clone()
      );
      outerLeaf.position.set(-0.02, hy, doorThickness / 2);
      outerLeaf.castShadow = true;
      doorGroup.add(outerLeaf);

      // Inner hinge leaf (on body side)
      const innerLeaf = outerLeaf.clone();
      innerLeaf.position.set(-0.26, hy, doorThickness / 2);
      doorGroup.add(innerLeaf);

      // Hinge barrel / knuckle
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 1.10, 20),
        goldBrightMat.clone()
      );
      barrel.position.set(-0.12, hy, doorThickness / 2);
      doorGroup.add(barrel);

      // Hinge pin — protruding at top and bottom
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.30, 16), goldMat.clone());
      pin.position.set(-0.12, hy, doorThickness / 2);
      doorGroup.add(pin);

      // Bolt holes on hinge plates
      for (const bhy of [hy - 0.3, hy + 0.3]) {
        for (const bhx of [0.00, -0.24]) {
          const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.26, 12), boltEndMat.clone());
          bolt.rotation.x = Math.PI / 2;
          bolt.position.set(bhx, bhy, doorThickness / 2);
          doorGroup.add(bolt);
        }
      }
    }

    // ── CORNER RIVETS / SECURITY BOLTS ─────────────────────────────────────
    const rivetMat = new THREE.MeshStandardMaterial({
      color: 0xd4a843, metalness: 1.0, roughness: 0.06,
      emissive: 0x4a2800, emissiveIntensity: 0.25,
    });
    const rivetPositions: [number, number][] = [
      [doorInnerX * 0.12, (H - wallT) * 0.44],
      [doorInnerX * 0.88, (H - wallT) * 0.44],
      [doorInnerX * 0.12, -(H - wallT) * 0.44],
      [doorInnerX * 0.88, -(H - wallT) * 0.44],
    ];
    for (const [rx, ry] of rivetPositions) {
      // Rivet head
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.145, 20, 20), rivetMat);
      rivet.position.set(rx, ry, doorThickness + 0.08);
      doorGroup.add(rivet);
      // Rivet ring washer
      const washer = new THREE.Mesh(
        new THREE.TorusGeometry(0.20, 0.035, 10, 32),
        goldDimMat.clone()
      );
      washer.position.copy(rivet.position);
      washer.position.z -= 0.04;
      doorGroup.add(washer);
    }

    // ── Floating particles ───────────────────────────────────────────────────
    const ptCount = 200;
    const ptPos = new Float32Array(ptCount * 3);
    const ptVel: { x: number; y: number }[] = [];
    for (let i = 0; i < ptCount; i++) {
      ptPos[i * 3]     = (Math.random() - 0.5) * 24;
      ptPos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      ptPos[i * 3 + 2] = (Math.random() - 0.5) * 14 - 3;
      ptVel.push({ x: (Math.random() - 0.5) * 0.006, y: (Math.random() - 0.5) * 0.006 });
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(ptPos, 3));
    const particles = new THREE.Points(ptGeo,
      new THREE.PointsMaterial({ color: 0xd4a843, size: 0.038, transparent: true, opacity: 0.50 }));
    scene.add(particles);

    // ── Ground shadow plane ──────────────────────────────────────────────────
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(35, 22),
      new THREE.ShadowMaterial({ opacity: 0.50 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -H / 2 - 0.24;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // ── Mouse interaction ────────────────────────────────────────────────────
    let targetRotX = 0.14, targetRotY = 0.30;
    let curRotX = 0.14, curRotY = 0.30;
    let hovering = false;

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      targetRotY = ((e.clientX - r.left) / r.width - 0.5) * 0.80 + 0.22;
      targetRotX = -((e.clientY - r.top) / r.height - 0.5) * 0.50 + 0.10;
      hovering = true;
    };
    const onLeave = () => { hovering = false; };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    // ── Animation loop ────────────────────────────────────────────────────────
    let t = 0, rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.013;

      // Smooth rotation follow
      curRotX += (targetRotX - curRotX) * 0.052;
      curRotY += (targetRotY - curRotY) * 0.052;
      if (!hovering) targetRotY = Math.sin(t * 0.26) * 0.26 + 0.24;

      vaultGroup.rotation.x = curRotX;
      vaultGroup.rotation.y = curRotY;

      // Needle slow spin — like someone slowly dialing the combination
      needle.rotation.z = t * 0.65;

      // Rings counter-rotate at different speeds with breathing opacity
      rings[0].rotation.z =  t * 0.16;
      rings[1].rotation.z = -t * 0.10;
      rings[2].rotation.z =  t * 0.07;
      rings.forEach((r, i) => {
        (r.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.10 + Math.sin(t * 0.9 + i * 1.2) * 0.08;
      });

      // Lock light pulsing — green glow that breathes
      (lockLight.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.8 + Math.sin(t * 1.8) * 0.5;

      // Bolt subtle movement — very slight oscillation suggests they could slide
      bolts.forEach((b, i) => {
        b.position.x = doorInnerX + 0.12 + Math.sin(t * 0.4 + i * 0.9) * 0.015;
      });

      // Pulsing interior fill light
      fill.intensity = 1.8 + Math.sin(t * 0.70) * 0.55;
      fill.color.setHSL(0.11 + Math.sin(t * 0.35) * 0.015, 0.75, 0.42);

      // Particles drift
      const pos = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < ptCount; i++) {
        pos[i * 3]     += ptVel[i].x;
        pos[i * 3 + 1] += ptVel[i].y;
        if (Math.abs(pos[i * 3]) > 12)    ptVel[i].x *= -1;
        if (Math.abs(pos[i * 3 + 1]) > 9) ptVel[i].y *= -1;
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
