'use client';

import { useEffect, useRef } from 'react';

// A small, time-based surface simulation. It sleeps offscreen and on hidden tabs.
export default function WaterField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    const hero = canvas?.parentElement;
    if (!canvas || !ctx || !hero) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = matchMedia('(pointer: coarse)').matches;
    let width = 1, height = 1, frame = 0, last = 0, time = 0, visible = true;
    const pointer = { tx: .56, ty: .48, x: .56, y: .48, vx: 0, vy: 0, active: 0, target: 0 };
    const waves: { x: number; y: number; age: number }[] = [];
    const grains = Array.from({ length: coarse ? 420 : 960 }, (_, i) => ({
      x: ((i * .61803398875) % 1), y: ((i * .754877666) % 1),
      phase: i * 2.39996, depth: .3 + (i % 11) / 16,
      ox: 0, oy: 0, vx: 0, vy: 0,
    }));
    const resize = () => {
      const box = hero.getBoundingClientRect(); width = box.width; height = box.height;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const move = (event: PointerEvent) => {
      const box = hero.getBoundingClientRect();
      pointer.tx = (event.clientX - box.left) / width; pointer.ty = (event.clientY - box.top) / height; pointer.target = 1;
    };
    const leave = () => { pointer.target = 0; };
    const touch = (event: PointerEvent) => {
      if (motion.matches || (event.target as Element).closest('button,a,input,select')) return;
      const box = hero.getBoundingClientRect();
      waves.push({ x: event.clientX - box.left, y: event.clientY - box.top, age: 0 });
      if (waves.length > 5) waves.shift();
    };
    const draw = (now: number) => {
      frame = 0;
      const dt = Math.min(.033, last ? (now - last) / 1000 : .016); last = now;
      if (!motion.matches) time += dt;
      const step = dt * 60;
      pointer.vx = (pointer.vx + (pointer.tx - pointer.x) * .015 * step) * Math.pow(.81, step);
      pointer.vy = (pointer.vy + (pointer.ty - pointer.y) * .015 * step) * Math.pow(.81, step);
      pointer.x += pointer.vx * step; pointer.y += pointer.vy * step;
      pointer.active += (pointer.target - pointer.active) * (1 - Math.exp(-dt * 3));
      const mx = pointer.x * width, my = pointer.y * height;
      ctx.clearRect(0, 0, width, height);
      // Visible reflected light anchors the response even between sparse grains.
      const sheen = ctx.createRadialGradient(mx, my, 8, mx, my, 220);
      sheen.addColorStop(0, `rgba(239,220,189,${.025 + pointer.active * .06})`);
      sheen.addColorStop(.45, `rgba(198,179,151,${.015 + pointer.active * .025})`);
      sheen.addColorStop(1, 'rgba(198,179,151,0)');
      ctx.fillStyle = sheen; ctx.fillRect(0, 0, width, height);
      // Closely spaced contour highlights suggest reflected water, not network edges.
      for (let band = 0; band < 30; band++) {
        ctx.beginPath();
        for (let x = -20; x <= width + 20; x += 16) {
          const base = height * (.2 + band * .021);
          const d = Math.hypot(x - mx, base - my);
          const lens = Math.exp(-d * d / 55000) * pointer.active;
          let surfaceWave = 0;
          for (const wave of waves) {
            const distance = Math.hypot(x - wave.x, base - wave.y);
            const crest = distance - wave.age * 125;
            surfaceWave += Math.sin(crest * .055) * Math.exp(-1 * (crest / 55) ** 2) * Math.exp(-wave.age * .5) * 17;
          }
          const y = base + Math.sin(x * .005 + time * .12 + band * .18) * 25 + Math.cos(x * .009 - time * .09 + band * .12) * 12 + lens * Math.sin(d * .014 - time * .6) * 26 + surfaceWave;
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.lineWidth = .85; ctx.strokeStyle = `rgba(224,210,187,${.055 + Math.sin(band * .45 + time * .12) ** 8 * .09})`; ctx.stroke();
      }
      for (const p of grains) {
        const bx = p.x * width, by = p.y * height;
        const dx = bx + p.ox - mx, dy = by + p.oy - my;
        const d = Math.max(1, Math.hypot(dx, dy));
        const force = Math.exp(-d * d / 26000) * pointer.active;
        if (!motion.matches) {
          p.vx += ((dx / d * force * .24 - dy / d * force * .065) * p.depth - p.ox * .0018) * step;
          p.vy += ((dy / d * force * .24 + dx / d * force * .065) * p.depth - p.oy * .0018) * step;
          p.vx *= Math.pow(.93, step); p.vy *= Math.pow(.93, step); p.ox += p.vx * step; p.oy += p.vy * step;
        }
        let displacement = 0;
        for (const wave of waves) {
          const distance = Math.hypot(bx - wave.x, by - wave.y);
          displacement += Math.sin((distance - wave.age * 125) * .055) * Math.exp(-1 * ((distance - wave.age * 125) / 55) ** 2) * Math.exp(-wave.age * .5) * 17;
        }
        const x = bx + p.ox + Math.sin(time * .11 + p.phase) * 3;
        const y = by + p.oy + Math.cos(time * .13 + p.phase) * 3 + displacement;
        ctx.fillStyle = `rgba(239,226,205,${(.26 + force * .48) * p.depth})`;
        ctx.beginPath(); ctx.arc(x, y, .55 + p.depth * .75, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = waves.length - 1; i >= 0; i--) { waves[i].age += dt; if (waves[i].age > 4) waves.splice(i, 1); }
      if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(draw);
    };
    const resume = () => { if (visible && !document.hidden && !frame) { last = 0; frame = requestAnimationFrame(draw); } };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) resume(); else { cancelAnimationFrame(frame); frame = 0; } });
    const sizeObserver = new ResizeObserver(() => { resize(); resume(); });
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else resume(); };
    observer.observe(hero); sizeObserver.observe(hero);
    hero.addEventListener('pointermove', move, { passive: true }); hero.addEventListener('pointerleave', leave); hero.addEventListener('pointerdown', touch);
    document.addEventListener('visibilitychange', visibility); motion.addEventListener('change', resume);
    resize(); resume();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); sizeObserver.disconnect(); hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave); hero.removeEventListener('pointerdown', touch); document.removeEventListener('visibilitychange', visibility); motion.removeEventListener('change', resume); };
  }, []);
  return <canvas ref={ref} className="noted-water" aria-hidden="true" />;
}
