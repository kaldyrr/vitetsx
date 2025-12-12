import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
};

type Props = {
  className?: string;
  density?: number;
};

export const NodeNetworkCanvas = ({ className = '', density = 70 }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = canvas.clientWidth || 640;
    let height = canvas.clientHeight || 340;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const nodes: Node[] = [];
    const count = Math.floor((width / 12) * (height / 12) * 0.004 * (reduced ? 0.7 : 1));
    const nodeCount = Math.min(Math.max(count, 35), density);

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (reduced ? 0.15 : 0.4),
        vy: (Math.random() - 0.5) * (reduced ? 0.15 : 0.4),
        size: 1 + Math.random() * 1.5,
      });
    }

    const mouse = { x: width / 2, y: height / 2, active: false };

    const resize = () => {
      width = canvas.clientWidth || 640;
      height = canvas.clientHeight || 340;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      mouse.active = true;
    };
    const onPointerLeave = () => (mouse.active = false);

    let frameId = 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(0, 0, width, height);

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        if (mouse.active && !reduced) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            node.vx += dx * 0.0005;
            node.vy += dy * 0.0005;
          }
        }
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist2 = dx * dx + dy * dy;
          const maxDist = 180;
          if (dist2 < maxDist * maxDist) {
            const alpha = 1 - Math.sqrt(dist2) / maxDist;
            ctx.strokeStyle = `rgba(63,216,255,${alpha * 0.6})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((node) => {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();
      });

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frameId);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', resize);
    };
  }, [density, reduced]);

  return (
    <canvas
      ref={canvasRef}
      className={`h-full w-full rounded-2xl border border-white/10 bg-black/30 ${className}`}
      aria-hidden
    />
  );
};
