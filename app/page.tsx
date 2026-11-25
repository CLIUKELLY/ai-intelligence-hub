'use client';

import { ArrowDown, Bookmark, BookmarkCheck, Check, ChevronDown, Command, ExternalLink, Filter, Globe2, Languages, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import dashboardJson from '@/data/dashboard.json';
import NewsLens from './news-lens';

export const dynamic = 'force-static';

type Impact = '突发' | '高影响' | '关注';
type Region = '中国' | '全球';
type NewsItem = {
  id: number; title: string; titleEn: string; summary: string; why: string; source: string;
  sources: string[]; publishedAt: string; category: string; region: Region; impact: Impact;
  score: number; rank: number; url: string; tags: string[]; firstSeenAt?: string;
  summaryEn?: string; whyEn?: string; changeEn?: string; watchEn?: string;
  publishedPrecision?: 'datetime' | 'date'; change?: string; watch?: string; verification?: string;
  sourceLinks: { name: string; url: string; tier: number }[];
};
type Dashboard = {
  generatedAt: string; contentUpdatedAt?: string; status?: { state: 'fresh' | 'stale' | 'failed' };
  mode: string; stats: { rawSignals: number }; sourceHealth: { attempted: number; healthy: number; officialHealthy: number };
  brief: { title: string; bullets: string[] }; items: NewsItem[];
};

const dashboard = dashboardJson as Dashboard;
const news = dashboard.items;
const categories = ['全部', '本地AI', '模型', 'AI Coding', '算力', '研究', '产品', '资本', '安全', '开源'];
const dateTime = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

function publicationDate(item: NewsItem, full = false, english = false) {
  const value = new Date(item.publishedAt);
  // Date-only sources carry a calendar date, not an exact publication instant.
  const zone = item.publishedPrecision === 'date' ? 'UTC' : 'Asia/Shanghai';
  return new Intl.DateTimeFormat(english ? 'en-US' : 'zh-CN', { timeZone: zone, ...(full ? { year: 'numeric' as const } : {}), month: 'long', day: 'numeric', ...(full && item.publishedPrecision !== 'date' ? { hour: '2-digit' as const, minute: '2-digit' as const, hour12: false } : {}) }).format(value);
}
const updatedAt = dateTime.format(new Date(dashboard.contentUpdatedAt || dashboard.generatedAt));

function age(item: NewsItem, clock: number, published = false) {
  const stamp = new Date(published ? item.publishedAt : item.firstSeenAt || dashboard.contentUpdatedAt || dashboard.generatedAt).getTime();
  return Number.isFinite(stamp) ? Math.max(0, (clock - stamp) / 3600000) : Infinity;
}
export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [range, setRange] = useState(24);
  const [sort, setSort] = useState<'推荐顺序' | '最新发布' | '来源数'>('最新发布');
  const [bilingual, setBilingual] = useState(false);
  const t = (zh: string, en: string) => bilingual ? en : zh;
  const categoryLabel = (value: string) => bilingual ? ({ '全部': 'All', '本地AI': 'China AI', '模型': 'Models', '算力': 'Infrastructure', '研究': 'Research', '产品': 'Products', '资本': 'Business', '安全': 'Safety', '开源': 'Open source' } as Record<string, string>)[value] || value : value === '本地AI' ? '本土 AI' : value;
  useEffect(() => { document.documentElement.lang = bilingual ? 'en' : 'zh-CN'; document.title = bilingual ? 'There Goes AI Again | The latest moves. The useful bits.' : '又整啥了｜AI 今天，又整啥了？'; }, [bilingual]);
  const english = (value: string | undefined, fallback: string) => value && !/[\u3400-\u9fff]/u.test(value) ? value : fallback;
  const displayTitle = (item: NewsItem) => bilingual ? english(item.titleEn, 'AI development — read the source') : item.title;
  const sourceName = (name: string, url: string) => bilingual ? english(name, new URL(url).hostname.replace(/^www\./, '')) : name;
  const copy = (item: NewsItem, field: 'summary' | 'why' | 'change' | 'watch') => bilingual ? english(item[(field + 'En') as keyof NewsItem] as string | undefined, '') : item[field];
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState(news[0]?.id || 0);
  const [coverVisible, setCoverVisible] = useState(true);
  const pageRef = useRef<HTMLElement>(null);
  const coverRef = useRef<HTMLElement>(null);
  const [clock, setClock] = useState(() => Date.now());
  const searchRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLElement>(null);
  const openNews = () => terminalRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });

  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 60_000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let saved: number[] = [];
    try { const parsed = JSON.parse(localStorage.getItem('aihub-bookmarks') || '[]'); if (Array.isArray(parsed)) saved = parsed.filter(Number.isInteger); } catch {}
    const timer = window.setTimeout(() => setBookmarks(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); terminalRef.current?.scrollIntoView({ behavior: 'instant' }); window.setTimeout(() => searchRef.current?.focus(), 100); } };
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
  const leadSignals = rangeNews.slice().sort((a, b) => b.score - a.score).slice(0, 3);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = Math.max(0, Math.min(1, (window.scrollY - 24) / 200));
      pageRef.current?.style.setProperty('--header-progress', String(progress));
      setCoverVisible(progress < .65);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, []);

  const lensClues = useMemo(() => news.slice().sort((a, b) => b.score - a.score).slice(0, 4).map(item => ({ id: item.id, title: bilingual ? item.titleEn : item.title, label: item.tags.find(tag => !['AI','Agent','AI Coding'].includes(tag) && (!bilingual || !/[\u3400-\u9fff]/u.test(tag))) || new URL(item.url).hostname })), [bilingual]);

  const toggleBookmark = (id: number) => setBookmarks((items) => {
    const next = items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
    try { localStorage.setItem('aihub-bookmarks', JSON.stringify(next)); } catch {}
    return next;
  });

  return (
    <main ref={pageRef} className={`intelligence-terminal ${coverVisible ? 'cover-active' : 'reading-active'}`}>
      <div className="masthead-slot" aria-hidden="true" />
      <header className="intelligence-header">
        <a className="intelligence-brand" aria-label={t('又整啥了首页', 'There Goes AI Again home')} href="#top"><div><b className="noted-wordmark">{t('又整啥了', 'There Goes AI Again')}</b><small className="brand-signature">{t('AI 今天，又整啥了？', 'The latest moves. The useful bits.')}</small></div></a>
        <div className="masthead-translation" aria-hidden="true">THERE GOES<br />AI AGAIN</div>
        <nav className="cover-navigation" aria-label={t('新闻导航', 'News navigation')}><button onClick={() => { setCategory('全部'); setRange(168); openNews(); }}>{t('新闻','News')}</button><button onClick={() => { setCategory('AI Coding'); setRange(168); openNews(); }}>{t('工具','Tools')}</button><button onClick={() => { setCategory('开源'); setRange(168); openNews(); }}>{t('开源','Open source')}</button></nav>
        <label className="intelligence-search"><Search size={17} /><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t('搜索新闻', 'Search news')} placeholder={t('搜索公司、模型、事件或来源', 'Search companies, models or news')} /><kbd><Command size={11} /> K</kbd></label>
        <button className="language-switch" onClick={() => setBilingual(!bilingual)} aria-label="Switch interface language">{bilingual ? 'ZH' : 'EN'}</button><div className="intelligence-status"><i className={isStale ? 'stale' : ''} /><span>{isStale ? t('等待更新', 'Awaiting update') : t('已更新', 'Updated')}</span><b>{updatedAt}</b></div>
      </header>

      <section className="signal-hero noted-hero editorial-cover" id="top" ref={coverRef}>
        <NewsLens english={bilingual} clues={lensClues} onSelect={(id) => { setQuery(''); setCategory('全部'); setRange(168); setSelectedId(id); openNews(); }} />
        <div className="hero-heading"><span className="cover-kicker">{t('每日精选', 'THE DAILY READ')}</span><span className="cover-edition">THERE GOES AI AGAIN</span><h1>{bilingual ? <>There goes<br />AI again.</> : <>今天，<br />又整啥了？</>}</h1><p>{t('AI 新鲜事，每天都在整点新活。', 'The latest moves. The useful bits. None of the hype.')}</p></div>

        <aside className="focus-now"><header><span>{t('这几件值得看', 'WORTH YOUR TIME')}</span></header>{leadSignals.map((item) => <button aria-label={displayTitle(item)} key={item.id} onClick={() => { setQuery(''); setCategory('全部'); setSelectedId(item.id); openNews(); }}><span><b>{displayTitle(item)}</b><small>{categoryLabel(item.category)} · {publicationDate(item, false, bilingual)}</small></span><ExternalLink className="cover-story-arrow" size={17} aria-hidden="true" /></button>)}</aside>
        <button className="enter-terminal" onClick={() => openNews()}><span>{t('下滑，展开今日新闻', 'Scroll to explore today’s stories')}</span><ArrowDown size={16} /></button>
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
          <div className="news-list">{filtered.map((item) => <button aria-label={displayTitle(item)} key={item.id} className={selected?.id === item.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)}><span className="news-copy"><small>{categoryLabel(item.category)} · <time dateTime={item.publishedAt}>{publicationDate(item, false, bilingual)}</time></small><b>{displayTitle(item)}</b><em>{t('来源：','Source: ')}{sourceName(item.source, item.url)}</em></span></button>)}
          {!filtered.length && <div className="news-empty"><Search size={22} /><b>{t('这个范围内没有匹配新闻','No matching stories')}</b><p>{t('扩大时间范围或清除当前筛选。','Try a wider date range or clear the filters.')}</p><button onClick={() => { setQuery(''); setCategory('全部'); setRange(168); }}>{t('查看 7 天全部新闻','View all stories from the past 7 days')}</button></div>}</div>
        </section>

        {selected && <article className="research-detail">
          <header className="research-meta"><div><time dateTime={selected.publishedAt}>{t('','Published ')}{publicationDate(selected, true, bilingual)}{t('发布','')}</time><span>{bilingual ? selected.region === '中国' ? 'China' : 'Global' : selected.region}</span><span>{categoryLabel(selected.category)}</span></div><div><button aria-label={t('收藏','Bookmark')} onClick={() => toggleBookmark(selected.id)}>{bookmarks.includes(selected.id) ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}</button><a href={selected.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> {t('阅读原文', 'Read source')}</a></div></header>
          <div className="research-title"><h2>{displayTitle(selected)}</h2></div>
          {copy(selected, 'summary') ? <p className="research-summary">{copy(selected, 'summary')}</p> : <p className="research-summary">This archived story has an English headline, but its analysis has not been translated yet. You can read the original source above.</p>}
          {copy(selected, 'why') && <section className="editorial-take"><span>{t('实际意义', 'Why it matters')}</span><p>{copy(selected, 'why')}</p></section>}
          <div className="research-timeline">
            {copy(selected, 'change') && copy(selected, 'change') !== copy(selected, 'summary') && <details open><summary><span>{t('更新要点', 'What changed')}</span><ChevronDown size={16} /></summary><p>{copy(selected, 'change')}</p></details>}
            {copy(selected, 'watch') && <details><summary><span>{t('待验证的问题', 'What remains unverified')}</span><ChevronDown size={16} /></summary><p>{copy(selected, 'watch')}</p></details>}
            <details><summary><span>{t('来源与验证', 'Sources')}</span><ChevronDown size={16} /></summary><div className="source-links"><p><ShieldCheck size={15} />{bilingual ? ({'官方一手':'First-party source','多源核验':'Multiple sources','单一来源':'Single source'}[selected.verification || '单一来源']) : selected.verification || `${selected.sources.length} 个来源`}</p>{selected.sourceLinks.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{sourceName(source.name, source.url)}{source.tier === 1 ? t(' · 官方',' · Official') : ''}<ExternalLink size={12} /></a>)}</div></details>
          </div>
        </article>}
      </section>

      <footer className="intelligence-footer"><span><Globe2 size={14} /> {t('模型 · 产品 · 开发工具 · 基础设施', 'Models · Products · Developer tools · Infrastructure')}</span><span>{dashboard.sourceHealth.healthy}/{dashboard.sourceHealth.attempted} {t('来源可用','sources available')}</span><span><Languages size={14} /> {t('又整啥了 · 每日精选', 'There Goes AI Again · The latest moves. The useful bits.')}</span></footer>
    </main>
  );
}
