"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

/*
  The exploded assembly from the hero drawing, as an orbitable wireframe:
  tray (trigger), housing with a turning gear (steps), plate (payload), bell
  and ledger (result).

  Drawn with LineMaterial rather than LineBasicMaterial. `linewidth` on the
  basic material is ignored by every browser, so the whole thing rendered as
  hairlines and was, correctly, reported as invisible. LineMaterial draws
  screen-space quads and honours real width.

  Colours are read from the CSS tokens at mount, so the scene follows the
  theme. The component is keyed on the resolved theme by its parent, which
  remounts it on a light/dark switch rather than trying to mutate materials.
*/

/*
  Resolve a CSS custom property to a colour three can actually use.

  The tokens are authored in oklch, and getComputedStyle serialises them as
  `lab(...)`. THREE.Color.setStyle does not parse lab, fails silently, and
  leaves the material white, which is most of why the wireframe was reported as
  invisible against a white page. Painting the value onto a 1x1 canvas and
  reading the pixel back makes the browser do the conversion, so this works for
  any colour syntax the browser supports, including ones that do not exist yet.
*/
function cssColor(varName: string): THREE.Color {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;left:-9999px;width:0;height:0";
  probe.style.color = `var(${varName})`;
  document.body.appendChild(probe);
  const serialised = getComputedStyle(probe).color;
  probe.remove();

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new THREE.Color(0x000000);
  ctx.fillStyle = serialised;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  // The canvas gives sRGB bytes; tell three that is what it is receiving.
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}

type Props = { onReady?: () => void };

export default function HeroThree({ onReady }: Props) {
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
    const frustum = 8.2;
    const camera = new THREE.OrthographicCamera(-frustum, frustum, frustum, -frustum, 0.1, 100);
    camera.position.set(13, 9, 15);
    camera.lookAt(0, 0, 0);

    // Widths are in pixels because worldUnits is false, so they stay legible
    // at any canvas size. resolution is kept in step by the resize handler.
    const materials: LineMaterial[] = [];
    const lineMat = (color: THREE.Color, linewidth: number, dashed = false) => {
      const m = new LineMaterial({
        color: color.getHex(),
        linewidth,
        dashed,
        dashSize: 0.28,
        gapSize: 0.2,
        alphaToCoverage: true,
      });
      materials.push(m);
      return m;
    };

    const solid = lineMat(ink, 2.4);
    const heavy = lineMat(ink, 3.6);
    const hair = lineMat(ink3, 1.4);
    const accent = lineMat(mark, 3.2);
    const hidden = lineMat(ink2, 1.6, true);

    const fromEdges = (geo: THREE.BufferGeometry, mat: LineMaterial, pos: [number, number, number]) => {
      const edges = new THREE.EdgesGeometry(geo, 15);
      const g = new LineSegmentsGeometry().fromEdgesGeometry(edges);
      const line = new LineSegments2(g, mat);
      line.position.set(...pos);
      line.computeLineDistances();
      scene.add(line);
      geo.dispose();
      edges.dispose();
      return line;
    };

    const fromPoints = (points: number[], mat: LineMaterial, parent: THREE.Object3D = scene) => {
      const g = new LineSegmentsGeometry();
      g.setPositions(points);
      const line = new LineSegments2(g, mat);
      line.computeLineDistances();
      parent.add(line);
      return line;
    };

    // 1 trigger: an in-tray
    fromEdges(new THREE.BoxGeometry(3.4, 0.55, 2.4), solid, [-7.2, -1.2, 0]);
    fromEdges(new THREE.BoxGeometry(2.7, 0.12, 1.9), hair, [-7.2, -0.72, 0]);
    fromEdges(new THREE.BoxGeometry(2.7, 0.12, 1.9), hair, [-7.2, -0.42, 0]);

    // 2 steps: the machine housing, with the cut-away shown hidden
    fromEdges(new THREE.BoxGeometry(4.2, 4.2, 4.2), heavy, [-1.3, 0.6, 0]);
    fromEdges(new THREE.BoxGeometry(3.4, 3.4, 3.4), hidden, [-1.3, 0.6, 0]);

    const gear = new THREE.Group();
    const ring = new THREE.EdgesGeometry(new THREE.TorusGeometry(1.25, 0.2, 6, 28), 20);
    const ringGeo = new LineSegmentsGeometry().fromEdgesGeometry(ring);
    const ringLine = new LineSegments2(ringGeo, solid);
    ringLine.computeLineDistances();
    gear.add(ringLine);
    ring.dispose();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 4;
      fromPoints(
        [-1.15 * Math.cos(a), -1.15 * Math.sin(a), 0, 1.15 * Math.cos(a), 1.15 * Math.sin(a), 0],
        hair,
        gear,
      );
    }
    gear.position.set(-1.3, 0.6, 2.15);
    scene.add(gear);

    // 3 payload: the plate that drops out of the housing
    fromEdges(new THREE.BoxGeometry(2.8, 0.22, 1.5), accent, [-1.3, -2.8, 0]);

    // 4 result: a bell and a ledger, the two things that come out
    fromEdges(new THREE.CylinderGeometry(0.22, 1.2, 1.7, 14, 1, true), solid, [4.9, 2.5, -1.7]);
    fromEdges(new THREE.SphereGeometry(0.24, 10, 8), hair, [4.9, 1.5, -1.7]);
    fromEdges(new THREE.BoxGeometry(3.4, 2.4, 0.22), solid, [5.3, -0.7, 1.4]);
    fromEdges(new THREE.BoxGeometry(3.4, 0.55, 0.24), accent, [5.3, -1.6, 1.42]);
    for (let i = 1; i < 3; i++) {
      fromPoints([3.6, -0.7 + i * 0.75 - 1.1, 1.55, 7.0, -0.7 + i * 0.75 - 1.1, 1.55], hair);
    }

    // construction geometry: the centre line and the section plane
    fromPoints([-10, -1.2, 0, 9, -1.2, 0], hidden);
    const plane = fromPoints([-9.2, -3.2, 0, -9.2, 4.2, 0], accent);

    // flow: tray to housing, housing to bell, housing to ledger
    const flow = (a: [number, number, number], b: [number, number, number]) =>
      fromPoints([...a, ...b], solid);
    flow([-5.4, -0.9, 0], [-3.5, -0.9, 0]);
    flow([0.9, 1.7, 0], [3.6, 1.7, 0]);
    flow([0.9, -0.5, 0], [3.6, -0.5, 0]);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minPolarAngle = Math.PI / 5;
    controls.maxPolarAngle = Math.PI / 1.85;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 1.1;
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
      el.dataset.grabbed = "true";
    });

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
    io.observe(el);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      const aspect = w / h;
      camera.left = -frustum * aspect;
      camera.right = frustum * aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      // LineMaterial needs the drawing buffer size to size its screen-space quads.
      for (const m of materials) m.resolution.set(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let t = 0;
    renderer.setAnimationLoop(() => {
      if (!visible) return;
      t += 0.016;
      if (!reduced) {
        gear.rotation.z = t * 0.85;
        // The section plane sweeps the assembly, the way it does in the SVG.
        plane.position.x = ((t * 1.6) % 19) - 0.5;
      }
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
        if (o instanceof LineSegments2) o.geometry.dispose();
      });
      for (const m of materials) m.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onReady]);

  return <div ref={host} className="absolute inset-0" aria-hidden />;
}
