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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
    camera.position.set(0, 0.5, 16);
    camera.lookAt(0, 0, 0);

    const resize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Materials ──────────────────────────────────────────────────────────────
    const steelDark   = new THREE.MeshStandardMaterial({ color: 0x1c2030, metalness: 0.95, roughness: 0.20 });
    const steelMid    = new THREE.MeshStandardMaterial({ color: 0x2e3340, metalness: 0.92, roughness: 0.22 });
    const steelLight  = new THREE.MeshStandardMaterial({ color: 0x3d4255, metalness: 0.90, roughness: 0.25 });
    const goldMat     = new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: 1.00, roughness: 0.08, emissive: 0x3a2800, emissiveIntensity: 0.15 });
    const goldDull    = new THREE.MeshStandardMaterial({ color: 0xa88838, metalness: 0.98, roughness: 0.18 });
    const chromeMat   = new THREE.MeshStandardMaterial({ color: 0xd0d8e8, metalness: 1.00, roughness: 0.04 });
    const dialFaceMat = new THREE.MeshStandardMaterial({ color: 0x0a0e18, metalness: 0.7,  roughness: 0.35 });
    const blackMat    = new THREE.MeshStandardMaterial({ color: 0x060810, metalness: 0.5,  roughness: 0.5  });

    // ── Lighting ───────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0d1020, 1.0));

    // Key light — warm top-right
    const keyLight = new THREE.SpotLight(0xfff0cc, 3.5, 60, Math.PI / 5, 0.4, 1.2);
    keyLight.position.set(10, 14, 16);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Rim light — cool blue-purple from behind-left
    const rimLight = new THREE.DirectionalLight(0x4466cc, 0.5);
    rimLight.position.set(-12, 4, -8);
    scene.add(rimLight);

    // Gold fill — subtle warm fill from front
    const fillLight = new THREE.PointLight(0xc9a84c, 0.9, 25);
    fillLight.position.set(-3, 0, 8);
    scene.add(fillLight);

    // Ground bounce
    const bounceLight = new THREE.PointLight(0x8866aa, 0.3, 20);
    bounceLight.position.set(0, -8, 4);
    scene.add(bounceLight);

    // ── Scene root group ───────────────────────────────────────────────────────
    const vaultGroup = new THREE.Group();
    scene.add(vaultGroup);

    // ── VAULT BODY (the thick casing behind the door) ──────────────────────────
    const bodyGroup = new THREE.Group();
    vaultGroup.add(bodyGroup);

    // Main thick body — deep dark steel box
    const bodyW = 6.8, bodyH = 8.2, bodyD = 2.8;
    const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), steelDark.clone());
    body.position.z = -bodyD / 2 - 0.3;
    body.castShadow = true; body.receiveShadow = true;
    bodyGroup.add(body);

    // Body edge bevels — layered outlines for depth
    const bodyEdge1 = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(bodyW + 0.05, bodyH + 0.05, bodyD + 0.05)),
      new THREE.LineBasicMaterial({ color: 0x3a4060, transparent: true, opacity: 0.8 })
    );
    bodyEdge1.position.copy(body.position);
    bodyGroup.add(bodyEdge1);

    // Body surface panels — raised rectangular panels on body sides
    const sidePanelMat = steelMid.clone();
    const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.6, bodyH - 0.6, 0.08), sidePanelMat);
    sidePanel.position.z = body.position.z + bodyD / 2 + 0.04;
    bodyGroup.add(sidePanel);

    // ── DOOR FRAME (thick surround welded to body) ─────────────────────────────
    const frameW = 6.2, frameH = 7.6, frameThick = 0.55, frameMat = steelLight.clone();
    // Top bar
    bodyGroup.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(frameW, frameThick, 0.9), frameMat), { position: new THREE.Vector3(0, frameH / 2 - frameThick / 2, 0) }));
    // Bottom bar
    bodyGroup.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(frameW, frameThick, 0.9), frameMat.clone()), { position: new THREE.Vector3(0, -(frameH / 2 - frameThick / 2), 0) }));
    // Left bar
    bodyGroup.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(frameThick, frameH, 0.9), frameMat.clone()), { position: new THREE.Vector3(-(frameW / 2 - frameThick / 2), 0, 0) }));
    // Right bar (bolt side)
    bodyGroup.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(frameThick, frameH, 0.9), frameMat.clone()), { position: new THREE.Vector3(frameW / 2 - frameThick / 2, 0, 0) }));

    // Gold frame trim edges
    for (const [x, y, w, h] of [
      [0, frameH / 2 - frameThick / 2, frameW, frameThick],
      [0, -(frameH / 2 - frameThick / 2), frameW, frameThick],
      [-(frameW / 2 - frameThick / 2), 0, frameThick, frameH],
      [frameW / 2 - frameThick / 2, 0, frameThick, frameH],
    ] as [number, number, number, number][]) {
      const tl = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 0.02, h + 0.02, 0.92)),
        new THREE.LineBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.35 })
      );
      tl.position.set(x, y, 0);
      bodyGroup.add(tl);
    }

    // ── DOOR LEAF ──────────────────────────────────────────────────────────────
    const doorGroup = new THREE.Group();
    vaultGroup.add(doorGroup);

    // Door slab
    const doorW = 5.6, doorH = 7.0, doorThick = 0.7;
    const doorSlab = new THREE.Mesh(
      new THREE.BoxGeometry(doorW, doorH, doorThick),
      new THREE.MeshStandardMaterial({ color: 0x1a1e2e, metalness: 0.93, roughness: 0.22 })
    );
    doorSlab.castShadow = true; doorSlab.receiveShadow = true;
    doorGroup.add(doorSlab);

    // Door edge gold line trim
    const doorEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(doorW + 0.03, doorH + 0.03, doorThick + 0.03)),
      new THREE.LineBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.55 })
    );
    doorGroup.add(doorEdge);

    // Inner recessed panel on door
    const recessW = 4.2, recessH = 5.6, recessD = 0.12;
    const recess = new THREE.Mesh(
      new THREE.BoxGeometry(recessW, recessH, recessD),
      new THREE.MeshStandardMaterial({ color: 0x0d1020, metalness: 0.85, roughness: 0.35 })
    );
    recess.position.z = doorThick / 2 + recessD / 2 - 0.02;
    doorGroup.add(recess);

    // Recess bevel trim
    const recessEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(recessW + 0.04, recessH + 0.04, recessD)),
      new THREE.LineBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.25 })
    );
    recessEdge.position.copy(recess.position);
    doorGroup.add(recessEdge);

    // ── LOCKING BOLTS (right side — thick, cylindrical, protruding) ────────────
    const boltPositionsY = [2.6, 1.1, -0.4, -1.9];
    const boltMeshes: THREE.Mesh[] = [];
    const boltGeo = new THREE.CylinderGeometry(0.175, 0.175, 1.4, 20);
    for (const by of boltPositionsY) {
      // Bolt cylinder
      const bolt = new THREE.Mesh(boltGeo, goldDull.clone());
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(doorW / 2 + 0.7, by, 0);
      boltMeshes.push(bolt);
      doorGroup.add(bolt);

      // Bolt end cap
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.185, 0.185, 0.08, 20),
        chromeMat.clone()
      );
      cap.rotation.z = Math.PI / 2;
      cap.position.set(doorW / 2 + 1.4, by, 0);
      doorGroup.add(cap);

      // Bolt housing on door face
      const housing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.26, 0.22, 20),
        steelMid.clone()
      );
      housing.rotation.z = Math.PI / 2;
      housing.position.set(doorW / 2 + 0.1, by, 0);
      doorGroup.add(housing);

      // Gold ring accent on housing
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.26, 0.025, 10, 30),
        goldMat.clone()
      );
      ring.rotation.y = Math.PI / 2;
      ring.position.set(doorW / 2 + 0.14, by, 0);
      doorGroup.add(ring);
    }

    // Bolt guide rail (vertical bar on right side door face)
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 6.2, 0.18),
      steelMid.clone()
    );
    rail.position.set(doorW / 2 + 0.06, 0.3, 0.05);
    doorGroup.add(rail);

    // ── HINGES (left side — thick, industrial) ─────────────────────────────────
    const hingePositionsY = [2.8, -2.8];
    for (const hy of hingePositionsY) {
      // Hinge block
      const hinge = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 1.0, 1.0),
        goldDull.clone()
      );
      hinge.position.set(-doorW / 2 - 0.25, hy, 0);
      doorGroup.add(hinge);

      // Hinge pin
      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 1.15, 12),
        chromeMat.clone()
      );
      pin.position.set(-doorW / 2 - 0.25, hy, 0);
      doorGroup.add(pin);

      // Hinge rivet details
      for (const rz of [-0.3, 0.3]) {
        const rivet = new THREE.Mesh(
          new THREE.SphereGeometry(0.065, 10, 10),
          chromeMat.clone()
        );
        rivet.position.set(-doorW / 2 - 0.1, hy + rz, 0.52);
        doorGroup.add(rivet);
      }
    }

    // ── COMBINATION DIAL ASSEMBLY ──────────────────────────────────────────────
    const dialGroup = new THREE.Group();
    dialGroup.position.set(0, 0.4, doorThick / 2);
    doorGroup.add(dialGroup);

    // Outer bezel ring (thick chrome ring)
    const bezel = new THREE.Mesh(
      new THREE.TorusGeometry(1.28, 0.18, 24, 80),
      chromeMat.clone()
    );
    dialGroup.add(bezel);

    // Bezel inner ring (dark groove)
    dialGroup.add(new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.06, 16, 60),
      blackMat.clone()
    ));

    // Rotating dial face (will spin in animate)
    const dialFace = new THREE.Mesh(
      new THREE.CylinderGeometry(1.08, 1.08, 0.14, 80),
      dialFaceMat.clone()
    );
    dialFace.rotation.x = Math.PI / 2;
    dialGroup.add(dialFace);

    // Dial face tick marks and number rings
    const tickMat = new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: 1.0, roughness: 0.1, emissive: 0xc9a84c, emissiveIntensity: 0.08 });
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const isMajor = i % 5 === 0;
      const len = isMajor ? 0.16 : 0.08;
      const r = 0.90;
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(isMajor ? 0.025 : 0.015, len, 0.03),
        tickMat.clone()
      );
      tick.position.set(Math.sin(angle) * r, Math.cos(angle) * r, 0.075);
      tick.rotation.z = -angle;
      dialFace.add(tick);
    }

    // Dial center knob
    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.27, 0.28, 32),
      new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: 1.0, roughness: 0.06 })
    );
    knob.rotation.x = Math.PI / 2;
    knob.position.z = 0.13;
    dialGroup.add(knob);

    // Knob grip ridges (lathe-style grooves)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.035, 0.26),
        new THREE.MeshStandardMaterial({ color: 0x9a7830, metalness: 0.95, roughness: 0.2 })
      );
      ridge.position.set(Math.cos(angle) * 0.24, Math.sin(angle) * 0.24, 0.13);
      ridge.rotation.z = angle;
      dialGroup.add(ridge);
    }

    // Indicator line (pointer at 12 o'clock on bezel)
    const pointerGeo = new THREE.BoxGeometry(0.04, 0.22, 0.05);
    const pointer = new THREE.Mesh(pointerGeo, new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xffaa00, emissiveIntensity: 0.6, metalness: 0.8, roughness: 0.1 }));
    pointer.position.set(0, 1.28, 0.02);
    dialGroup.add(pointer);

    // ── HANDLE ASSEMBLY (T-bar style) ─────────────────────────────────────────
    const handleGroup = new THREE.Group();
    handleGroup.position.set(1.6, -0.8, doorThick / 2);
    doorGroup.add(handleGroup);

    // Handle shaft (vertical bar)
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 1.4, 20),
      chromeMat.clone()
    );
    handleGroup.add(shaft);

    // Handle crossbar (horizontal T)
    const crossbar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.85, 16),
      chromeMat.clone()
    );
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.y = 0.5;
    handleGroup.add(crossbar);

    // Handle end caps
    for (const ex of [-0.425, 0.425]) {
      const ecap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), goldMat.clone());
      ecap.position.set(ex, 0.5, 0);
      handleGroup.add(ecap);
    }

    // Handle mounting base plate
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.45, 0.1),
      goldDull.clone()
    );
    plate.position.set(0, -0.65, -0.08);
    handleGroup.add(plate);

    // ── CORNER BOLTS (decorative, all 4 corners) ───────────────────────────────
    const cornerPositions: [number, number][] = [[-2.4, 3.1], [2.4, 3.1], [-2.4, -3.1], [2.4, -3.1]];
    for (const [cx, cy] of cornerPositions) {
      const boltHead = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.16, 8),
        goldMat.clone()
      );
      boltHead.rotation.x = Math.PI / 2;
      boltHead.position.set(cx, cy, doorThick / 2 + 0.08);
      doorGroup.add(boltHead);

      // Hex outline
      const hexEdge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 6)),
        new THREE.LineBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.5 })
      );
      hexEdge.rotation.x = Math.PI / 2;
      hexEdge.position.set(cx, cy, doorThick / 2 + 0.08);
      doorGroup.add(hexEdge);
    }

    // ── BRAND PLATE ────────────────────────────────────────────────────────────
    const brandPlate = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.38, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x0a0d15, metalness: 0.7, roughness: 0.4 })
    );
    brandPlate.position.set(0, -2.9, doorThick / 2 + 0.02);
    doorGroup.add(brandPlate);

    const brandEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.85, 0.42, 0.05)),
      new THREE.LineBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.4 })
    );
    brandEdge.position.copy(brandPlate.position);
    doorGroup.add(brandEdge);

    // ── FLOATING GOLD PARTICLES ────────────────────────────────────────────────
    const ptCount = 90;
    const ptPos = new Float32Array(ptCount * 3);
    const ptVel: { x: number; y: number }[] = [];
    for (let i = 0; i < ptCount; i++) {
      ptPos[i * 3]     = (Math.random() - 0.5) * 22;
      ptPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      ptPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 3;
      ptVel.push({ x: (Math.random() - 0.5) * 0.006, y: (Math.random() - 0.5) * 0.006 });
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(ptPos, 3));
    const particles = new THREE.Points(
      ptGeo,
      new THREE.PointsMaterial({ color: 0xc9a84c, size: 0.035, transparent: true, opacity: 0.45 })
    );
    scene.add(particles);

    // ── MOUSE INTERACTION ──────────────────────────────────────────────────────
    let targetRotX = 0.06, targetRotY = 0.18, curRotX = 0.06, curRotY = 0.18;
    let hovering = false;
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      targetRotY = ((e.clientX - r.left) / r.width - 0.5) * 0.55;
      targetRotX = -((e.clientY - r.top) / r.height - 0.5) * 0.4;
      hovering = true;
    };
    const onLeave = () => { hovering = false; };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    // ── ANIMATE ────────────────────────────────────────────────────────────────
    let t = 0, rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.016;

      curRotX += (targetRotX - curRotX) * 0.055;
      curRotY += (targetRotY - curRotY) * 0.055;
      if (!hovering) {
        targetRotY = Math.sin(t * 0.25) * 0.2 + 0.12;
        targetRotX = Math.sin(t * 0.18) * 0.04 + 0.04;
      }
      vaultGroup.rotation.x = curRotX;
      vaultGroup.rotation.y = curRotY;

      // Slowly spin dial face
      dialFace.rotation.z = t * 0.18;

      // Pulsing gold fill
      fillLight.intensity = 0.7 + Math.sin(t * 1.1) * 0.25;
      fillLight.position.x = -3 + Math.sin(t * 0.4) * 1.5;

      // Particles drift
      const pos = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < ptCount; i++) {
        pos[i * 3]     += ptVel[i].x;
        pos[i * 3 + 1] += ptVel[i].y;
        if (Math.abs(pos[i * 3])     > 12) ptVel[i].x *= -1;
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
