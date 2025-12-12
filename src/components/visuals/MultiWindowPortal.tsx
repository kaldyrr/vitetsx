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
    renderer.setClearColor(0x000000, 0);
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

    const portalUniforms = {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(0xff5efb) },
      uColor2: { value: new THREE.Color(0x3fd8ff) },
      uColor3: { value: new THREE.Color(0x7c5bff) },
    };

    const portalMat = new THREE.ShaderMaterial({
      uniforms: portalUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        varying vec2 vUv;

        float hash(vec2 p){
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        void main() {
          vec2 uv = vUv * 2.0 - 1.0;
          float r = length(uv);
          float a = atan(uv.y, uv.x);

          float swirl = sin(a * 6.0 + uTime * 1.4) * 0.08;
          float waves = sin((r * 12.0 - uTime * 2.2) + a * 3.0) * 0.06;
          float core = smoothstep(0.9, 0.0, r + swirl + waves);

          float grain = (hash(uv * 18.0 + uTime) - 0.5) * 0.08;
          float edge = smoothstep(0.55, 0.1, r);
          float alpha = core * edge + grain;

          float hueMix = 0.5 + 0.5 * sin(a * 2.0 + uTime * 0.7);
          vec3 color = mix(uColor1, uColor2, hueMix);
          color = mix(color, uColor3, smoothstep(0.25, 0.9, r));

          gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
        }
      `,
    });

    const portalGeo = new THREE.CircleGeometry(3.9, 160);
    const portalMesh = new THREE.Mesh(portalGeo, portalMat);
    group.add(portalMesh);

    const rimGeo = new THREE.TorusGeometry(4.2, 0.09, 32, 240);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xff5efb,
      emissiveIntensity: 2.0,
      roughness: 0.25,
      metalness: 0.8,
      transparent: true,
      opacity: 0.95,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

    const rim2Geo = new THREE.TorusGeometry(3.6, 0.06, 32, 240);
    const rim2Mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x3fd8ff,
      emissiveIntensity: 1.7,
      roughness: 0.28,
      metalness: 0.75,
      transparent: true,
      opacity: 0.85,
    });
    const rim2 = new THREE.Mesh(rim2Geo, rim2Mat);
    rim2.rotation.x = Math.PI / 2;
    rim2.rotation.z = Math.PI / 6;
    group.add(rim2);

    const orbGeo = new THREE.SphereGeometry(0.18, 20, 20);
    const palette = [0xff5efb, 0x3fd8ff, 0x7c5bff, 0xffffff];
    const orbs: { mesh: any; base: any; axis: any; speed: number; phase: number }[] = [];

    for (let i = 0; i < 70; i++) {
      const color = palette[Math.floor(rand() * palette.length)];
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.35,
        roughness: 0.35,
        metalness: 0.25,
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(orbGeo, mat);
      const radius = 2.6 + rand() * 7.8;
      const theta = rand() * Math.PI * 2;
      const z = (rand() - 0.5) * 5.2;
      const base = new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, z);
      mesh.position.copy(base);
      const scale = 0.6 + rand() * 1.8;
      mesh.scale.setScalar(scale);
      orbs.push({
        mesh,
        base,
        axis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
        speed: 0.35 + rand() * 1.25,
        phase: rand() * Math.PI * 2,
      });
      group.add(mesh);
    }

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

    const updateSize = () => {
      const next = getSize();
      renderer.setSize(next.width, next.height, false);
      if (!useMultiWindow) {
        camera.aspect = next.width / next.height;
        camera.updateProjectionMatrix();
      }
    };

    const updateViewOffset = () => {
      const selfInfo = windows.get(selfId) ?? getWindowInfo();
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
      renderer.setSize(selfInfo.width, selfInfo.height, false);
    };

    const render = () => {
      const t = (Date.now() - startEpoch) / 1000;
      portalUniforms.uTime.value = t;

      rim.rotation.z = t * 0.55;
      rim2.rotation.z = -t * 0.75;
      const motionScale = reduced ? 0.25 : 1;
      group.rotation.y = Math.sin(t * 0.22) * 0.18 * motionScale;
      group.rotation.x = Math.cos(t * 0.18) * 0.12 * motionScale;

      orbs.forEach((orb, index) => {
        const wobble = Math.sin(t * orb.speed + orb.phase + index * 0.03) * 0.55 * motionScale;
        const bob = Math.cos(t * orb.speed * 0.9 + orb.phase) * 0.55 * motionScale;
        orb.mesh.position.set(
          orb.base.x + wobble,
          orb.base.y + bob,
          orb.base.z + Math.sin(t * 0.6 + orb.phase) * 0.6 * motionScale,
        );
        if (!reduced) orb.mesh.rotateOnAxis(orb.axis, 0.012);
      });

      stars.rotation.y = t * 0.02;

      if (useMultiWindow) {
        updateViewOffset();
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
      window.removeEventListener('storage', storageListener);
      if (beforeUnloadHandler) window.removeEventListener('beforeunload', beforeUnloadHandler);
      channel?.close();
      if (fullscreen) window.removeEventListener('resize', handleResize);
      ro?.disconnect();
      portalGeo.dispose();
      rimGeo.dispose();
      rim2Geo.dispose();
      orbGeo.dispose();
      starsGeo.dispose();
      portalMat.dispose();
      rimMat.dispose();
      rim2Mat.dispose();
      starsMat.dispose();
      orbs.forEach((orb) => {
        const material = orb.mesh.material as any;
        if (material?.dispose) material.dispose();
      });
      renderer.dispose();
    };
  }, [fullscreen, reduced, seed, startEpoch, useMultiWindow]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
      {showBadge ? (
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white/80 backdrop-blur">
          {useMultiWindow && windowCount > 1 ? `Окон в портале: ${windowCount}` : 'Неоновый портал'}
        </div>
      ) : null}
    </div>
  );
};
