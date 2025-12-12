import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

type WindowInfo = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ts: number;
};

type Props = {
  className?: string;
  fullscreen?: boolean;
  showBadge?: boolean;
};

const CHANNEL = 'neon-portal-windows';
const SEED_KEY = 'neon-portal:seed';
const START_KEY = 'neon-portal:start';

const mulberry32 = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

export const MultiWindowPortal = ({
  className = '',
  fullscreen = false,
  showBadge = true,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const [windowCount, setWindowCount] = useState(1);

  const useMultiWindow = fullscreen && !reduced;

  const seed = useMemo(() => {
    const fromStorage = Number(localStorage.getItem(SEED_KEY));
    if (fromStorage) return fromStorage;
    const next = Math.floor(Math.random() * 1_000_000_000);
    localStorage.setItem(SEED_KEY, String(next));
    return next;
  }, []);

  const startEpoch = useMemo(() => {
    const fromStorage = Number(localStorage.getItem(START_KEY));
    if (fromStorage) return fromStorage;
    const next = Date.now();
    localStorage.setItem(START_KEY, String(next));
    return next;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rand = mulberry32(seed);
    const getSize = () => {
      if (fullscreen) return { width: window.innerWidth, height: window.innerHeight };
      const parent = canvas.parentElement;
      return {
        width: parent?.clientWidth || canvas.clientWidth || 420,
        height: parent?.clientHeight || canvas.clientHeight || 220,
      };
    };

    const { width: initialWidth, height: initialHeight } = getSize();

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initialWidth, initialHeight, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050814, 12, 48);

    const camera = new THREE.PerspectiveCamera(52, initialWidth / initialHeight, 0.1, 200);
    camera.position.set(0, 0, 18);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const pink = new THREE.PointLight(0xff5efb, 1.4, 120);
    pink.position.set(12, 8, 14);
    const cyan = new THREE.PointLight(0x3fd8ff, 1.2, 120);
    cyan.position.set(-14, -8, 12);
    scene.add(ambient, pink, cyan);

    const group = new THREE.Group();
    scene.add(group);

    const geometries = [
      new THREE.IcosahedronGeometry(1.1, 0),
      new THREE.OctahedronGeometry(1.2, 0),
      new THREE.TetrahedronGeometry(1.0, 0),
    ];
    const palette = [0xff5efb, 0x3fd8ff, 0x7c5bff, 0xffffff];

    const shards: {
      mesh: any;
      base: any;
      axis: any;
      spin: number;
      wave: number;
      phase: number;
      drift: number;
    }[] = [];

    for (let i = 0; i < 86; i++) {
      const geo = geometries[Math.floor(rand() * geometries.length)];
      const color = palette[Math.floor(rand() * palette.length)];
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.9,
        roughness: 0.25,
        metalness: 0.65,
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(geo, mat);

      const radius = 4.5 + rand() * 11.5;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const base = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
      );
      mesh.position.copy(base);
      const scale = 0.25 + rand() * 0.9;
      mesh.scale.setScalar(scale);
      mesh.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);

      shards.push({
        mesh,
        base,
        axis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
        spin: 0.2 + rand() * 1.2,
        wave: 0.4 + rand() * 1.0,
        phase: rand() * Math.PI * 2,
        drift: 0.5 + rand() * 1.5,
      });
      group.add(mesh);
    }

    const ringGeo = new THREE.TorusGeometry(4.2, 0.18, 28, 160);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff5efb,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    const ring2Geo = new THREE.TorusGeometry(3.6, 0.12, 28, 160);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x3fd8ff,
      transparent: true,
      opacity: 0.7,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2;
    ring2.rotation.z = Math.PI / 5;
    group.add(ring2);

    const starCount = 700;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 10 + rand() * 35;
      const t = rand() * Math.PI * 2;
      const p = Math.acos(2 * rand() - 1);
      starPositions[i * 3 + 0] = r * Math.sin(p) * Math.cos(t);
      starPositions[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      starPositions[i * 3 + 2] = r * Math.cos(p);
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.045,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    const selfId =
      (globalThis.crypto as Crypto | undefined)?.randomUUID?.() ?? Math.random().toString(36).slice(2);
    const windows = new Map<string, WindowInfo>();
    windows.set(selfId, {
      id: selfId,
      x: window.screenX || 0,
      y: window.screenY || 0,
      width: window.innerWidth,
      height: window.innerHeight,
      ts: Date.now(),
    });

    let channel: BroadcastChannel | null = null;
    let heartbeatId: number | null = null;

    const getWindowInfo = (): WindowInfo => ({
      id: selfId,
      x: window.screenX || (window as any).screenLeft || 0,
      y: window.screenY || (window as any).screenTop || 0,
      width: window.innerWidth,
      height: window.innerHeight,
      ts: Date.now(),
    });

    const pruneWindows = () => {
      const now = Date.now();
      for (const [id, info] of windows) {
        if (now - info.ts > 2200) windows.delete(id);
      }
      setWindowCount((prev) => (prev !== windows.size ? windows.size : prev));
    };

    const computeBounds = (infos: WindowInfo[]) => {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      infos.forEach((info) => {
        minX = Math.min(minX, info.x);
        minY = Math.min(minY, info.y);
        maxX = Math.max(maxX, info.x + info.width);
        maxY = Math.max(maxY, info.y + info.height);
      });
      return {
        minX,
        minY,
        totalWidth: Math.max(1, maxX - minX),
        totalHeight: Math.max(1, maxY - minY),
      };
    };

    if (useMultiWindow && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = (event) => {
        const payload = event.data as { info?: WindowInfo } | undefined;
        if (!payload?.info) return;
        windows.set(payload.info.id, payload.info);
        pruneWindows();
      };

      heartbeatId = window.setInterval(() => {
        const info = getWindowInfo();
        windows.set(selfId, info);
        channel?.postMessage({ info });
        pruneWindows();
      }, 480);

      window.addEventListener('beforeunload', () => {
        channel?.postMessage({ info: { ...getWindowInfo(), ts: 0 } });
      });
    }

    let frameId = 0;

    const updateSize = () => {
      const next = getSize();
      renderer.setSize(next.width, next.height, false);
      camera.aspect = next.width / next.height;
      camera.updateProjectionMatrix();
    };

    const updateCameraOffset = () => {
      const self = getWindowInfo();
      windows.set(selfId, self);
      pruneWindows();
      const infos = Array.from(windows.values()).filter((info) => info.ts > 0);
      const { minX, minY, totalWidth, totalHeight } = computeBounds(infos.length ? infos : [self]);

      const offsetX = self.x - minX;
      const offsetY = self.y - minY;
      camera.setViewOffset(totalWidth, totalHeight, offsetX, offsetY, self.width, self.height);
    };

    const render = () => {
      const t = (Date.now() - startEpoch) / 1000;

      ring.rotation.z = t * 0.8;
      ring2.rotation.z = -t * 0.65;
      group.rotation.y = Math.sin(t * 0.25) * 0.25;
      group.rotation.x = Math.cos(t * 0.22) * 0.18;

      shards.forEach((shard, index) => {
        const wobble = Math.sin(t * shard.wave + shard.phase + index * 0.02) * 0.9;
        const bob = Math.cos(t * shard.wave * 1.3 + shard.phase) * 0.7;
        shard.mesh.position.set(
          shard.base.x + wobble * shard.drift,
          shard.base.y + bob * shard.drift,
          shard.base.z + Math.sin(t * 0.5 + shard.phase) * 0.6,
        );
        if (!reduced) shard.mesh.rotateOnAxis(shard.axis, shard.spin * 0.01);
      });

      stars.rotation.y = t * 0.04;

      if (useMultiWindow) {
        updateCameraOffset();
        updateSize();
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => updateSize();
    let ro: ResizeObserver | null = null;
    if (fullscreen) {
      window.addEventListener('resize', handleResize);
    } else if ('ResizeObserver' in window) {
      ro = new ResizeObserver(handleResize);
      ro.observe(canvas);
    }

    return () => {
      cancelAnimationFrame(frameId);
      if (heartbeatId) window.clearInterval(heartbeatId);
      channel?.close();
      if (fullscreen) window.removeEventListener('resize', handleResize);
      ro?.disconnect();
      geometries.forEach((geo) => geo.dispose());
      ringGeo.dispose();
      ring2Geo.dispose();
      starsGeo.dispose();
      shards.forEach((shard) => {
        const material = shard.mesh.material as any;
        if (material?.dispose) material.dispose();
      });
      ringMat.dispose();
      ring2Mat.dispose();
      starsMat.dispose();
      renderer.dispose();
    };
  }, [fullscreen, reduced, seed, startEpoch, useMultiWindow]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
      {showBadge ? (
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white/80 backdrop-blur">
          {useMultiWindow ? `Окон в портале: ${windowCount}` : 'Неоновый портал'}
        </div>
      ) : null}
      {useMultiWindow ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center text-[10px] uppercase tracking-[0.14em] text-white/70">
          Перетащи окна рядом — сцена склеится
        </div>
      ) : null}
    </div>
  );
};
