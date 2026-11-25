'use client';

import { useEffect, useRef } from 'react';

type Clue = { id: number; title: string; label: string };
export default function NewsLens({ clues, onSelect, english = false }: { clues: Clue[]; onSelect: (id: number) => void; english?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const demoUntil = useRef(0);
  const explored = useRef(false);
  useEffect(() => {
    const el = host.current, view = canvas.current, glass = lens.current;
    const hero = el?.parentElement;
    const ctx = view?.getContext('2d');
    if (!el || !view || !glass || !hero || !ctx) return;
    const surface = document.createElement('canvas');
    const ink = surface.getContext('2d');
    if (!ink) return;
    const terrain = new Image();
    // Resolve relative to the page so the same asset works under GitHub Pages' subpath.
    terrain.src = new URL('news-terrain.png', window.location.href.split('#')[0]).href;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('.discovery-clue'));
    let w = 1, h = 1, ratio = 1, frame = 0, time = 0, last = 0, inView = true;
    const p = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, alpha: 1, targetAlpha: 1, initialized: false };
    const radius = () => w < 760 ? 100 : Math.min(182, w * .137);
    const resize = () => {
      const box = el.getBoundingClientRect(); w = box.width; h = box.height; ratio = Math.min(devicePixelRatio || 1, 1.5);
      view.width = surface.width = Math.round(w * ratio); view.height = surface.height = Math.round(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ink.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (!p.initialized) { p.x = p.tx = w * .46; p.y = p.ty = h * .57; p.initialized = true; }
    };
    if (!explored.current) demoUntil.current = performance.now() + 5000;
    const move = (event: PointerEvent) => {
      explored.current = true; demoUntil.current = 0; el.dataset.explored = 'true';
      const box = el.getBoundingClientRect(); p.tx = event.clientX - box.left; p.ty = event.clientY - box.top;
      const target = event.target as Element;
      p.targetAlpha = target.closest('.hero-heading,.focus-now,.enter-terminal') ? 0 : 1;
    };
    const leave = () => { p.tx = w * .46; p.ty = h * .57; p.targetAlpha = 1; };
    const draw = (now: number) => {
      frame = 0;
      const dt = Math.min(.035, last ? (now - last) / 1000 : .016), step = dt * 60;
      last = now; if (!reduced.matches) time += dt;
      if (now < demoUntil.current && !reduced.matches) {
        p.tx = w * (.46 + Math.sin(time * 1.1) * .055);
        p.ty = h * (.60 + Math.sin(time * .8) * .035);
      }
      p.vx = (p.vx + (p.tx - p.x) * .025 * step) * Math.pow(.78, step);
      p.vy = (p.vy + (p.ty - p.y) * .025 * step) * Math.pow(.78, step);
      if (reduced.matches) { p.x = p.tx; p.y = p.ty; } else { p.x += p.vx * step; p.y += p.vy * step; }
      p.alpha += (p.targetAlpha - p.alpha) * (1 - Math.exp(-dt * 8));
      ink.clearRect(0, 0, w, h);
      const spacing = w < 760 ? 7 : 8;
      // A halftone information landscape, rendered once then magnified optically.
      if (!terrain.complete || !terrain.naturalWidth) for (let y = h * .42; y < h * .95; y += spacing) {
        for (let x = 12; x < w * .69; x += spacing) {
          const hill = Math.sin(x * .009 + time * .08) * 15 + Math.cos(x * .017 + y * .012 - time * .12) * 12;
          const yy = y + hill;
          const fade = Math.sin((y / h - .42) / .53 * Math.PI) * Math.max(0, 1 - x / (w * .72));
          const shimmer = .5 + .5 * Math.sin(x * .012 + y * .024 + time * .15);
          ink.fillStyle = `rgba(231,225,212,${Math.max(0, fade * (.08 + shimmer * .23))})`;
          ink.beginPath(); ink.arc(x, yy, .55 + shimmer * .45, 0, Math.PI * 2); ink.fill();
        }
      }
      if (terrain.complete && terrain.naturalWidth) {
        ink.clearRect(0, 0, w, h);
        const areaWidth = w < 760 ? w : w * .74;
        const areaHeight = h * .95;
        const parallaxX = reduced.matches ? 0 : (p.x / w - .46) * 9;
        const parallaxY = reduced.matches ? 0 : (p.y / h - .6) * 5;
        // Small, coherent displacements keep the photographic grains alive.
        // Magnification samples this same surface so the lens stays aligned.
        const strip = 40;
        for (let y = 0; y < areaHeight; y += strip) {
          const height = Math.min(strip, areaHeight - y);
          const wave = reduced.matches ? 0 : Math.sin(y * .008 + time * .4) * 3.5;
          const swell = reduced.matches ? 0 : Math.sin(time * .3 + y * .005) * 2;
          ink.drawImage(terrain, 0, y / areaHeight * terrain.naturalHeight, terrain.naturalWidth,
            height / areaHeight * terrain.naturalHeight, parallaxX + wave, h * .12 + y + parallaxY + swell, areaWidth, height + 1);
        }
        // Keep the image's black edges seamless against the cover.
        const fade = ink.createLinearGradient(0, h * .8, 0, h);
        fade.addColorStop(0, 'rgba(9,10,9,0)'); fade.addColorStop(1, '#090a09');
        ink.fillStyle = fade; ink.fillRect(0, h * .8, w, h * .2);
      }
      ctx.clearRect(0, 0, w, h); ctx.drawImage(surface, 0, 0, w, h);
      const r = radius();
      el.style.setProperty('--lens-x', `${p.x}px`);
      el.style.setProperty('--lens-y', `${p.y}px`);
      el.style.setProperty('--lens-r', `${Math.max(1, r - 12)}px`);
      glass.style.width = glass.style.height = `${r * 2}px`;
      glass.style.transform = `translate3d(${p.x - r}px,${p.y - r}px,0)`;
      glass.style.opacity = String(p.alpha);
      if (p.alpha > .01) {
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.beginPath(); ctx.arc(p.x, p.y, r - 5, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = '#090a09'; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
        const zoom = 1.6;
        ctx.drawImage(surface, (p.x - r / zoom) * ratio, (p.y - r / zoom) * ratio, r * 2 / zoom * ratio, r * 2 / zoom * ratio, p.x - r, p.y - r, r * 2, r * 2);
        ctx.fillStyle = 'rgba(220,231,229,.025)'; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2); ctx.restore();
      }
      buttons.forEach(button => {
        const bx = Number(button.dataset.x) * w, by = Number(button.dataset.y) * h;
        const near = Math.max(0, 1 - Math.hypot(bx - p.x, by - p.y) / (r * 1.1)) * p.alpha;
        button.style.setProperty('--reveal', String(near));
      });
      if (inView && !document.hidden && !reduced.matches) frame = requestAnimationFrame(draw);
    };
    const resume = () => { if (!frame && inView && !document.hidden) { last = 0; frame = requestAnimationFrame(draw); } };
    const pointerMove = (event: PointerEvent) => { move(event); resume(); };
    const demonstrate = () => {
      demoUntil.current = performance.now() + 6500;
      p.tx = w * .46; p.ty = h * .6; p.targetAlpha = 1;
      resume();
    };
    const focusClue = (event: FocusEvent) => {
      const button = (event.target as Element).closest<HTMLButtonElement>('.discovery-clue');
      if (!button) return;
      explored.current = true; demoUntil.current = 0; el.dataset.explored = 'true';
      p.tx = Number(button.dataset.x) * w; p.ty = Number(button.dataset.y) * h; p.targetAlpha = 1; resume();
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView) resume(); else { cancelAnimationFrame(frame); frame = 0; } });
    const size = new ResizeObserver(() => { resize(); resume(); });
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else resume(); };
    const guide = el.querySelector<HTMLButtonElement>('.discovery-guide');
    guide?.addEventListener('click', demonstrate);
    hero.addEventListener('pointermove', pointerMove, { passive: true }); hero.addEventListener('pointerleave', leave);
    hero.addEventListener('focusin', focusClue);
    document.addEventListener('visibilitychange', visibility); reduced.addEventListener('change', resume);
    terrain.onload = resume;
    observer.observe(el); size.observe(el); resize(); resume();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); size.disconnect(); guide?.removeEventListener('click', demonstrate); hero.removeEventListener('pointermove', pointerMove); hero.removeEventListener('pointerleave', leave); hero.removeEventListener('focusin', focusClue); document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', resume); };
  }, [clues]);
  const places = [[.46, .60], [.31, .76], [.16, .66], [.55, .81]];
  return <div className="news-discovery" ref={host}>
    <canvas ref={canvas} aria-hidden="true" />
    <div className="discovery-glass" ref={lens} aria-hidden="true"><span className="glass-glint" /><i className="glass-handle" /><span className="glass-crosshair"><b>{english ? 'Something new?' : '发现新动作？'}</b></span></div>
    <div className="discovery-clues">{clues.slice(0, 4).map((clue, i) => <button key={clue.id} className="discovery-clue" data-x={places[i][0]} data-y={places[i][1]} style={{ left: `${places[i][0] * 100}%`, top: `${places[i][1] * 100}%` }} onClick={() => onSelect(clue.id)} aria-label={`${english ? 'Read story: ' : '阅读新闻：'}${clue.title}`}><span>{clue.label}</span><small>{english ? 'Read story ↗' : '展开新闻 ↗'}</small></button>)}</div>
    <div className="discovery-onboarding"><p>{english ? 'Move over the dunes. Discover a story.' : '移入沙丘，看看藏着什么新动作。'}</p><small>{english ? 'Click a revealed keyword to read the story.' : '找到关键词，点击就能读新闻。'}</small><button className="discovery-guide" type="button">{english ? 'Show me a story' : '带我找一条'}<span aria-hidden="true" className="guide-orbit" /></button></div>
  </div>;
}
