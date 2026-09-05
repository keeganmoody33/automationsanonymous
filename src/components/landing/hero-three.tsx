"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/*
  The exploded assembly from the hero drawing as an orbitable wireframe:
  tray (trigger), housing with a gear (steps), plate (payload), bell and
  ledger (result). Colors are read from the CSS tokens at mount so the scene
  follows the palette. Auto-rotates slowly unless reduced motion is set.
*/

function cssColor(varName: string): THREE.Color {
  const probe = document.createElement("span");
  probe.style.color = `var(${varName})`;
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  return new THREE.Color(rgb);
}

export default function HeroThree({ onReady }: { onReady?: () => void }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return;
    }
    const ink = cssColor("--ink");
    const ink2 = cssColor("--ink-2");
    const ink3 = cssColor("--ink-3");
    const mark = cssColor("--mark");

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const aspect = el.clientWidth / Math.max(el.clientHeight, 1);
    const frustum = 9;
    const camera = new THREE.OrthographicCamera(-frustum * aspect, frustum * aspect, frustum, -frustum, 0.1, 100);
    camera.position.set(14, 10, 16);
    camera.lookAt(0, 0, 0);

    const solid = new THREE.LineBasicMaterial({ color: ink });
    const hair = new THREE.LineBasicMaterial({ color: ink3 });
    const accent = new THREE.LineBasicMaterial({ color: mark });
    const hidden = new THREE.LineDashedMaterial({ color: ink2, dashSize: 0.25, gapSize: 0.2 });

    const edges = (g: THREE.BufferGeometry, m: THREE.Material, pos: [number, number, number], rot?: [number, number, number]) => {
      const line = new THREE.LineSegments(new THREE.EdgesGeometry(g, 15), m);
      line.position.set(...pos);
      if (rot) line.rotation.set(...rot);
      if (m instanceof THREE.LineDashedMaterial) line.computeLineDistances();
      scene.add(line);
      return line;
    };

    // 1 trigger: tray
    edges(new THREE.BoxGeometry(3.2, 0.5, 2.2), solid, [-7.5, -1.2, 0]);
    edges(new THREE.BoxGeometry(2.6, 0.14, 1.8), hair, [-7.5, -0.7, 0]);
    edges(new THREE.BoxGeometry(2.6, 0.14, 1.8), hair, [-7.5, -0.4, 0]);
    // 2 steps: housing with a gear
    edges(new THREE.BoxGeometry(4, 4, 4), solid, [-1.5, 0.6, 0]);
    edges(new THREE.BoxGeometry(3.3, 3.3, 3.3), hidden, [-1.5, 0.6, 0]);
    const gear = new THREE.Group();
    gear.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.TorusGeometry(1.2, 0.18, 6, 24), 20), solid));
    for (let i = 0; i < 4; i++) {
      const spoke = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.1, 0, 0), new THREE.Vector3(1.1, 0, 0)]);
      const l = new THREE.Line(spoke, hair);
      l.rotation.z = (i * Math.PI) / 4;
      gear.add(l);
    }
    gear.position.set(-1.5, 0.6, 2.05);
    scene.add(gear);
    // 3 payload: plate below the housing
    edges(new THREE.BoxGeometry(2.6, 0.18, 1.4), solid, [-1.5, -2.6, 0]);
    // 4 result: bell and ledger
    edges(new THREE.CylinderGeometry(0.2, 1.1, 1.6, 12, 1, true), solid, [4.6, 2.4, -1.6]);
    edges(new THREE.SphereGeometry(0.22, 8, 6), hair, [4.6, 1.5, -1.6]);
    edges(new THREE.BoxGeometry(3.2, 2.2, 0.2), solid, [5.2, -0.6, 1.4]);
    edges(new THREE.BoxGeometry(3.2, 0.5, 0.22), accent, [5.2, -1.45, 1.4]);
    for (let i = 1; i < 3; i++) edges(new THREE.PlaneGeometry(3.2, 0.001), hair, [5.2, -0.6 + i * 0.7 - 1.05, 1.52]);

    // construction axes
    const axis = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-10, -1.2, 0), new THREE.Vector3(9, -1.2, 0)]);
    const axisLine = new THREE.Line(axis, hidden);
    axisLine.computeLineDistances();
    scene.add(axisLine);
    // section plane A-A in mark
    const plane = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.01, 7.5)), accent);
    plane.position.set(-9.3, 0.6, 0);
    scene.add(plane);
    // flow arrows
    const flow = (a: [number, number, number], b: [number, number, number]) => {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
      scene.add(new THREE.Line(g, solid));
    };
    flow([-5.9, -0.9, 0], [-3.5, -0.9, 0]);
    flow([0.5, 1.6, 0], [3.5, 1.6, 0]);
    flow([0.5, -0.4, 0], [3.5, -0.4, 0]);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 1.9;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 0.6;

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
    io.observe(el);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      const a = w / h;
      camera.left = -frustum * a;
      camera.right = frustum * a;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let t = 0;
    renderer.setAnimationLoop(() => {
      if (!visible) return;
      t += 0.016;
      if (!reduced) gear.rotation.z = t * 0.6;
      controls.update();
      renderer.render(scene, camera);
    });
    onReady?.();

    return () => {
      renderer.setAnimationLoop(null);
      io.disconnect();
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.LineSegments || o instanceof THREE.Line) o.geometry.dispose();
      });
      [solid, hair, accent, hidden].forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onReady]);

  return <div ref={host} className="absolute inset-0" aria-hidden />;
}
