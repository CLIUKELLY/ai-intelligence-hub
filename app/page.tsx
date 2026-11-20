'use client';

import { Activity, ArrowDown, Bookmark, BookmarkCheck, Check, ChevronDown, Clock3, Command, ExternalLink, Filter, Globe2, Languages, RefreshCw, Search, ShieldCheck, Sparkles, Waves } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import dashboardJson from '@/data/dashboard.json';
import focusProfileJson from '@/config/focus-profile.json';

export const dynamic = 'force-static';

type Impact = '突发' | '高影响' | '关注';
type Region = '中国' | '全球';
type NewsItem = {
  id: number; title: string; titleEn: string; summary: string; why: string; source: string;
  sources: string[]; publishedAt: string; category: string; region: Region; impact: Impact;
  score: number; rank: number; url: string; tags: string[]; firstSeenAt?: string;
  publishedPrecision?: 'datetime' | 'date'; change?: string; watch?: string; verification?: string;
  sourceLinks: { name: string; url: string; tier: number }[];
};
type Dashboard = {
  generatedAt: string; contentUpdatedAt?: string; status?: { state: 'fresh' | 'stale' | 'failed' };
  mode: string; stats: { rawSignals: number }; sourceHealth: { attempted: number; healthy: number; officialHealthy: number };
  brief: { title: string; bullets: string[] }; items: NewsItem[];
};
type FocusProfile = { priorities: { name: string; weight: number; keywords: string[] }[] };

const dashboard = dashboardJson as Dashboard;
const focusProfile = focusProfileJson as FocusProfile;
const news = dashboard.items;
const categories = ['全部', '本地AI', '模型', 'AI Coding', '算力', '研究', '产品', '资本', '安全', '开源'];
const dateTime = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
const dateOnly = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit' });
const updatedAt = dateTime.format(new Date(dashboard.contentUpdatedAt || dashboard.generatedAt));

function age(item: NewsItem, clock: number, published = false) {
  const stamp = new Date(published ? item.publishedAt : item.firstSeenAt || dashboard.contentUpdatedAt || dashboard.generatedAt).getTime();
  return Number.isFinite(stamp) ? Math.max(0, (clock - stamp) / 3600000) : Infinity;
}
function relativeTime(item: NewsItem, clock: number) {
  if (item.publishedPrecision === 'date') return dateOnly.format(new Date(item.publishedAt));
  const hours = age(item, clock, true);
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${Math.floor(hours)} 小时前`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days} 天前` : dateOnly.format(new Date(item.publishedAt));
}
function relevance(item: NewsItem) {
  const text = `${item.title} ${item.titleEn} ${item.summary} ${item.why} ${item.tags.join(' ')}`.toLowerCase();
  return focusProfile.priorities.filter((p) => p.keywords.some((keyword) => text.includes(keyword.toLowerCase()))).sort((a, b) => b.weight - a.weight).slice(0, 2);
}

function IntelligenceField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: -999, y: -999, px: -999, py: -999, speed: 0 };
    const ripples: { x: number; y: number; radius: number; alpha: number; hue: number }[] = [];
    const particles = Array.from({ length: reduced ? 24 : 92 }, (_, i) => ({
      x: ((i * 83.7) % 100) / 100, y: ((i * 47.3) % 100) / 100,
      vx: ((i % 7) - 3) * .008, vy: (((i * 3) % 7) - 3) * .006,
      r: .5 + (i % 5) * .25, hue: i % 7 === 0 ? 266 : 198,
    }));
    let width = 0, height = 0, frame = 0;
    const resize = () => {
      const box = canvas.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 2);
      width = box.width; height = box.height; canvas.width = width * ratio; canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const move = (event: PointerEvent) => {
      pointer.px = pointer.x; pointer.py = pointer.y; pointer.x = event.clientX; pointer.y = event.clientY;
      pointer.speed = Math.min(26, Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py));
    };
    const click = (event: PointerEvent) => {
      ripples.push({ x: event.clientX, y: event.clientY, radius: 0, alpha: .52, hue: Math.random() > .55 ? 198 : 266 });
      window.setTimeout(() => ripples.push({ x: event.clientX, y: event.clientY, radius: 0, alpha: .25, hue: 198 }), 120);
    };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      const box = canvas.getBoundingClientRect();
      const localX = pointer.x - box.left, localY = pointer.y - box.top;
      const points = particles.map((p) => {
        const dx = localX - p.x * width, dy = localY - p.y * height;
        const dist = Math.max(26, Math.hypot(dx, dy));
        if (!reduced) {
          const pull = dist < 260 ? (1 - dist / 260) * .022 : 0;
          p.x = (p.x + p.vx / Math.max(width, 1) + dx / dist * pull / Math.max(width, 1) + 1) % 1;
          p.y = (p.y + p.vy / Math.max(height, 1) + dy / dist * pull / Math.max(height, 1) + 1) % 1;
        }
        return { ...p, px: p.x * width, py: p.y * height, proximity: Math.max(0, 1 - dist / 230) };
      });
      points.forEach((p, i) => {
        points.slice(i + 1).forEach((q) => {
          const distance = Math.hypot(p.px - q.px, p.py - q.py);
          if (distance < 112) {
            context.strokeStyle = `hsla(${p.hue},92%,72%,${(1 - distance / 112) * (.055 + p.proximity * .08)})`;
            context.beginPath(); context.moveTo(p.px, p.py); context.lineTo(q.px, q.py); context.stroke();
          }
        });
        context.fillStyle = `hsla(${p.hue},92%,72%,${.16 + p.proximity * .7})`;
        context.beginPath(); context.arc(p.px, p.py, p.r + p.proximity * 2.2, 0, Math.PI * 2); context.fill();
      });
      if (pointer.speed > 2 && localX > 0 && localY > 0) {
        const gradient = context.createLinearGradient(localX, localY, localX - (pointer.x - pointer.px) * 5, localY - (pointer.y - pointer.py) * 5);
        gradient.addColorStop(0, `rgba(125,211,252,${Math.min(.3, pointer.speed / 70)})`); gradient.addColorStop(1, 'rgba(125,211,252,0)');
        context.strokeStyle = gradient; context.lineWidth = 1.2; context.beginPath(); context.moveTo(localX, localY); context.lineTo(localX - (pointer.x - pointer.px) * 5, localY - (pointer.y - pointer.py) * 5); context.stroke();
      }
      pointer.speed *= .92;
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const wave = ripples[i]; wave.radius += 2.6; wave.alpha *= .971;
        context.strokeStyle = `hsla(${wave.hue},92%,72%,${wave.alpha})`; context.lineWidth = 1;
        context.beginPath(); context.arc(wave.x - box.left, wave.y - box.top, wave.radius, 0, Math.PI * 2); context.stroke();
        if (wave.alpha < .012) ripples.splice(i, 1);
      }
      frame = requestAnimationFrame(draw);
    };
    resize(); addEventListener('resize', resize); addEventListener('pointermove', move); addEventListener('pointerdown', click); frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); removeEventListener('resize', resize); removeEventListener('pointermove', move); removeEventListener('pointerdown', click); };
  }, []);
  return <canvas ref={ref} className="intelligence-field" aria-hidden="true" />;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [range, setRange] = useState(24);
  const [sort, setSort] = useState<'影响力' | '最新' | '来源数'>('影响力');
  const [bilingual, setBilingual] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState(news[0]?.id || 0);
  const [hoverSignal, setHoverSignal] = useState<string | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const searchRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLElement>(null);

  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 60_000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let saved: number[] = [];
    try { const parsed = JSON.parse(localStorage.getItem('aihub-bookmarks') || '[]'); if (Array.isArray(parsed)) saved = parsed.filter(Number.isInteger); } catch {}
    const timer = window.setTimeout(() => setBookmarks(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus(); } };
    addEventListener('keydown', shortcut); return () => removeEventListener('keydown', shortcut);
  }, []);

  const rangeNews = useMemo(() => news.filter((item) => age(item, clock) <= range), [clock, range]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rangeNews.filter((item) => (category === '全部' || item.category === category) && (!q || `${item.title} ${item.titleEn} ${item.summary} ${item.source} ${item.tags.join(' ')}`.toLowerCase().includes(q)))
      .sort((a, b) => sort === '最新' ? age(a, clock, true) - age(b, clock, true) : sort === '来源数' ? b.sources.length - a.sources.length : b.score - a.score);
  }, [category, clock, query, rangeNews, sort]);
  const selected = filtered.find((item) => item.id === selectedId) || filtered[0];
  const snapshot = new Date(dashboard.contentUpdatedAt || dashboard.generatedAt).getTime();
  const isStale = dashboard.status?.state !== 'fresh' || (clock - snapshot) / 3600000 > 36;
  const highImpact = rangeNews.filter((item) => item.impact !== '关注').length;
  const chinaRatio = rangeNews.length ? Math.round(rangeNews.filter((item) => item.region === '中国').length / rangeNews.length * 100) : 0;
  const pulseSignals = useMemo(() => {
    const groups = new Map<string, { count: number; total: number; title: string }>();
    rangeNews.forEach((item) => { const value = groups.get(item.category) || { count: 0, total: 0, title: item.title }; groups.set(item.category, { count: value.count + 1, total: value.total + item.score, title: value.total > item.score ? value.title : item.title }); });
    return [...groups].map(([name, value]) => ({ name, count: value.count, score: Math.round(value.total / value.count), title: value.title })).sort((a, b) => b.score - a.score).slice(0, 7);
  }, [rangeNews]);
  const positions = [[13, 62], [24, 25], [42, 74], [61, 20], [76, 65], [89, 31], [92, 78]];
  const leadSignals = rangeNews.slice().sort((a, b) => b.score - a.score).slice(0, 3);
  const activeSignal = hoverSignal ? pulseSignals.find((item) => item.name === hoverSignal) : null;

  const chooseSignal = (name: string) => {
    setCategory(name); setHoverSignal(name);
    window.setTimeout(() => terminalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 260);
  };
  const toggleBookmark = (id: number) => setBookmarks((items) => {
    const next = items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
    try { localStorage.setItem('aihub-bookmarks', JSON.stringify(next)); } catch {}
    return next;
  });

  return (
    <main className="intelligence-terminal">
      <IntelligenceField />
      <div className="boot-scan" aria-hidden="true" />
      <header className="intelligence-header">
        <a className="intelligence-brand" href="#top"><span>AI</span><div><b>Intelligence Hub</b><small>个人化市场情报</small></div></a>
        <label className="intelligence-search"><Search size={17} /><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索公司、模型、事件或来源" /><kbd><Command size={11} /> K</kbd></label>
        <div className="intelligence-status"><i className={isStale ? 'stale' : ''} /><span>{isStale ? '等待更新' : '情报已更新'}</span><b>{updatedAt}</b></div>
      </header>

      <section className="signal-hero" id="top">
        <div className="hero-orbit" aria-hidden="true"><i /><i /><i /></div>
        <div className="hero-heading"><span><Activity size={13} /> 市场脉搏</span><h1>先看懂变化，<br />再进入新闻。</h1><p>{dashboard.brief.title}</p></div>
        <div className="market-state"><span>当前市场状态</span><b>{highImpact >= 5 ? '高活跃' : highImpact >= 2 ? '结构性升温' : '常态观察'}</b><small>{rangeNews.length} 个有效事件 · {highImpact} 个高影响信号</small></div>

        <div className="signal-map" aria-label="当前市场信号图谱">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {pulseSignals.map((signal, i) => <line key={`core-${signal.name}`} className={hoverSignal === signal.name ? 'active' : ''} x1="50" y1="50" x2={positions[i][0]} y2={positions[i][1]} />)}
            {pulseSignals.slice(0, -1).map((signal, i) => <line key={`mesh-${signal.name}`} className="mesh" x1={positions[i][0]} y1={positions[i][1]} x2={positions[i + 1][0]} y2={positions[i + 1][1]} />)}
          </svg>
          <button className="signal-core" onClick={() => chooseSignal('全部')}><span>今日信号</span><b>{rangeNews.length}</b><small>点击查看全部</small></button>
          {pulseSignals.map((signal, i) => <button key={signal.name} className={`signal-node ${signal.score >= 88 ? 'hot' : ''} ${category === signal.name ? 'selected' : ''}`} style={{ left: `${positions[i][0]}%`, top: `${positions[i][1]}%`, '--node-size': `${54 + Math.min(26, signal.count * 8)}px` } as React.CSSProperties} onPointerEnter={() => setHoverSignal(signal.name)} onPointerLeave={() => setHoverSignal(null)} onFocus={() => setHoverSignal(signal.name)} onBlur={() => setHoverSignal(null)} onClick={() => chooseSignal(signal.name)}><b>{signal.name}</b><small>{signal.count} 条 · {signal.score}</small></button>)}
          <div className={`signal-tooltip ${activeSignal ? 'visible' : ''}`}><span>{activeSignal?.name || '信号详情'}</span><b>{activeSignal?.title || '悬停节点查看该领域的首要事件'}</b><small>点击以筛选并进入新闻扫描</small></div>
        </div>

        <aside className="focus-now"><header><Sparkles size={14} /><span>今天该关注</span></header>{leadSignals.map((item, index) => <button key={item.id} onClick={() => { setCategory('全部'); setSelectedId(item.id); terminalRef.current?.scrollIntoView({ behavior: 'smooth' }); }}><i>{String(index + 1).padStart(2, '0')}</i><span><b>{item.title}</b><small>{item.category} · 影响力 {item.score}</small></span></button>)}</aside>
        <button className="enter-terminal" onClick={() => terminalRef.current?.scrollIntoView({ behavior: 'smooth' })}><span>进入新闻扫描</span><ArrowDown size={16} /></button>
      </section>

      <div className="market-ribbon"><span><Waves size={14} /> 市场状态：{highImpact >= 5 ? '高活跃' : highImpact >= 2 ? '结构性升温' : '常态观察'}</span><i /><b>{rangeNews.length} 信号</b><b>{highImpact} 高影响</b><b>{chinaRatio}% 中国相关</b><small>更新于 {updatedAt}</small></div>

      <section className="research-terminal" ref={terminalRef}>
        <aside className="filter-rail">
          <header><Filter size={15} /><span>筛选</span></header>
          <section><small>时间范围</small>{[[24, '24 小时'], [72, '3 天'], [168, '7 天']].map(([value, label]) => <button key={value} className={range === value ? 'active' : ''} onClick={() => setRange(Number(value))}><span>{label}</span>{range === value && <Check size={13} />}</button>)}</section>
          <section><small>情报领域</small>{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}><span>{item}</span><em>{item === '全部' ? rangeNews.length : rangeNews.filter((entry) => entry.category === item).length}</em></button>)}</section>
          <section><small>排序</small><select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option>影响力</option><option>最新</option><option>来源数</option></select></section>
        </aside>

        <section className="news-scanner">
          <header><div><span>实时信号</span><h2>{category === '全部' ? '新闻扫描' : category}</h2></div><b>{filtered.length}</b></header>
          <div className="news-list">{filtered.map((item, index) => <button key={item.id} className={`${selected?.id === item.id ? 'selected' : ''} ${item.impact !== '关注' ? 'high-impact' : ''}`} onClick={() => setSelectedId(item.id)}><span className="news-rank">{String(index + 1).padStart(2, '0')}</span><span className="news-copy"><small><i className={`impact-dot impact-${item.impact}`} />{item.category} · {relativeTime(item, clock)}</small><b>{item.title}</b><em>{item.source} · 影响力 {item.score}</em></span></button>)}
          {!filtered.length && <div className="news-empty"><Search size={22} /><b>这个范围内没有匹配信号</b><p>扩大时间范围或清除当前筛选。</p><button onClick={() => { setQuery(''); setCategory('全部'); setRange(168); }}>查看 7 天全部新闻</button></div>}</div>
        </section>

        {selected && <article className="research-detail">
          <header className="research-meta"><div><span className={`impact-pill impact-${selected.impact}`}>{selected.impact}</span><span>{selected.region}</span><span>{selected.category}</span><span><Clock3 size={13} /> {relativeTime(selected, clock)}</span></div><div><button aria-label="收藏" onClick={() => toggleBookmark(selected.id)}>{bookmarks.includes(selected.id) ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}</button><a href={selected.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> 原文</a></div></header>
          <div className="research-title"><span>{String(filtered.findIndex((item) => item.id === selected.id) + 1).padStart(2, '0')} / {String(filtered.length).padStart(2, '0')}</span><h2>{selected.title}</h2>{bilingual && <p>{selected.titleEn}</p>}</div>
          <p className="research-summary">{selected.summary}</p>
          <section className="editorial-take"><span>核心判断</span><p>{selected.why}</p></section>
          {!!relevance(selected).length && <div className="research-relevance"><b>与你相关</b>{relevance(selected).map((item) => <span key={item.name}>{item.name}</span>)}</div>}
          <section className="relationship-map"><header><Activity size={14} /><span>事件关系</span></header><div><b>{selected.category}</b>{selected.tags.slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}<em>{selected.sourceLinks.length} 个核验来源</em></div></section>
          <div className="research-timeline">
            <details open><summary><span><i>01</i>发生了什么变化</span><ChevronDown size={16} /></summary><p>{selected.change || selected.summary}</p></details>
            <details><summary><span><i>02</i>下一步观察</span><ChevronDown size={16} /></summary><p>{selected.watch || '继续观察后续产品可用性、定价和第三方验证。'}</p></details>
            <details><summary><span><i>03</i>来源与验证</span><ChevronDown size={16} /></summary><div className="source-links"><p><ShieldCheck size={15} />{selected.verification || `${selected.sources.length} 个来源交叉核验`}</p>{selected.sourceLinks.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name}{source.tier === 1 ? ' · 官方' : ''}<ExternalLink size={12} /></a>)}</div></details>
          </div>
        </article>}
      </section>

      <footer className="intelligence-footer"><span><Globe2 size={14} /> {dashboard.mode}</span><span>{dashboard.sourceHealth.healthy}/{dashboard.sourceHealth.attempted} 来源有效</span><button onClick={() => setBilingual(!bilingual)}><Languages size={14} /> {bilingual ? '双语开启' : '仅中文'}</button><span><RefreshCw size={13} /> {updatedAt}</span></footer>
    </main>
  );
}
