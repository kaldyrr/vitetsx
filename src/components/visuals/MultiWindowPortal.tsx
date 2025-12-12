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
const WINDOW_KEY_PREFIX = 'neon-portal:window:';
const CHANNEL = 'neon-portal-windows';
const STALE_MS = 15_000;
const HEARTBEAT_MS = 200;

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

    const initialPositions = positions.slice();
    const initialVelocities = velocities.slice();
    const initialColors = colors.slice();
    const initialPhaseOf = phaseOf.slice();
    const initialHomeOf = homeOf.slice();

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
    let pendingEpoch: number | null = null;
    let lastKnownWindowCount = 0;
    let lastRestartAt = 0;

    const getWindowInfo = (): WindowInfo => ({
      id: selfId,
      x: window.screenX ?? (window as any).screenLeft ?? 0,
      y: window.screenY ?? (window as any).screenTop ?? 0,
      width: window.innerWidth,
      height: window.innerHeight,
      ts: Date.now(),
    });

    const readStoredWindows = (): WindowInfo[] => {
      const collected: WindowInfo[] = [];

      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key?.startsWith(WINDOW_KEY_PREFIX)) continue;
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          try {
            collected.push(JSON.parse(raw) as WindowInfo);
          } catch {
            // ignore malformed payloads
          }
        }
      } catch {
        // ignore access errors
      }

      try {
        const raw = localStorage.getItem(WINDOWS_KEY);
        const list = raw ? (JSON.parse(raw) as WindowInfo[]) : [];
        if (Array.isArray(list)) collected.push(...list);
      } catch {
        // ignore legacy malformed payloads
      }

      const byId = new Map<string, WindowInfo>();
      collected.forEach((info) => {
        if (!info || typeof info.id !== 'string') return;
        const prev = byId.get(info.id);
        if (!prev || info.ts > prev.ts) byId.set(info.id, info);
      });
      return Array.from(byId.values());
    };

    const pruneWindows = (list: WindowInfo[]) => {
      const now = Date.now();
      return list.filter(
        (info) =>
          info &&
          typeof info.id === 'string' &&
          Number.isFinite(info.x) &&
          Number.isFinite(info.y) &&
          Number.isFinite(info.width) &&
          Number.isFinite(info.height) &&
          Number.isFinite(info.ts) &&
          now - info.ts < STALE_MS &&
          info.width > 0 &&
          info.height > 0,
      );
    };

    const syncSelfWindow = () => {
      const selfInfo = getWindowInfo();

      try {
        localStorage.setItem(`${WINDOW_KEY_PREFIX}${selfId}`, JSON.stringify(selfInfo));
      } catch {
        // ignore storage quota or privacy mode failures
      }

      const stored = pruneWindows(readStoredWindows());
      stored.forEach((info) => windows.set(info.id, info));
      windows.set(selfId, selfInfo);

      const merged = pruneWindows(Array.from(windows.values()));
      windows.clear();
      merged.forEach((info) => windows.set(info.id, info));
      const nextCount = windows.size;
      setWindowCount((prev) => (prev !== nextCount ? nextCount : prev));

      if (useMultiWindow && nextCount > lastKnownWindowCount && nextCount > 1) {
        const now = Date.now();
        const leaderId = [...windows.keys()].sort((a, b) => a.localeCompare(b))[0];
        if (leaderId === selfId && now - lastRestartAt > 1500) {
          lastRestartAt = now;
          pendingEpoch = now;
          try {
            localStorage.setItem(START_KEY, String(now));
          } catch {
            // ignore
          }
          channel?.postMessage({ restart: now });
        }
      }

      lastKnownWindowCount = nextCount;

      try {
        const now = Date.now();
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key?.startsWith(WINDOW_KEY_PREFIX)) continue;
          const raw = localStorage.getItem(key);
          if (!raw) {
            keysToRemove.push(key);
            continue;
          }
          try {
            const info = JSON.parse(raw) as WindowInfo;
            if (!info || typeof info.id !== 'string' || info.ts <= 0 || now - info.ts >= STALE_MS) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } catch {
        // ignore cleanup failures
      }
    };

    let heartbeatId: number | null = null;
    let channel: BroadcastChannel | null = null;
    let beforeUnloadHandler: (() => void) | null = null;
    const storageListener = (event: StorageEvent) => {
      if (!event.key) return;

      if (event.key === START_KEY && event.newValue) {
        const next = Number(event.newValue);
        if (Number.isFinite(next) && next > 0) pendingEpoch = next;
        return;
      }

      if (event.key === WINDOWS_KEY && event.newValue) {
        try {
          const list = pruneWindows(JSON.parse(event.newValue) as WindowInfo[]);
          list.forEach((info) => windows.set(info.id, info));
          setWindowCount((prev) => (prev !== windows.size ? windows.size : prev));
        } catch {
          // ignore malformed payloads
        }
        return;
      }

      if (!event.key.startsWith(WINDOW_KEY_PREFIX)) return;

      const idFromKey = event.key.slice(WINDOW_KEY_PREFIX.length);
      if (!event.newValue) {
        windows.delete(idFromKey);
        setWindowCount((prev) => (prev !== windows.size ? windows.size : prev));
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue) as WindowInfo;
        const [next] = pruneWindows([parsed]);
        if (!next || next.ts <= 0) {
          windows.delete(parsed?.id ?? idFromKey);
        } else {
          windows.set(next.id, next);
        }
        setWindowCount((prev) => (prev !== windows.size ? windows.size : prev));
      } catch {
        windows.delete(idFromKey);
        setWindowCount((prev) => (prev !== windows.size ? windows.size : prev));
      }
    };

    if (useMultiWindow) {
      syncSelfWindow();
      window.addEventListener('storage', storageListener);

      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel(CHANNEL);
        channel.onmessage = (event) => {
          const payload = event.data as { info?: WindowInfo; restart?: number } | undefined;
          if (payload && typeof payload.restart === 'number' && Number.isFinite(payload.restart) && payload.restart > 0) {
            pendingEpoch = payload.restart;
            try {
              localStorage.setItem(START_KEY, String(payload.restart));
            } catch {
              // ignore
            }
          }
          if (!payload?.info) return;
          const [next] = pruneWindows([payload.info]);
          if (!next || next.ts <= 0) {
            windows.delete(payload.info.id);
          } else {
            windows.set(next.id, next);
          }
          setWindowCount((prev) => (prev !== windows.size ? windows.size : prev));
        };
      }

      heartbeatId = window.setInterval(() => {
        syncSelfWindow();
        channel?.postMessage({ info: getWindowInfo() });
      }, HEARTBEAT_MS);

      beforeUnloadHandler = () => {
        try {
          localStorage.removeItem(`${WINDOW_KEY_PREFIX}${selfId}`);
        } catch {
          // ignore
        }
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
      const bounds = computeBounds(infos.length ? infos : [selfInfo]);
      const offsetX = selfInfo.x - bounds.minX;
      const offsetY = selfInfo.y - bounds.minY;

      camera.aspect = bounds.totalWidth / bounds.totalHeight;
      camera.setViewOffset(
        bounds.totalWidth,
        bounds.totalHeight,
        offsetX,
        offsetY,
        selfInfo.width,
        selfInfo.height,
      );
      camera.updateProjectionMatrix();

      if (selfInfo.width !== lastRenderSize.width || selfInfo.height !== lastRenderSize.height) {
        renderer.setSize(selfInfo.width, selfInfo.height, false);
        lastRenderSize = { width: selfInfo.width, height: selfInfo.height };
      }

      return { infos, bounds, selfInfo };
    };

    const corePositions = Array.from({ length: maxCores }, () => new THREE.Vector3());
    const pairMid = new THREE.Vector3();
    const pairAxis = new THREE.Vector3();
    const pairPerp = new THREE.Vector3();
    let mergeValue = 0;
    let epoch = startEpoch;
    let simStep = 0;
    const SIM_STEP_S = 1 / 60;
    const MAX_CATCH_UP_STEPS = 900;

    const resetSimulation = (nextEpoch: number) => {
      epoch = nextEpoch;
      simStep = 0;
      mergeValue = 0;
      positions.set(initialPositions);
      velocities.set(initialVelocities);
      colors.set(initialColors);
      phaseOf.set(initialPhaseOf);
      homeOf.set(initialHomeOf);
      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
    };

    const render = () => {
      if (pendingEpoch && pendingEpoch !== epoch) {
        resetSimulation(pendingEpoch);
        pendingEpoch = null;
      }

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

      const pairMode = useMultiWindow && coreCount === 2;
      let pairSeparation = 0;
      let pairSizeX = 0;
      let pairSizeY = 0;
      if (pairMode) {
        pairMid.copy(corePositions[0]).add(corePositions[1]).multiplyScalar(0.5);
        pairAxis.copy(corePositions[1]).sub(corePositions[0]);
        pairSeparation = pairAxis.length() + 0.0001;
        pairAxis.multiplyScalar(1 / pairSeparation);
        pairPerp.set(-pairAxis.y, pairAxis.x, 0);
        pairSizeX = THREE.MathUtils.clamp(pairSeparation * 0.55, 4.5, initialSpan * 1.45);
        pairSizeY = pairSizeX * 0.6;
      }

      let mergeTarget = 0;
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
        mergeTarget = THREE.MathUtils.clamp(1 - minDist / 8, 0, 1);
      }

      const now = Date.now();
      const targetStep = Math.max(0, Math.floor(((now - epoch) / 1000) / SIM_STEP_S));
      let stepsToRun = targetStep - simStep;

      if (stepsToRun > MAX_CATCH_UP_STEPS) {
        try {
          localStorage.setItem(START_KEY, String(now));
        } catch {
          // ignore
        }
        channel?.postMessage({ restart: now });
        resetSimulation(now);
        stepsToRun = 0;
      }

      for (let step = 0; step < stepsToRun; step++) {
        const t = (simStep + 1) * SIM_STEP_S;
        mergeValue += (mergeTarget - mergeValue) * 0.06;

        const pairAlpha = pairMode ? THREE.MathUtils.clamp(1 - mergeValue, 0, 1) : 0;

        const baseAttract = (0.012 + mergeValue * 0.01 + pairAlpha * 0.008) * motionScale;
        const orbitStrength = (0.006 + mergeValue * 0.006) * motionScale;
        const bridgeStrength = 0.036 * mergeValue * motionScale;
        const damping = useMultiWindow ? 0.981 - pairAlpha * 0.006 : 0.987;
        const maxSpeed = (useMultiWindow ? 0.18 : 0.22) * motionScale;
        const boundary = pairMode
          ? Math.min(initialSpan * 1.35, Math.max(initialSpan, pairSeparation * 0.5 + 3.5))
          : initialSpan * (useMultiWindow ? 1.18 : 1.7);
        const boundaryPull = useMultiWindow ? 0.01 + pairAlpha * 0.012 : 0.002;
        const boundaryDamp = useMultiWindow ? 0.82 - pairAlpha * 0.08 : 0.92;
        const noiseAmp = (useMultiWindow ? 0.0018 : 0.0025) * motionScale;
        const pairFollow = (0.009 + pairAlpha * 0.003) * pairAlpha * motionScale;
        const pairFlow = (0.02 + pairAlpha * 0.008) * pairAlpha * motionScale;

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
          const orbitBlend = 1 - pairAlpha * 0.9;
          const orbitX = (-dy / dist) * orbitStrength * orbitDir * orbitBlend;
          const orbitY = (dx / dist) * orbitStrength * orbitDir * orbitBlend;

          const noise = Math.sin(t * 0.6 + phaseOf[i]) * noiseAmp * (1 - pairAlpha * 0.85);
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

          if (pairMode && pairAlpha > 0) {
            const phase = phaseOf[i] + t * (1.4 + (i % 7) * 0.08) * orbitDir;
            const s = Math.sin(phase);
            const c = Math.cos(phase);
            const u = s;
            const v = s * c; // [-0.5..0.5]
            const du = c;
            const dv = c * c - s * s;

            const targetX = pairMid.x + pairAxis.x * (u * pairSizeX) + pairPerp.x * (v * pairSizeY * 2);
            const targetY = pairMid.y + pairAxis.y * (u * pairSizeX) + pairPerp.y * (v * pairSizeY * 2);
            const targetZ = Math.sin(phase * 0.9) * 0.25;

            const tx = pairAxis.x * (du * pairSizeX) + pairPerp.x * (dv * pairSizeY * 2);
            const ty = pairAxis.y * (du * pairSizeX) + pairPerp.y * (dv * pairSizeY * 2);
            const tLen = Math.sqrt(tx * tx + ty * ty) + 0.0001;

            vx += (targetX - px) * pairFollow + (tx / tLen) * pairFlow;
            vy += (targetY - py) * pairFollow + (ty / tLen) * pairFlow;
            vz += (targetZ - pz) * pairFollow * 0.8;
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

          let nearestAfter = 0;
          let minAfterD2 = Infinity;
          for (let c = 0; c < coreCount; c++) {
            const dx = corePositions[c].x - px;
            const dy = corePositions[c].y - py;
            const dz = corePositions[c].z - pz;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < minAfterD2) {
              minAfterD2 = d2;
              nearestAfter = c;
            }
          }

          const coreAfter = corePositions[nearestAfter];
          const bdx = coreAfter.x - px;
          const bdy = coreAfter.y - py;
          const bdz = coreAfter.z - pz;
          const distAfter = Math.sqrt(minAfterD2) + 0.001;
          if (distAfter > boundary) {
            const pullBack = (distAfter - boundary) * boundaryPull;
            px += (bdx / distAfter) * pullBack;
            py += (bdy / distAfter) * pullBack;
            pz += (bdz / distAfter) * pullBack;
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

          const baseColor = palette[nearestAfter % palette.length];
          const brightness = 0.3 + 0.7 * Math.exp(-distAfter * 0.25);
          colors[idx + 0] = baseColor.r * brightness;
          colors[idx + 1] = baseColor.g * brightness;
          colors[idx + 2] = baseColor.b * brightness;
        }

        simStep += 1;
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

      if (stepsToRun > 0) {
        positionAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
      }

      const tNow = simStep * SIM_STEP_S;
      particles.rotation.z = useMultiWindow ? 0 : tNow * 0.012;
      stars.rotation.y = tNow * 0.01;

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
