import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * HeroBackground — shared animated Three.js canvas used across all pages.
 * Renders floating wireframe polyhedra + a subtle grid, identical to the
 * homepage hero canvas so every page feels part of the same design system.
 *
 * Usage:
 *   <div style={{ position: "relative" }}>
 *     <HeroBackground opacity={0.55} />
 *     {/* your page content */}
 *   </div>
 *
 * The canvas is absolutely positioned and pointer-events-none so it never
 * interferes with interactive elements above it.
 */
export default function HeroBackground({ opacity = 0.6 }: { opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    camera.position.set(0, 0, 50);

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const geos = [
      new THREE.IcosahedronGeometry(1.2, 0),
      new THREE.OctahedronGeometry(1.0, 0),
      new THREE.TetrahedronGeometry(1.1, 0),
      new THREE.DodecahedronGeometry(1.0, 0),
    ];

    type Shape = { mesh: THREE.Mesh; rx: number; ry: number; vx: number; vy: number };
    const shapes: Shape[] = [];

    for (let i = 0; i < 32; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xc9a84c,
        wireframe: true,
        transparent: true,
        opacity: 0.045 + Math.random() * 0.09,
      });
      const mesh = new THREE.Mesh(geos[i % geos.length], mat);
      const s = 0.35 + Math.random() * 1.9;
      mesh.scale.setScalar(s);
      mesh.position.set(
        (Math.random() - 0.5) * 130,
        (Math.random() - 0.5) * 85,
        (Math.random() - 0.5) * 65 - 20
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      scene.add(mesh);
      shapes.push({
        mesh,
        rx: (Math.random() - 0.5) * 0.0025,
        ry: (Math.random() - 0.5) * 0.0025,
        vx: (Math.random() - 0.5) * 0.014,
        vy: (Math.random() - 0.5) * 0.009,
      });
    }

    // Subtle gold grid in background
    const grid = new THREE.GridHelper(200, 30, 0xc9a84c, 0xc9a84c);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.025;
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
      camera.position.x += (mouseX * 5 - camera.position.x) * 0.025;
      camera.position.y += (-mouseY * 3.5 - camera.position.y) * 0.025;
      camera.lookAt(0, 0, 0);

      for (const s of shapes) {
        s.mesh.rotation.x += s.rx;
        s.mesh.rotation.y += s.ry;
        s.mesh.position.x += s.vx;
        s.mesh.position.y += s.vy;
        if (Math.abs(s.mesh.position.x) > 68) s.vx *= -1;
        if (Math.abs(s.mesh.position.y) > 48) s.vy *= -1;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      geos.forEach(g => g.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
