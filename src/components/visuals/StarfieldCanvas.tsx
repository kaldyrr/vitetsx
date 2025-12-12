import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

type Star = {
  x: number;
  y: number;
  z: number;
  speed: number;
  size: number;
  twinkle: number;
};

type ShootingStar = {
  x: number;
  y: number;
  life: number;
  speedX: number;
  speedY: number;
};

type Props = {
  density?: number;
  className?: string;
};

export const StarfieldCanvas = ({ density = 200, className = '' }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const computeSize = () => {
      const parent = canvas.parentElement;
      return {
        width: parent?.clientWidth || window.innerWidth,
        height: parent?.clientHeight || window.innerHeight,
      };
    };

    let { width, height } = computeSize();
    const applySize = () => {
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    applySize();

    const starCount = Math.floor((width / 12) * (height / 12) * 0.001 * (reduced ? 0.55 : 1));
    const count = Math.min(Math.max(starCount, reduced ? 80 : 140), density);

    const stars: Star[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: 0.4 + Math.random() * 0.6,
      speed: (reduced ? 0.05 : 0.12) + Math.random() * 0.15,
      size: 0.6 + Math.random() * 1.1,
      twinkle: Math.random(),
    }));

    let shooting: ShootingStar | null = null;
    let frameId = 0;

    const spawnShootingStar = () => {
      shooting = {
        x: Math.random() * width,
        y: Math.random() * height * 0.35,
        life: 1,
        speedX: 6 + Math.random() * 3,
        speedY: 2 + Math.random(),
      };
    };

    let lastSpawn = 0;

    const resize = () => {
      const next = computeSize();
      width = next.width;
      height = next.height;
      applySize();
    };

    const render = (timestamp: number) => {
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
      gradient.addColorStop(0, 'rgba(255,255,255,0.02)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      stars.forEach((star) => {
        star.y += star.speed * star.z * (reduced ? 0.5 : 1);
        if (star.y > height) {
          star.y = -10;
          star.x = Math.random() * width;
        }

        const alpha = 0.35 + Math.sin((timestamp / 1000 + star.twinkle) * 2) * 0.2;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * star.z, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!reduced && timestamp - lastSpawn > 4200 + Math.random() * 2600) {
        lastSpawn = timestamp;
        spawnShootingStar();
      }

      if (shooting) {
        ctx.strokeStyle = `rgba(255,255,255,${shooting.life})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shooting.x, shooting.y);
        ctx.lineTo(shooting.x - 35, shooting.y - 12);
        ctx.stroke();

        shooting.x += shooting.speedX;
        shooting.y += shooting.speedY;
        shooting.life -= 0.02;
        if (shooting.life <= 0) shooting = null;
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, [density, reduced]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-90 ${className}`}
      aria-hidden
    />
  );
};
