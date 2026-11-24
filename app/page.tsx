'use client';

import { ArrowDown, Bookmark, BookmarkCheck, Check, ChevronDown, Command, ExternalLink, Filter, Globe2, Languages, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import dashboardJson from '@/data/dashboard.json';
import focusProfileJson from '@/config/focus-profile.json';
import WaterField from './water-field';

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

function publicationDate(item: NewsItem, full = false) {
  const value = new Date(item.publishedAt);
  // Date-only sources carry a calendar date, not an exact publication instant.
  const zone = item.publishedPrecision === 'date' ? 'UTC' : 'Asia/Shanghai';
  return new Intl.DateTimeFormat('zh-CN', { timeZone: zone, ...(full ? { year: 'numeric' as const } : {}), month: 'long', day: 'numeric', ...(full && item.publishedPrecision !== 'date' ? { hour: '2-digit' as const, minute: '2-digit' as const, hour12: false } : {}) }).format(value);
}
const updatedAt = dateTime.format(new Date(dashboard.contentUpdatedAt || dashboard.generatedAt));

function age(item: NewsItem, clock: number, published = false) {
  const stamp = new Date(published ? item.publishedAt : item.firstSeenAt || dashboard.contentUpdatedAt || dashboard.generatedAt).getTime();
  return Number.isFinite(stamp) ? Math.max(0, (clock - stamp) / 3600000) : Infinity;
}
function relevance(item: NewsItem) {
  const text = `${item.title} ${item.titleEn} ${item.summary} ${item.why} ${item.tags.join(' ')}`.toLowerCase();
  return focusProfile.priorities.filter((p) => p.keywords.some((keyword) => text.includes(keyword.toLowerCase()))).sort((a, b) => b.weight - a.weight).slice(0, 2);
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [range, setRange] = useState(24);
  const [sort, setSort] = useState<'推荐顺序' | '最新发布' | '来源数'>('最新发布');
  const [bilingual, setBilingual] = useState(false);
  const t = (zh: string, en: string) => bilingual ? en : zh;
  const categoryLabel = (value: string) => bilingual ? ({ '全部': 'All', '本地AI': 'China AI', '模型': 'Models', '算力': 'Infrastructure', '研究': 'Research', '产品': 'Products', '资本': 'Business', '安全': 'Safety', '开源': 'Open source' } as Record<string, string>)[value] || value : value === '本地AI' ? '本土 AI' : value;
  useEffect(() => { document.documentElement.lang = bilingual ? 'en' : 'zh-CN'; document.title = bilingual ? 'Noted | Your daily read on AI.' : '有数儿｜AI 的事，心里有数。'; }, [bilingual]);
  const displayTitle = (item: NewsItem) => bilingual ? item.titleEn || item.title : item.title;
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
      .sort((a, b) => sort === '最新发布' ? age(a, clock, true) - age(b, clock, true) : sort === '来源数' ? b.sources.length - a.sources.length : b.score - a.score);
  }, [category, clock, query, rangeNews, sort]);
  const selected = filtered.find((item) => item.id === selectedId) || filtered[0];
  const snapshot = new Date(dashboard.contentUpdatedAt || dashboard.generatedAt).getTime();
  const isStale = dashboard.status?.state !== 'fresh' || (clock - snapshot) / 3600000 > 36;
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
      <header className="intelligence-header">
        <a className="intelligence-brand" aria-label={t('有数儿首页', 'Noted home')} href="#top"><div><b>{t('有数儿', 'Noted')}<em>AI</em></b><small>{t('AI 的事，心里有数。', 'Your daily read on AI.')}</small></div></a>
        <label className="intelligence-search"><Search size={17} /><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t('搜索新闻', 'Search news')} placeholder={t('搜索公司、模型、事件或来源', 'Search companies, models or news')} /><kbd><Command size={11} /> K</kbd></label>
        <button className="language-switch" onClick={() => setBilingual(!bilingual)} aria-label="Switch interface language">{bilingual ? '中文' : 'EN'}</button><div className="intelligence-status"><i className={isStale ? 'stale' : ''} /><span>{isStale ? t('等待更新', 'Awaiting update') : t('已更新', 'Updated')}</span><b>{updatedAt}</b></div>
      </header>

      <section className="signal-hero noted-hero" id="top">
        <WaterField />
        <div className="hero-heading"><span>{t('每日精选', 'THE DAILY READ')}</span><h1>{bilingual ? 'A closer read on AI.' : dashboard.brief.title.replace(/^(今日重点|今天重点|今日判断)[：:]/, '')}</h1><p>{t('读你关心的进展，找到值得继续追问的事。', 'The developments worth your attention. The questions worth following.')}</p></div>

        <div className="signal-map" aria-label="当前市场信号图谱">
          <svg className="noted-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {pulseSignals.map((signal, i) => <line key={`core-${signal.name}`} className={hoverSignal === signal.name ? 'active' : ''} x1="50" y1="50" x2={positions[i][0]} y2={positions[i][1]} />)}
            {pulseSignals.slice(0, -1).map((signal, i) => <line key={`mesh-${signal.name}`} className="mesh" x1={positions[i][0]} y1={positions[i][1]} x2={positions[i + 1][0]} y2={positions[i + 1][1]} />)}
          </svg>
          <button className="signal-core" onClick={() => chooseSignal('全部')}><span>{t('新闻', 'Stories')}</span><b>{rangeNews.length}</b><small>{t('查看全部', 'View all')}</small></button>
          {pulseSignals.map((signal, i) => <button key={signal.name} className={`signal-node ${category === signal.name ? 'selected' : ''}`} style={{ left: `${positions[i][0]}%`, top: `${positions[i][1]}%`, '--node-size': `${64 + Math.min(28, signal.count * 7)}px` } as React.CSSProperties} onPointerEnter={() => setHoverSignal(signal.name)} onPointerLeave={() => setHoverSignal(null)} onFocus={() => setHoverSignal(signal.name)} onBlur={() => setHoverSignal(null)} onClick={() => chooseSignal(signal.name)}><b>{categoryLabel(signal.name)}</b><small>{signal.count} {t('条','stories')}</small></button>)}
          <div className={`signal-tooltip ${activeSignal ? 'visible' : ''}`}><span>{categoryLabel(activeSignal?.name || '分类新闻')}</span><b>{activeSignal?.title || '悬停节点查看该领域的首要事件'}</b><small>点击以筛选并进入新闻扫描</small></div>
        </div>

        <aside className="focus-now"><header><Sparkles size={14} /><span>{t('值得一读', 'WORTH YOUR TIME')}</span></header>{leadSignals.map((item) => <button aria-label={displayTitle(item)} key={item.id} onClick={() => { setCategory('全部'); setSelectedId(item.id); terminalRef.current?.scrollIntoView({ behavior: 'smooth' }); }}><span><b>{displayTitle(item)}</b><small>{categoryLabel(item.category)} · {publicationDate(item)}</small></span></button>)}</aside>
        <button className="enter-terminal" onClick={() => terminalRef.current?.scrollIntoView({ behavior: 'smooth' })}><span>{t('浏览新闻', 'Explore stories')}</span><ArrowDown size={16} /></button>
      </section>


      <section className="research-terminal" ref={terminalRef}>
        <aside className="filter-rail">
          <header><Filter size={15} /><span>{t('筛选', 'Filters')}</span></header>
          <section><small>{t('时间范围', 'Added within')}</small>{[[24, '24 小时'], [72, '3 天'], [168, '7 天']].map(([value, label]) => <button key={value} className={range === value ? 'active' : ''} onClick={() => setRange(Number(value))}><span>{bilingual ? Number(value) === 24 ? '24 hours' : Number(value) === 72 ? '3 days' : '7 days' : label}</span>{range === value && <Check size={13} />}</button>)}</section>
          <section><small>{t('情报领域', 'Topics')}</small>{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}><span>{categoryLabel(item)}</span><em>{item === '全部' ? rangeNews.length : rangeNews.filter((entry) => entry.category === item).length}</em></button>)}</section>
          <section><small>{t('排序', 'Sort')}</small><select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="最新发布">{t('最新发布','Latest published')}</option><option value="推荐顺序">{t('推荐顺序','Recommended')}</option><option value="来源数">{t('来源数','Source count')}</option></select></section>
        </aside>

        <section className="news-scanner">
          <header><div><span>{t('新闻', 'STORIES')}</span><h2>{category === '全部' ? t('新闻列表', 'All stories') : categoryLabel(category)}</h2></div><b>{filtered.length}</b></header>
          <div className="news-list">{filtered.map((item) => <button aria-label={displayTitle(item)} key={item.id} className={selected?.id === item.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)}><span className="news-copy"><small>{categoryLabel(item.category)} · <time dateTime={item.publishedAt}>{publicationDate(item)}</time></small><b>{displayTitle(item)}</b><em>来源：{item.source}</em></span></button>)}
          {!filtered.length && <div className="news-empty"><Search size={22} /><b>这个范围内没有匹配新闻</b><p>扩大时间范围或清除当前筛选。</p><button onClick={() => { setQuery(''); setCategory('全部'); setRange(168); }}>查看 7 天全部新闻</button></div>}</div>
        </section>

        {selected && <article className="research-detail">
          <header className="research-meta"><div><time dateTime={selected.publishedAt}>{publicationDate(selected, true)}发布</time><span>{selected.region}</span><span>{categoryLabel(selected.category)}</span></div><div><button aria-label="收藏" onClick={() => toggleBookmark(selected.id)}>{bookmarks.includes(selected.id) ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}</button><a href={selected.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> {t('阅读原文', 'Read source')}</a></div></header>
          <div className="research-title"><h2>{displayTitle(selected)}</h2>{bilingual && <p className="language-note">Analysis below is currently available in Chinese.</p>}</div>
          <p className="research-summary">{selected.summary}</p>
          <section className="editorial-take"><span>{t('核心判断', 'Our read')}</span><p>{selected.why}</p></section>
          {!!relevance(selected).length && <div className="research-relevance"><b>{t('与你相关', 'Your interests')}</b>{relevance(selected).map((item) => <span key={item.name}>{item.name}</span>)}</div>}
          <div className="related-topics"><span>{t('相关主题：', 'Related topics: ')}</span>{[...new Set(selected.tags.filter((tag) => tag !== selected.category))].map(categoryLabel).join('、')}</div>
          <div className="research-timeline">
            <details open><summary><span>{t('发生了什么变化', 'What changed')}</span><ChevronDown size={16} /></summary><p>{selected.change || selected.summary}</p></details>
            <details><summary><span>{t('下一步观察', 'What to watch')}</span><ChevronDown size={16} /></summary><p>{selected.watch || '继续观察后续产品可用性、定价和第三方验证。'}</p></details>
            <details><summary><span>{t('来源与验证', 'Sources')}</span><ChevronDown size={16} /></summary><div className="source-links"><p><ShieldCheck size={15} />{selected.verification || `${selected.sources.length} 个来源交叉核验`}</p>{selected.sourceLinks.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name}{source.tier === 1 ? ' · 官方' : ''}<ExternalLink size={12} /></a>)}</div></details>
          </div>
        </article>}
      </section>

      <footer className="intelligence-footer"><span><Globe2 size={14} /> {dashboard.mode}</span><span>{dashboard.sourceHealth.healthy}/{dashboard.sourceHealth.attempted} 来源有效</span><span><Languages size={14} /> {t('有数儿 · 每日精选', 'Noted · Your daily read on AI.')}</span></footer>
    </main>
  );
}
