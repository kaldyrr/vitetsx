import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

type Props = {
  className?: string;
  fullscreen?: boolean;
  showBadge?: boolean;
};

const SEED_KEY = 'neon-portal:seed';
const START_KEY = 'neon-portal:start';
const WINDOWS_KEY = 'neon-portal:windows';
const CHANNEL = 'neon-portal-windows';
const STALE_MS = 2200;
const HEARTBEAT_MS = 420;

type WindowInfo = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ts: number;
};

const mulberry32 = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

export const MultiWindowPortal = ({ className = '', fullscreen = false, showBadge = true }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const [windowCount, setWindowCount] = useState(1);
  const useMultiWindow = fullscreen;

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
    renderer.setClearColor(0x050814, fullscreen ? 1 : 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050814, 0.03);

    const camera = new THREE.PerspectiveCamera(55, initialWidth / initialHeight, 0.1, 200);
    camera.position.set(0, 0, 14);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const key = new THREE.DirectionalLight(0xff5efb, 1.2);
    key.position.set(8, 6, 10);
    const fill = new THREE.DirectionalLight(0x3fd8ff, 1.0);
    fill.position.set(-8, -6, 8);
    scene.add(ambient, key, fill);

    const group = new THREE.Group();
    scene.add(group);
    const particleCount = 2600;
    const maxRadius = 7.8;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const galaxyOf = new Uint8Array(particleCount);
    const radiusOf = new Float32Array(particleCount);
    const angleOf = new Float32Array(particleCount);
    const speedOf = new Float32Array(particleCount);
    const heightOf = new Float32Array(particleCount);
    const armOf = new Float32Array(particleCount);

    const palette = [0xff5efb, 0x3fd8ff, 0x7c5bff, 0xffffff];
    const arms = 3;

    for (let i = 0; i < particleCount; i++) {
      const g = i < particleCount / 2 ? 0 : 1;
      galaxyOf[i] = g;
      const r = Math.pow(rand(), 1.9) * maxRadius + 0.25;
      radiusOf[i] = r;
      angleOf[i] = rand() * Math.PI * 2;
      const direction = g === 0 ? 1 : -1;
      speedOf[i] = direction * (0.12 + rand() * 0.45);
      heightOf[i] = (rand() - 0.5) * 0.9 * (1 - r / maxRadius);
      armOf[i] = (Math.floor(rand() * arms) / arms) * Math.PI * 2 + rand() * 0.8;

      const base = new THREE.Color(palette[Math.floor(rand() * palette.length)]);
      base.offsetHSL(0, 0, -(r / maxRadius) * 0.25);
      colors[i * 3 + 0] = base.r;
      colors[i * 3 + 1] = base.g;
      colors[i * 3 + 2] = base.b;
    }

    const galaxyGeo = new THREE.BufferGeometry();
    galaxyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    galaxyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const galaxyMat = new THREE.PointsMaterial({
      size: 0.06,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });
    const galaxies = new THREE.Points(galaxyGeo, galaxyMat);
    group.add(galaxies);

    const positionAttr = galaxyGeo.getAttribute('position') as any;
    const galaxyCenters = [new THREE.Vector3(-3.8, -0.6, 0), new THREE.Vector3(3.8, 0.6, 0)];
    const galaxyTargets = [galaxyCenters[0].clone(), galaxyCenters[1].clone()];
    const galaxyOffset = [new THREE.Vector3(-1.0, 0.6, 0), new THREE.Vector3(1.0, -0.6, 0)];
    const defaultTargets = [galaxyCenters[0].clone(), galaxyCenters[1].clone()];

    const coreGeo = new THREE.SphereGeometry(0.55, 24, 24);
    const coreMats = [
      new THREE.MeshBasicMaterial({
        color: 0xff5efb,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      new THREE.MeshBasicMaterial({
        color: 0x3fd8ff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ];
    const cores = coreMats.map((mat) => new THREE.Mesh(coreGeo, mat));
    cores.forEach((core) => group.add(core));

    const starCount = 1100;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 9 + rand() * 42;
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
      size: 0.032,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    const selfId =
      (globalThis.crypto as Crypto | undefined)?.randomUUID?.() ?? Math.random().toString(36).slice(2);
    const windows = new Map<string, WindowInfo>();

    const getWindowInfo = (): WindowInfo => ({
      id: selfId,
      x: window.screenX ?? (window as any).screenLeft ?? 0,
      y: window.screenY ?? (window as any).screenTop ?? 0,
      width: window.innerWidth,
      height: window.innerHeight,
      ts: Date.now(),
    });

    const readStoredWindows = (): WindowInfo[] => {
      try {
        const raw = localStorage.getItem(WINDOWS_KEY);
        const list = raw ? (JSON.parse(raw) as WindowInfo[]) : [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    };

    const pruneWindows = (list: WindowInfo[]) => {
      const now = Date.now();
      return list.filter(
        (info) =>
          info &&
          typeof info.id === 'string' &&
          now - info.ts < STALE_MS &&
          info.width > 0 &&
          info.height > 0,
      );
    };

    const writeStoredWindows = (list: WindowInfo[]) => {
      localStorage.setItem(WINDOWS_KEY, JSON.stringify(list));
    };

    const syncSelfWindow = () => {
      const selfInfo = getWindowInfo();
      const stored = pruneWindows(readStoredWindows());
      stored.forEach((info) => windows.set(info.id, info));
      windows.set(selfId, selfInfo);

      const merged = pruneWindows(Array.from(windows.values()));
      writeStoredWindows(merged);
      windows.clear();
      merged.forEach((info) => windows.set(info.id, info));
      setWindowCount((prev) => (prev !== windows.size ? windows.size : prev));
    };

    let heartbeatId: number | null = null;
    let channel: BroadcastChannel | null = null;
    let beforeUnloadHandler: (() => void) | null = null;
    const storageListener = (event: StorageEvent) => {
      if (event.key !== WINDOWS_KEY || !event.newValue) return;
      try {
        const list = pruneWindows(JSON.parse(event.newValue) as WindowInfo[]);
        windows.clear();
        list.forEach((info) => windows.set(info.id, info));
        setWindowCount((prev) => (prev !== windows.size ? windows.size : prev));
      } catch {
        // ignore malformed payloads
      }
    };

    if (useMultiWindow) {
      syncSelfWindow();
      window.addEventListener('storage', storageListener);

      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel(CHANNEL);
        channel.onmessage = (event) => {
          const payload = event.data as { info?: WindowInfo } | undefined;
          if (!payload?.info) return;
          windows.set(payload.info.id, payload.info);
          setWindowCount((prev) => (prev !== windows.size ? windows.size : prev));
        };
      }

      heartbeatId = window.setInterval(() => {
        syncSelfWindow();
        channel?.postMessage({ info: getWindowInfo() });
      }, HEARTBEAT_MS);

      beforeUnloadHandler = () => {
        const list = pruneWindows(readStoredWindows()).filter((info) => info.id !== selfId);
        writeStoredWindows(list);
        channel?.postMessage({ info: { ...getWindowInfo(), ts: 0 } });
      };
      window.addEventListener('beforeunload', beforeUnloadHandler);
    } else {
      windows.set(selfId, getWindowInfo());
      setWindowCount(1);
    }

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

    let frameId = 0;
    let lastRenderSize = { width: initialWidth, height: initialHeight };
    let smoothBounds: { minX: number; minY: number; totalWidth: number; totalHeight: number } | null = null;
    const smoothOffset = { x: 0, y: 0 };
    const boundsFalloff = 0.12;
    const offsetFalloff = 0.18;

    const toWorld = (
      info: WindowInfo,
      bounds: { minX: number; minY: number; totalWidth: number; totalHeight: number },
    ) => {
      const cx = info.x + info.width / 2;
      const cy = info.y + info.height / 2;
      const nx = (cx - bounds.minX) / bounds.totalWidth - 0.5;
      const ny = 0.5 - (cy - bounds.minY) / bounds.totalHeight;
      const aspect = bounds.totalWidth / bounds.totalHeight;
      const span = 10;
      return new THREE.Vector3(nx * span * aspect, ny * span, 0);
    };

    const updateSize = () => {
      const next = getSize();
      renderer.setSize(next.width, next.height, false);
      lastRenderSize = { width: next.width, height: next.height };
      if (!useMultiWindow) {
        camera.aspect = next.width / next.height;
        camera.updateProjectionMatrix();
      }
    };

    const updateViewOffset = () => {
      const selfInfo = getWindowInfo();
      windows.set(selfId, selfInfo);
      const infos = pruneWindows(Array.from(windows.values()).filter((info) => info.ts > 0));
      const rawBounds = computeBounds(infos.length ? infos : [selfInfo]);

      if (!smoothBounds) {
        smoothBounds = { ...rawBounds };
        smoothOffset.x = selfInfo.x - rawBounds.minX;
        smoothOffset.y = selfInfo.y - rawBounds.minY;
      } else {
        smoothBounds.minX += (rawBounds.minX - smoothBounds.minX) * boundsFalloff;
        smoothBounds.minY += (rawBounds.minY - smoothBounds.minY) * boundsFalloff;
        smoothBounds.totalWidth += (rawBounds.totalWidth - smoothBounds.totalWidth) * boundsFalloff;
        smoothBounds.totalHeight += (rawBounds.totalHeight - smoothBounds.totalHeight) * boundsFalloff;

        const offsetXTarget = selfInfo.x - smoothBounds.minX;
        const offsetYTarget = selfInfo.y - smoothBounds.minY;
        smoothOffset.x += (offsetXTarget - smoothOffset.x) * offsetFalloff;
        smoothOffset.y += (offsetYTarget - smoothOffset.y) * offsetFalloff;
      }

      camera.aspect = smoothBounds.totalWidth / smoothBounds.totalHeight;
      camera.setViewOffset(
        smoothBounds.totalWidth,
        smoothBounds.totalHeight,
        smoothOffset.x,
        smoothOffset.y,
        selfInfo.width,
        selfInfo.height,
      );
      camera.updateProjectionMatrix();

      if (selfInfo.width !== lastRenderSize.width || selfInfo.height !== lastRenderSize.height) {
        renderer.setSize(selfInfo.width, selfInfo.height, false);
        lastRenderSize = { width: selfInfo.width, height: selfInfo.height };
      }

      return { infos, bounds: smoothBounds, selfInfo };
    };

    let mergeValue = 0;

    const render = () => {
      const t = (Date.now() - startEpoch) / 1000;
      const motionScale = reduced ? 0.35 : 1;

      let infos: WindowInfo[] = [];
      let bounds = { minX: 0, minY: 0, totalWidth: initialWidth, totalHeight: initialHeight };

      if (useMultiWindow) {
        const view = updateViewOffset();
        infos = view.infos;
        bounds = view.bounds;
      }

      if (infos.length >= 2) {
        const sorted = [...infos].sort((a, b) => a.id.localeCompare(b.id));
        const a = sorted[0];
        const b = sorted[1];
        galaxyTargets[0].copy(toWorld(a, bounds)).add(galaxyOffset[0]);
        galaxyTargets[1].copy(toWorld(b, bounds)).add(galaxyOffset[1]);

        const ax = a.x + a.width / 2;
        const ay = a.y + a.height / 2;
        const bx = b.x + b.width / 2;
        const by = b.y + b.height / 2;
        const pixelDist = Math.hypot(ax - bx, ay - by);
        const avgSize = (a.width + a.height + b.width + b.height) / 4;
        const mergeTarget = THREE.MathUtils.clamp(1 - pixelDist / (avgSize * 1.6), 0, 1);
        mergeValue += (mergeTarget - mergeValue) * 0.08;
      } else {
        galaxyTargets[0].copy(defaultTargets[0]);
        galaxyTargets[1].copy(defaultTargets[1]);
        mergeValue += (0 - mergeValue) * 0.08;
      }

      galaxyCenters[0].lerp(galaxyTargets[0], 0.06);
      galaxyCenters[1].lerp(galaxyTargets[1], 0.06);

      const coreScale = 0.9 + mergeValue * 0.9;
      cores.forEach((core, idx) => {
        core.position.copy(galaxyCenters[idx]);
        core.scale.setScalar(coreScale);
        (coreMats[idx] as any).opacity = 0.65 + mergeValue * 0.35;
      });

      for (let i = 0; i < particleCount; i++) {
        const g = galaxyOf[i];
        const center = galaxyCenters[g];
        const other = galaxyCenters[1 - g];
        const baseRadius = radiusOf[i];
        const coreAttract = (0.12 + mergeValue * 0.55) * (1 - baseRadius / maxRadius);
        const r = Math.max(
          0.05,
          baseRadius * (1 - coreAttract * 0.55) +
            Math.sin(t * 0.9 + i * 0.02) * coreAttract * 0.4,
        );
        const angle =
          angleOf[i] +
          t * speedOf[i] * (1 + coreAttract * 1.4) * motionScale +
          r * 0.38;
        const arm = armOf[i];

        let localX = Math.cos(angle + arm) * r;
        let localY = Math.sin(angle + arm) * r * 0.6;
        let localZ =
          heightOf[i] * (1 - coreAttract * 0.7) +
          Math.sin(t * 0.7 + angle) * 0.18 * motionScale;

        const dx = other.x - center.x;
        const dy = other.y - center.y;
        const dz = other.z - center.z;
        const invDist = 1 / (Math.hypot(dx, dy, dz) || 1);
        const dirX = dx * invDist;
        const dirY = dy * invDist;
        const dirZ = dz * invDist;

        const pull = mergeValue * (1 - baseRadius / maxRadius) * 0.7;
        const tail = mergeValue * Math.pow(baseRadius / maxRadius, 1.6) * 2.6;
        const tailOsc = 0.6 + 0.4 * Math.sin(t * 0.8 + arm + baseRadius * 0.4);

        localX += dirX * tail * tailOsc;
        localY += dirY * tail * tailOsc * 0.8;
        localZ += dirZ * tail * 0.2;

        const x = center.x + localX + dx * pull;
        const y = center.y + localY + dy * pull;
        const z = center.z + localZ;

        const idx = i * 3;
        positions[idx + 0] = x;
        positions[idx + 1] = y;
        positions[idx + 2] = z;
      }

      positionAttr.needsUpdate = true;

      galaxies.rotation.z = t * 0.03;
      stars.rotation.y = t * 0.015;

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
      window.removeEventListener('storage', storageListener);
      if (beforeUnloadHandler) window.removeEventListener('beforeunload', beforeUnloadHandler);
      channel?.close();
      if (fullscreen) window.removeEventListener('resize', handleResize);
      ro?.disconnect();
      galaxyGeo.dispose();
      starsGeo.dispose();
      galaxyMat.dispose();
      starsMat.dispose();
      coreGeo.dispose();
      coreMats.forEach((mat) => mat.dispose());
      renderer.dispose();
    };
  }, [fullscreen, reduced, seed, startEpoch, useMultiWindow]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
      {showBadge ? (
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white/80 backdrop-blur">
          {useMultiWindow && windowCount > 1 ? `Окон в галактиках: ${windowCount}` : 'Неоновые галактики'}
        </div>
      ) : null}
    </div>
  );
};
