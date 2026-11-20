'use client';

import { Bookmark, BookmarkCheck, Clock3, Command, ExternalLink, Globe2, Landmark, Languages, RefreshCw, Search, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
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
const dateTime = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
const dateOnly = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit' });
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' });
const updatedAt = dateTime.format(new Date(dashboard.contentUpdatedAt || dashboard.generatedAt));
const categories = ['全部', '本地AI', '模型', 'AI Coding', '算力', '研究', '产品', '资本', '安全', '开源'];
const companies = [
  ['OpenAI', ['openai', 'codex', 'chatgpt']], ['Google', ['google', 'gemini']], ['Microsoft', ['microsoft', '微软']],
  ['NVIDIA', ['nvidia', '英伟达']], ['AWS', ['aws', 'amazon']], ['阿里 / Qwen', ['阿里', 'qwen', '通义']],
] as const;

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

function AmbientSignalField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: -999, y: -999 };
    const ripples: { x: number; y: number; radius: number; alpha: number }[] = [];
    const particles = Array.from({ length: reduced ? 20 : 60 }, (_, i) => ({ x: (i * 83.7) % 100 / 100, y: (i * 47.3) % 100 / 100, vx: ((i % 5) - 2) * .018, vy: (((i * 3) % 5) - 2) * .012, r: .7 + i % 4 * .3 }));
    let width = 0, height = 0, frame = 0;
    const resize = () => {
      const box = canvas.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 2);
      width = box.width; height = box.height; canvas.width = width * ratio; canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const move = (event: PointerEvent) => { pointer.x = event.clientX; pointer.y = event.clientY; };
    const click = (event: PointerEvent) => ripples.push({ x: event.clientX, y: event.clientY, radius: 0, alpha: .34 });
    const draw = () => {
      context.clearRect(0, 0, width, height);
      const box = canvas.getBoundingClientRect();
      const points = particles.map((p) => {
        if (!reduced) { p.x = (p.x + p.vx / Math.max(width, 1) + 1) % 1; p.y = (p.y + p.vy / Math.max(height, 1) + 1) % 1; }
        return { ...p, px: p.x * width, py: p.y * height };
      });
      points.forEach((p, i) => {
        points.slice(i + 1).forEach((q) => {
          const distance = Math.hypot(p.px - q.px, p.py - q.py);
          if (distance < 118) { context.strokeStyle = `rgba(125,211,252,${(1 - distance / 118) * .08})`; context.beginPath(); context.moveTo(p.px, p.py); context.lineTo(q.px, q.py); context.stroke(); }
        });
        const proximity = Math.max(0, 1 - Math.hypot(pointer.x - box.left - p.px, pointer.y - box.top - p.py) / 180);
        context.fillStyle = `rgba(125,211,252,${.2 + proximity * .6})`; context.beginPath(); context.arc(p.px, p.py, p.r + proximity * 1.7, 0, Math.PI * 2); context.fill();
      });
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const wave = ripples[i]; wave.radius += 1.8; wave.alpha *= .974;
        context.strokeStyle = `rgba(125,211,252,${wave.alpha})`; context.beginPath(); context.arc(wave.x - box.left, wave.y - box.top, wave.radius, 0, Math.PI * 2); context.stroke();
        if (wave.alpha < .015) ripples.splice(i, 1);
      }
      frame = requestAnimationFrame(draw);
    };
    resize(); addEventListener('resize', resize); addEventListener('pointermove', move); addEventListener('pointerdown', click); frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); removeEventListener('resize', resize); removeEventListener('pointermove', move); removeEventListener('pointerdown', click); };
  }, []);
  return <canvas ref={ref} className="ambient-signal-field" aria-hidden="true" />;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [range, setRange] = useState(24);
  const [sort, setSort] = useState<'影响力' | '最新' | '来源数'>('影响力');
  const [bilingual, setBilingual] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState(news[0]?.id || 0);
  const [clock, setClock] = useState(() => Date.now());
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 60_000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let saved: number[] = [];
    try { const parsed = JSON.parse(localStorage.getItem('aihub-bookmarks') || '[]'); if (Array.isArray(parsed)) saved = parsed.filter(Number.isInteger); } catch {}
    const timer = setTimeout(() => setBookmarks(saved), 0);
    return () => clearTimeout(timer);
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
  const highImpact = rangeNews.filter((item) => item.impact !== '关注').length;
  const chinaRatio = rangeNews.length ? Math.round(rangeNews.filter((item) => item.region === '中国').length / rangeNews.length * 100) : 0;
  const snapshot = new Date(dashboard.contentUpdatedAt || dashboard.generatedAt).getTime();
  const isStale = dashboard.status?.state !== 'fresh' || (clock - snapshot) / 3600000 > 36;

  const pulseSignals = useMemo(() => {
    const groups = new Map<string, { count: number; total: number }>();
    rangeNews.forEach((item) => { const value = groups.get(item.category) || { count: 0, total: 0 }; groups.set(item.category, { count: value.count + 1, total: value.total + item.score }); });
    return [...groups].map(([name, value]) => ({ name, count: value.count, score: Math.round(value.total / value.count) })).sort((a, b) => b.score - a.score).slice(0, 6);
  }, [rangeNews]);

  const sevenDays = useMemo(() => news.filter((item) => age(item, clock) <= 168), [clock]);
  const trend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, offset) => { const date = new Date(clock - (6 - offset) * 86400000); return { key: dayKey.format(date), label: dateOnly.format(date), count: 0 }; });
    const buckets = new Map(days.map((day) => [day.key, day]));
    sevenDays.forEach((item) => { const bucket = buckets.get(dayKey.format(new Date(item.firstSeenAt || dashboard.contentUpdatedAt || dashboard.generatedAt))); if (bucket) bucket.count += 1; });
    return days;
  }, [clock, sevenDays]);
  const peak = Math.max(1, ...trend.map((day) => day.count));
  const companySignals = useMemo(() => companies.map(([name, aliases]) => {
    const match = (item: NewsItem) => { const text = `${item.title} ${item.titleEn} ${item.tags.join(' ')}`.toLowerCase(); return aliases.some((alias) => text.includes(alias)); };
    return { name, day: rangeNews.filter(match).length, week: sevenDays.filter(match).length };
  }).filter((item) => item.week).sort((a, b) => b.week - a.week), [rangeNews, sevenDays]);

  const toggleBookmark = (id: number) => setBookmarks((items) => {
    const next = items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
    try { localStorage.setItem('aihub-bookmarks', JSON.stringify(next)); } catch {}
    return next;
  });
  const positions = [[15, 65], [30, 29], [47, 68], [64, 27], [80, 61], [91, 28]];

  return (
    <main className="liquid-terminal">
      <AmbientSignalField />
      <header className="liquid-header">
        <a className="liquid-brand" href="#top"><span>AI</span><div><b>Intelligence Hub</b><small>AI 市场情报</small></div></a>
        <label className="liquid-search"><Search size={17} /><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索公司、模型、事件或来源" /><kbd><Command size={11} /> K</kbd></label>
        <div className="liquid-status"><i className={isStale ? 'stale' : ''} /><span>{isStale ? '等待更新' : '研究已更新'}</span><b>{updatedAt}</b></div>
      </header>

      <section className="pulse-stage" id="top">
        <div className="pulse-copy"><span>个人化 AI 情报</span><h1>今天的 AI 市场信号</h1><p>从真实事件中识别影响产品、技术与部署判断的变化。</p></div>
        <div className="pulse-network" aria-label="当前市场信号分布">
          <svg viewBox="0 0 100 90" preserveAspectRatio="none" aria-hidden="true">{pulseSignals.map((signal, i) => <line key={signal.name} x1="50" y1="48" x2={positions[i][0]} y2={positions[i][1]} />)}</svg>
          <span className="network-core"><b>{rangeNews.length}</b><small>事件</small></span>
          {pulseSignals.map((signal, i) => <button key={signal.name} className={signal.score >= 88 ? 'hot' : ''} style={{ left: `${positions[i][0]}%`, top: `${positions[i][1]}%`, width: 43 + signal.count * 7, height: 43 + signal.count * 7 }} onClick={() => setCategory(signal.name)}><b>{signal.name}</b><small>{signal.count} · {signal.score}</small></button>)}
        </div>
        <div className="pulse-metrics"><span><small>扫描线索</small><b>{dashboard.stats.rawSignals}</b></span><span><small>高影响</small><b>{highImpact}</b></span><span><small>中国相关</small><b>{chinaRatio}%</b></span><span><small>官方源</small><b>{dashboard.sourceHealth.officialHealthy}</b></span></div>
      </section>

      <nav className="terminal-controls" aria-label="新闻筛选">
        <div className="category-strip">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}<em>{item === '全部' ? rangeNews.length : rangeNews.filter((entry) => entry.category === item).length}</em></button>)}</div>
        <div className="control-actions"><div>{[[24, '24小时'], [72, '3天'], [168, '7天']].map(([value, label]) => <button key={value} className={range === value ? 'active' : ''} onClick={() => setRange(Number(value))}>{label}</button>)}</div><select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option>影响力</option><option>最新</option><option>来源数</option></select></div>
      </nav>

      <section className="terminal-workspace">
        <section className="signal-scanner">
          <header><div><span>实时信号</span><h2>新闻扫描</h2></div><b>{filtered.length}</b></header>
          <div className="scanner-list">{filtered.map((item, index) => <button key={item.id} className={selected?.id === item.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)}><span className="scanner-rank">{String(index + 1).padStart(2, '0')}</span><span className="scanner-copy"><small><i className={`impact-dot impact-${item.impact}`} />{item.category} · {relativeTime(item, clock)}</small><b>{item.title}</b><em>{item.source} · {item.score}</em></span></button>)}
          {!filtered.length && <div className="scanner-empty"><Search size={21} /><b>没有匹配的信号</b><button onClick={() => { setQuery(''); setCategory('全部'); setRange(168); }}>重置筛选</button></div>}</div>
        </section>

        {selected && <article className="signal-detail">
          <header className="detail-meta"><div><span className={`impact-pill impact-${selected.impact}`}>{selected.impact}</span><span>{selected.region}</span><span>{selected.category}</span><span><Clock3 size={13} /> {relativeTime(selected, clock)}</span></div><div><button onClick={() => toggleBookmark(selected.id)}>{bookmarks.includes(selected.id) ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}</button><a href={selected.url} target="_blank" rel="noreferrer"><ExternalLink size={17} /> 原文</a></div></header>
          <div className="detail-title"><span>{String(filtered.findIndex((item) => item.id === selected.id) + 1).padStart(2, '0')} / {String(filtered.length).padStart(2, '0')}</span><h2>{selected.title}</h2>{bilingual && <p>{selected.titleEn}</p>}</div>
          <p className="detail-summary">{selected.summary}</p>
          {!!relevance(selected).length && <div className="detail-relevance"><b>与你相关</b>{relevance(selected).map((item) => <span key={item.name}>{item.name}</span>)}</div>}
          <div className="detail-analysis"><section><span>发生了什么变化</span><p>{selected.change || selected.summary}</p></section><section><span>为什么重要</span><p>{selected.why}</p></section><section><span>下一步观察</span><p>{selected.watch || '继续观察后续产品可用性、定价和第三方验证。'}</p></section></div>
          <footer className="detail-sources"><div><ShieldCheck size={15} /><span>{selected.verification || `${selected.sources.length} 个来源`}</span></div>{selected.sourceLinks.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name}{source.tier === 1 ? ' · 官方' : ''}</a>)}</footer>
        </article>}
      </section>

      <section className="terminal-depth">
        <article className="brief-module"><header><Sparkles size={16} /><span>今日判断</span></header><h2>{dashboard.brief.title}</h2><ul>{dashboard.brief.bullets.slice(0, 3).map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></article>
        <article className="company-module"><header><Landmark size={16} /><span>公司动量</span></header>{companySignals.map((company) => <div key={company.name}><b>{company.name}</b><span>{company.day} / {company.week}</span><i><em style={{ width: `${company.week / Math.max(1, companySignals[0]?.week || 1) * 100}%` }} /></i></div>)}</article>
        <article className="density-module"><header><TrendingUp size={16} /><span>7日事件密度</span></header><div>{trend.map((day) => <span key={day.key}><i style={{ height: `${Math.max(5, day.count / peak * 100)}%` }} /><b>{day.count}</b><small>{day.label}</small></span>)}</div></article>
      </section>

      <footer className="liquid-footer"><span><Globe2 size={14} /> {dashboard.mode}</span><span>{dashboard.sourceHealth.healthy}/{dashboard.sourceHealth.attempted} 来源有效</span><button onClick={() => setBilingual(!bilingual)}><Languages size={14} /> {bilingual ? '双语开启' : '仅中文'}</button><span><RefreshCw size={13} /> {updatedAt}</span></footer>
    </main>
  );
}
