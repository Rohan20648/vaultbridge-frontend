import { useEffect, useRef, useState } from "react";
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
    // Enhanced tone mapping for physical realism
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();

    // Generate environment map for realistic metal reflections
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
    // Rich contrast hemisphere light replacing plain ambient
    scene.add(new THREE.HemisphereLight(0x070912, 0x111625, 1.6));

    // Key light — warm top-left front, boosted for ACESFilmic
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

    // Gold rim — bounces warm gold from behind/left
    const rim = new THREE.DirectionalLight(0xeeba66, 3.5);
    rim.position.set(-10, 4, -8);
    scene.add(rim);

    // Interior fill — soft warm point inside vault opening
    const fill = new THREE.PointLight(0xffc55c, 4.5, 30);
    fill.position.set(0, 0, 4);
    scene.add(fill);

    // Ground bounce
    const ground = new THREE.DirectionalLight(0x11182c, 1.2);
    ground.position.set(0, -10, 5);
    scene.add(ground);

    // ── Materials ─────────────────────────────────────────────────────────────
    // Upgraded to MeshPhysicalMaterial for beautiful metallic reflections and clearcoat realism
    const steelDark = new THREE.MeshPhysicalMaterial({ color: 0x10131d, metalness: 0.98, roughness: 0.15, clearcoat: 0.2, clearcoatRoughness: 0.2 });
    const steelMid  = new THREE.MeshPhysicalMaterial({ color: 0x1c2130, metalness: 0.94, roughness: 0.20, clearcoat: 0.15 });
    const steelBody = new THREE.MeshPhysicalMaterial({ color: 0x0e111a, metalness: 0.96, roughness: 0.18, clearcoat: 0.25 });
    const goldMat   = new THREE.MeshPhysicalMaterial({ color: 0xe0ba5a, metalness: 1.0,  roughness: 0.08, clearcoat: 0.4, clearcoatRoughness: 0.1 });
    const goldDimMat= new THREE.MeshPhysicalMaterial({ color: 0x9c7a2e, metalness: 0.98, roughness: 0.25 });
    const interiorMat = new THREE.MeshStandardMaterial({ color: 0x05070a, metalness: 0.5, roughness: 0.95 });
    const dialFaceMat = new THREE.MeshPhysicalMaterial({ color: 0x090b12, metalness: 0.98, roughness: 0.05, clearcoat: 0.5 });
    
    // Glowing particles material
    const particleMat = new THREE.PointsMaterial({ color: 0xffd470, size: 0.06, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });

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
          D = 4.8;  // depth

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

    // Interior walls — individual panels so the inside is hollow & visible
    // Back inner wall
    const innerBack = new THREE.Mesh(new THREE.BoxGeometry(W - 0.82, H - 0.82, 0.06), interiorMat);
    innerBack.position.set(0, 0, -D / 2 + 0.22);
    bodyGroup.add(innerBack);
    // Left inner wall
    const innerLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, H - 0.82, D - 0.42), interiorMat);
    innerLeft.position.set(-(W - 0.82) / 2, 0, 0);
    bodyGroup.add(innerLeft);
    // Right inner wall
    const innerRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, H - 0.82, D - 0.42), interiorMat);
    innerRight.position.set((W - 0.82) / 2, 0, 0);
    bodyGroup.add(innerRight);
    // Inner floor
    const innerFloor = new THREE.Mesh(new THREE.BoxGeometry(W - 0.82, 0.06, D - 0.42), interiorMat);
    innerFloor.position.set(0, -(H - 0.82) / 2, 0);
    bodyGroup.add(innerFloor);
    // Inner ceiling
    const innerCeil = new THREE.Mesh(new THREE.BoxGeometry(W - 0.82, 0.06, D - 0.42), interiorMat);
    innerCeil.position.set(0, (H - 0.82) / 2, 0);
    bodyGroup.add(innerCeil);

    // Interior shelves
    const shelfMat = new THREE.MeshPhysicalMaterial({ color: 0x141824, metalness: 0.8, roughness: 0.5 });
    const shelfYs = [-1.0, 0.8];
    for (const sy of shelfYs) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(W - 1.0, 0.08, D - 0.6), shelfMat);
      shelf.position.set(0, sy, 0);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      bodyGroup.add(shelf);
    }

    // ── Interior contents ─────────────────────────────────────────────────────
    // COORDINATE NOTE: vault front opening = z=+2.4, back wall = z=-2.4
    // Push all contents to frontZ=1.6 so they appear immediately when door opens
    const frontZ = 1.6, midZ = 0.5;

    const goldBarMat    = new THREE.MeshPhysicalMaterial({ color: 0xd4a017, metalness: 1.0, roughness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.04 });
    const goldBarDimMat = new THREE.MeshPhysicalMaterial({ color: 0x8a6510, metalness: 0.98, roughness: 0.2 });
    const paperMat      = new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.95 });
    const bandMat       = new THREE.MeshPhysicalMaterial({ color: 0xe0ba5a, metalness: 0.5, roughness: 0.4 });
    const coinMat       = new THREE.MeshPhysicalMaterial({ color: 0xf0c830, metalness: 1.0, roughness: 0.08, clearcoat: 0.5 });

    // ── BOTTOM SHELF (shelf top at y = -0.96) ────────────────────────────────
    const barW = 0.78, barH = 0.30, barD = 0.42;
    const bottomY = -0.96 + barH / 2;

    // Row 1 — front
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

    // Row 2 — stacked behind & slightly above
    for (const bx of [-1.55, -0.65, 0.25]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(barW, barH, barD), goldBarMat.clone());
      bar.position.set(bx, bottomY + barH, midZ);
      bodyGroup.add(bar);
      const chamfer = new THREE.Mesh(new THREE.BoxGeometry(barW + 0.03, 0.05, barD + 0.03), goldBarDimMat);
      chamfer.position.set(bx, bottomY + barH * 1.5, midZ);
      bodyGroup.add(chamfer);
    }

    // Coin rolls — right column
    for (let ci = 0; ci < 3; ci++) {
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.52, 24), coinMat);
      roll.rotation.z = Math.PI / 2;
      roll.position.set(1.55, -0.96 + 0.16, frontZ - ci * 0.52);
      bodyGroup.add(roll);
    }

    // ── UPPER SHELF (shelf top at y = 0.84) ──────────────────────────────────
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

    // ── BACK WALL grid detail ─────────────────────────────────────────────────
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

    // Body outer gold trim lines — thick metallic frames
    const frameExtGeo = new THREE.BoxGeometry(W + 0.1, H + 0.1, 0.2);
    const frameInnerGeo = new THREE.BoxGeometry(W - 0.7, H - 0.7, 0.3);
    const trimMat = goldMat.clone();
    
    // Add thin gold trim around the mouth of the safe
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

    // Body corner vertical gold strips
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

    // Bolt holes on body sides (right side) — cylindrical recesses
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
    //  VAULT DOOR — thick slab hinged on left
    // ═══════════════════════════════════════════════════════════════════════
    const doorGroup = new THREE.Group();
    // Hinge pivot precisely at the left wall inner edge, flush with front face
    doorGroup.position.set(-W / 2 + 0.22, 0, D / 2 + 0.01);
    vaultGroup.add(doorGroup);

    const doorThickness = 0.75;
    const doorInnerX = W - 0.42;

    // Door body
    const doorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorInnerX, H - 0.42, doorThickness),
      steelDark.clone()
    );
    doorMesh.position.set(doorInnerX / 2, 0, doorThickness / 2);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    doorGroup.add(doorMesh);

    // Door edge bevel highlight — replaced with physical geometry
    const doorEdgeGeo = new THREE.BoxGeometry(doorInnerX + 0.04, H - 0.38, doorThickness - 0.1);
    const doorEdge = new THREE.Mesh(doorEdgeGeo, goldDimMat);
    doorEdge.position.set(doorInnerX / 2, 0, doorThickness / 2);
    doorGroup.add(doorEdge);

    // Door recessed panel
    const panelW = doorInnerX - 1.1, panelH = H - 1.7, panelD = 0.12;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(panelW, panelH, panelD), steelMid);
    panel.position.set(doorInnerX / 2, 0, doorThickness + panelD / 2 - 0.01);
    doorGroup.add(panel);
    
    // Panel inner gold frame
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

    // Outer ring mount — thick ring flush with door
    const mountRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.05, 0.16, 32, 120),
      goldDimMat.clone()
    );
    mountRing.position.set(dialCX, 0, dialCZ + 0.06);
    doorGroup.add(mountRing);

    // Spinning rings (3 concentric)
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

    // Tick marks on outer ring base
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

    // Dial face — main cylinder
    const dialFace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.74, 0.74, 0.22, 64),
      dialFaceMat
    );
    dialFace.rotation.x = Math.PI / 2;
    dialFace.position.set(dialCX, 0, dialCZ + 0.18);
    doorGroup.add(dialFace);

    // Dial rim ring
    const dialRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.74, 0.08, 32, 100),
      goldMat.clone()
    );
    dialRim.position.set(dialCX, 0, dialCZ + 0.28);
    doorGroup.add(dialRim);

    // Indicator needle
    const needle = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.65, 0.08),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0xe5c15c, emissiveIntensity: 0.8, metalness: 1.0, roughness: 0.1 })
    );
    needle.position.set(dialCX, 0, dialCZ + 0.32);
    doorGroup.add(needle);

    // Center hub
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.22, 32),
      goldMat.clone()
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.set(dialCX, 0, dialCZ + 0.30);
    doorGroup.add(hub);

    // ── Lock bolts — protruding cylinders on right edge ─────────────────────
    const boltGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.85, 32);
    for (const by of [2.2, 0.7, -0.7, -2.2]) {
      const bolt = new THREE.Mesh(boltGeo, steelMid.clone());
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(doorInnerX + 0.15, by, doorThickness / 2);
      doorGroup.add(bolt);

      // Bolt base metal ring
      const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.06, 16, 32), goldDimMat);
      baseRing.rotation.y = Math.PI / 2;
      baseRing.position.set(doorInnerX, by, doorThickness / 2);
      doorGroup.add(baseRing);

      // Bolt tip cap
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 16), steelMid.clone());
      cap.position.set(doorInnerX + 0.575, by, doorThickness / 2);
      doorGroup.add(cap);
    }

    // ── Hinges — left edge, 3 hinges ────────────────────────────────────────
    const hingeBodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 32);
    const hingeMat = goldDimMat.clone();
    for (const hy of [2.4, 0, -2.4]) {
      const h = new THREE.Mesh(hingeBodyGeo, hingeMat);
      h.position.set(-0.1, hy, doorThickness / 2);
      doorGroup.add(h);

      // Hinge caps
      const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 16), hingeMat);
      topCap.position.set(-0.1, hy + 0.4, doorThickness / 2);
      doorGroup.add(topCap);
      const botCap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 16), hingeMat);
      botCap.position.set(-0.1, hy - 0.4, doorThickness / 2);
      doorGroup.add(botCap);
      
      // Hinge connector blocks
      const conn = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.2), hingeMat);
      conn.position.set(0.1, hy, doorThickness / 2 - 0.1);
      doorGroup.add(conn);
    }

    // ── Corner rivets ───────────────────────────────────────────────────────
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

    // ── Floating particles ───────────────────────────────────────────────────
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

    // ── Ground shadow plane ──────────────────────────────────────────────────
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 30),
      new THREE.ShadowMaterial({ opacity: 0.5, color: 0x070912 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -H / 2 - 0.22;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Interior lights — multiple points so all contents are lit
    const vaultInteriorLight = new THREE.PointLight(0xffd060, 0.0, 18);
    vaultInteriorLight.position.set(0, 1.0, 1.2);
    scene.add(vaultInteriorLight);
    // Second light aimed at bottom shelf (gold bars)
    const vaultInteriorLight2 = new THREE.PointLight(0xffb030, 0.0, 14);
    vaultInteriorLight2.position.set(0, -1.2, 1.5);
    scene.add(vaultInteriorLight2);

    // Glowing inner wall panel behind door (emissive warm amber — reveals when open)
    const innerGlowMat = new THREE.MeshStandardMaterial({ color: 0x3a2800, emissive: 0xffa030, emissiveIntensity: 0.0, roughness: 1.0 });
    const innerGlowPanel = new THREE.Mesh(new THREE.BoxGeometry(W - 0.84, H - 0.84, 0.04), innerGlowMat);
    innerGlowPanel.position.set(0, 0, -D / 2 + 0.22);
    bodyGroup.add(innerGlowPanel);

    // ── Mouse interaction ────────────────────────────────────────────────────
    let targetRotX = 0.15, targetRotY = 0.35;
    let curRotX = 0.15, curRotY = 0.35;
    let targetDoorOpen = 0; // Door angle in radians
    let curDoorOpen = 0;
    let hovering = false;
    // Track open progress 0→1 for glow effects
    let openProgress = 0;

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      // Tighter rotation range on hover so vault tilts elegantly
      targetRotY = ((e.clientX - r.left) / r.width - 0.5) * 0.45 + 0.28;
      targetRotX = -((e.clientY - r.top)  / r.height - 0.5) * 0.30 + 0.12;
      // Full cinematic door swing — ~83 degrees open, negative Y rotates door outward (leftward hinge)
      targetDoorOpen = -1.45;
      fill.intensity = 7.5;
      hovering = true;
    };
    const onLeave = () => { 
      hovering = false; 
      targetDoorOpen = 0; // Close when not hovered
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    // ── Animation loop ────────────────────────────────────────────────────────
    let t = 0, rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.016;

      // Smooth rotation follow
      curRotX += (targetRotX - curRotX) * 0.05;
      curRotY += (targetRotY - curRotY) * 0.05;
      if (!hovering) {
          targetRotY = Math.sin(t * 0.25) * 0.2 + 0.25;
          fill.intensity = 3.5 + Math.sin(t * 1.5) * 1.0;
      }

      vaultGroup.rotation.x = curRotX;
      vaultGroup.rotation.y = curRotY;
      
      // Smooth door open — slower, more cinematic easing (0.028 instead of 0.04)
      curDoorOpen += (targetDoorOpen - curDoorOpen) * 0.028;
      doorGroup.rotation.y = curDoorOpen;

      // Open progress 0→1 based on how open the door is
      openProgress = Math.min(1, Math.abs(curDoorOpen) / 1.45);

      // Animate interior glow as door opens
      vaultInteriorLight.intensity = openProgress * 8.0;
      vaultInteriorLight2.intensity = openProgress * 6.0;
      innerGlowMat.emissiveIntensity = openProgress * 0.55;
      // Fade fill light as interior light takes over
      if (hovering) fill.intensity = 4.0 + openProgress * 3.5;

      // Needle spin
      needle.rotation.z = t * 1.2;

      // Rings counter-rotate with dynamic easing
      rings[0].rotation.z =  t * 0.25 + Math.sin(t*0.5)*0.1;
      rings[1].rotation.z = -t * 0.18 + Math.cos(t*0.3)*0.1;
      rings[2].rotation.z =  t * 0.12 - Math.sin(t*0.4)*0.1;

      // Particles drift softly
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
