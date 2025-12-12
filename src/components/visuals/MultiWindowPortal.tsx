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

    const camera = new THREE.PerspectiveCamera(48, initialWidth / initialHeight, 0.1, 200);
    camera.position.set(0, 0, 12);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const key = new THREE.DirectionalLight(0xff5efb, 1.2);
    key.position.set(8, 6, 10);
    const fill = new THREE.DirectionalLight(0x3fd8ff, 1.0);
    fill.position.set(-8, -6, 8);
    scene.add(ambient, key, fill);

    const group = new THREE.Group();
    scene.add(group);
    const palette = [
      new THREE.Color(0xff5efb),
      new THREE.Color(0x3fd8ff),
      new THREE.Color(0x7c5bff),
      new THREE.Color(0xffffff),
    ];

    const maxCores = 6;
    const coreGeo = new THREE.SphereGeometry(0.38, 20, 20);
    const coreMats = Array.from({ length: maxCores }, (_, index) => {
      const base = palette[index % palette.length].clone();
      return new THREE.MeshBasicMaterial({
        color: base,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
    });
    const coreMeshes = coreMats.map((mat) => new THREE.Mesh(coreGeo, mat));
    coreMeshes.forEach((mesh) => {
      mesh.visible = false;
      group.add(mesh);
    });

    const particleCount = 5200;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const phaseOf = new Float32Array(particleCount);
    const homeOf = new Uint8Array(particleCount);

    const initialSpan = 11.5;

    for (let i = 0; i < particleCount; i++) {
      const r = Math.pow(rand(), 0.7) * initialSpan;
      const theta = rand() * Math.PI * 2;
      const z = (rand() - 0.5) * 2.6;
      const idx = i * 3;
      positions[idx + 0] = Math.cos(theta) * r;
      positions[idx + 1] = Math.sin(theta) * r;
      positions[idx + 2] = z;

      velocities[idx + 0] = (rand() - 0.5) * 0.02;
      velocities[idx + 1] = (rand() - 0.5) * 0.02;
      velocities[idx + 2] = (rand() - 0.5) * 0.01;

      const home = rand() < 0.5 ? 0 : 1;
      homeOf[i] = home;
      phaseOf[i] = rand() * Math.PI * 2;

      const color = palette[home].clone();
      const brightness = 0.45 + rand() * 0.55;
      colors[idx + 0] = color.r * brightness;
      colors[idx + 1] = color.g * brightness;
      colors[idx + 2] = color.b * brightness;
    }

    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const spriteCtx = spriteCanvas.getContext('2d');
    if (spriteCtx) {
      const gradient = spriteCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.35, 'rgba(255,255,255,0.9)');
      gradient.addColorStop(0.7, 'rgba(255,255,255,0.25)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      spriteCtx.fillStyle = gradient;
      spriteCtx.fillRect(0, 0, 64, 64);
    }
    const spriteTex = new THREE.CanvasTexture(spriteCanvas);
    spriteTex.colorSpace = THREE.SRGBColorSpace;

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particleSize = fullscreen ? 0.155 : 0.12;
    const particleMat = new THREE.PointsMaterial({
      size: particleSize,
      map: spriteTex,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    const positionAttr = particleGeo.getAttribute('position') as any;
    const colorAttr = particleGeo.getAttribute('color') as any;

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

    const corePositions = Array.from({ length: maxCores }, () => new THREE.Vector3());
    const coreCenter = new THREE.Vector3();
    let mergeValue = 0;

    const render = () => {
      const t = (Date.now() - startEpoch) / 1000;
      const motionScale = reduced ? 0.5 : 1;

      let infos: WindowInfo[] = [];
      let bounds = { minX: 0, minY: 0, totalWidth: initialWidth, totalHeight: initialHeight };

      if (useMultiWindow) {
        const view = updateViewOffset();
        infos = view.infos;
        bounds = view.bounds;
      }

      const sortedInfos = infos.length ? [...infos].sort((a, b) => a.id.localeCompare(b.id)) : [];
      const activeInfos = useMultiWindow ? sortedInfos.slice(0, maxCores) : [];
      const coreCount = activeInfos.length || 1;

      if (coreCount === 1) {
        corePositions[0].set(0, 0, 0);
      } else {
        for (let i = 0; i < coreCount; i++) {
          corePositions[i].copy(toWorld(activeInfos[i], bounds));
        }
      }

      coreCenter.set(0, 0, 0);
      for (let i = 0; i < coreCount; i++) coreCenter.add(corePositions[i]);
      coreCenter.multiplyScalar(1 / coreCount);

      let maxCoreRadius = 0;
      for (let i = 0; i < coreCount; i++) {
        maxCoreRadius = Math.max(maxCoreRadius, coreCenter.distanceTo(corePositions[i]));
      }

      if (coreCount >= 2) {
        let minDist2 = Infinity;
        for (let i = 0; i < coreCount; i++) {
          for (let j = i + 1; j < coreCount; j++) {
            const dx = corePositions[i].x - corePositions[j].x;
            const dy = corePositions[i].y - corePositions[j].y;
            const dz = corePositions[i].z - corePositions[j].z;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < minDist2) minDist2 = d2;
          }
        }
        const minDist = Math.sqrt(minDist2);
        const mergeTarget = THREE.MathUtils.clamp(1 - minDist / 8, 0, 1);
        mergeValue += (mergeTarget - mergeValue) * 0.06;
      } else {
        mergeValue += (0 - mergeValue) * 0.06;
      }

      const coreScale = 0.8 + mergeValue * 0.9;
      for (let i = 0; i < maxCores; i++) {
        const mesh = coreMeshes[i];
        if (i < coreCount) {
          mesh.visible = true;
          mesh.position.copy(corePositions[i]);
          mesh.scale.setScalar(coreScale);
          (coreMats[i] as any).opacity = 0.7 + mergeValue * 0.25;
        } else {
          mesh.visible = false;
        }
      }

      const baseAttract = (0.012 + mergeValue * 0.01) * motionScale;
      const orbitStrength = (0.006 + mergeValue * 0.006) * motionScale;
      const bridgeStrength = (0.004 + mergeValue * 0.028) * motionScale;
      const damping = useMultiWindow ? 0.981 : 0.987;
      const maxSpeed = (useMultiWindow ? 0.18 : 0.22) * motionScale;
      const baseBoundary = initialSpan * (useMultiWindow ? 1.55 : 1.7);
      const boundary = useMultiWindow
        ? Math.min(55, Math.max(baseBoundary, maxCoreRadius + initialSpan * 1.1))
        : baseBoundary;
      const boundaryPull = useMultiWindow ? 0.004 : 0.002;
      const boundaryDamp = useMultiWindow ? 0.85 : 0.92;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        let px = positions[idx + 0];
        let py = positions[idx + 1];
        let pz = positions[idx + 2];
        let vx = velocities[idx + 0];
        let vy = velocities[idx + 1];
        let vz = velocities[idx + 2];

        let nearest = 0;
        let second = 0;
        let minD2 = Infinity;
        let secondD2 = Infinity;

        for (let c = 0; c < coreCount; c++) {
          const dx = corePositions[c].x - px;
          const dy = corePositions[c].y - py;
          const dz = corePositions[c].z - pz;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < minD2) {
            secondD2 = minD2;
            second = nearest;
            minD2 = d2;
            nearest = c;
          } else if (d2 < secondD2) {
            secondD2 = d2;
            second = c;
          }
        }

        const core = corePositions[nearest];
        const dx = core.x - px;
        const dy = core.y - py;
        const dz = core.z - pz;
        const dist = Math.sqrt(minD2) + 0.001;
        const attract = baseAttract / (1.2 + minD2);

        const orbitDir = homeOf[i] % 2 === 0 ? 1 : -1;
        const orbitX = (-dy / dist) * orbitStrength * orbitDir;
        const orbitY = (dx / dist) * orbitStrength * orbitDir;

        const noise = Math.sin(t * 0.6 + phaseOf[i]) * 0.0025;
        vx = vx * damping + dx * attract + orbitX + noise;
        vy = vy * damping + dy * attract + orbitY + noise;
        vz = vz * damping + dz * attract * 0.6 + Math.cos(t * 0.5 + phaseOf[i]) * 0.0015;

        const repelRadius = 0.75;
        if (dist < repelRadius) {
          const repelFactor = (repelRadius - dist) / repelRadius;
          const repelStrength = 0.014 * repelFactor * motionScale;
          vx -= (dx / dist) * repelStrength;
          vy -= (dy / dist) * repelStrength;
          vz -= (dz / dist) * repelStrength;
        }

        if (coreCount >= 2) {
          const other = corePositions[second];
          const odx = other.x - px;
          const ody = other.y - py;
          const odz = other.z - pz;
          const bridge = bridgeStrength / (1.2 + secondD2);
          vx += odx * bridge;
          vy += ody * bridge;
          vz += odz * bridge * 0.6;
        }

        const speed2 = vx * vx + vy * vy + vz * vz;
        if (speed2 > maxSpeed * maxSpeed) {
          const s = maxSpeed / Math.sqrt(speed2);
          vx *= s;
          vy *= s;
          vz *= s;
        }

        px += vx;
        py += vy;
        pz += vz;

        const cx = px - coreCenter.x;
        const cy = py - coreCenter.y;
        const cz = pz - coreCenter.z;
        const r2 = cx * cx + cy * cy + cz * cz;
        if (r2 > boundary * boundary) {
          const r = Math.sqrt(r2);
          const pullBack = (r - boundary) * boundaryPull;
          px -= (cx / r) * pullBack;
          py -= (cy / r) * pullBack;
          pz -= (cz / r) * pullBack;
          vx *= boundaryDamp;
          vy *= boundaryDamp;
          vz *= boundaryDamp;
        }

        positions[idx + 0] = px;
        positions[idx + 1] = py;
        positions[idx + 2] = pz;
        velocities[idx + 0] = vx;
        velocities[idx + 1] = vy;
        velocities[idx + 2] = vz;

        const baseColor = palette[nearest % palette.length];
        const brightness = 0.3 + 0.7 * Math.exp(-dist * 0.25);
        colors[idx + 0] = baseColor.r * brightness;
        colors[idx + 1] = baseColor.g * brightness;
        colors[idx + 2] = baseColor.b * brightness;
      }

      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      particles.rotation.z = useMultiWindow ? 0 : t * 0.012;
      stars.rotation.y = t * 0.01;

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
      particleGeo.dispose();
      starsGeo.dispose();
      particleMat.dispose();
      spriteTex.dispose();
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
          {useMultiWindow && windowCount > 1 ? `Окон в потоке: ${windowCount}` : 'Неоновый поток'}
        </div>
      ) : null}
    </div>
  );
};
