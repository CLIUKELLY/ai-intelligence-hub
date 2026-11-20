'use client';

import {
  Activity, Bell, Bookmark, BookmarkCheck, Circle, Clock3, Code2,
  Command, Cpu, ExternalLink, Flame, FlaskConical, Globe2, Landmark, Languages,
  Menu, Newspaper, Radio, RefreshCw, Search, ShieldCheck, Sparkles, TrendingUp, X, Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import dashboardJson from '@/data/dashboard.json';

export const dynamic = 'force-static';

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: {
        name: string;
        title: string;
        description: string;
        inputSchema: object;
        annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
        execute: (input: unknown) => unknown;
      }, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}

type Impact = '突发' | '高影响' | '关注';
type Region = '中国' | '全球';
type NewsItem = {
  id: number; title: string; titleEn: string; summary: string; why: string; source: string;
  sources: string[]; publishedAt: string; category: string; region: Region;
  impact: Impact; score: number; rank: number; url: string; tags: string[];
  firstSeenAt?: string; publishedPrecision?: 'datetime' | 'date';
  change?: string; watch?: string; verification?: string;
  sourceLinks: { name: string; url: string; tier: number }[];
};

type DashboardData = {
  schemaVersion?: number;
  generatedAt: string;
  contentUpdatedAt?: string;
  status?: { state: 'fresh' | 'stale' | 'failed'; lastSuccessfulAt: string; note?: string };
  mode: string;
  stats: { rawSignals: number; events: number; chinaRatio: number; highImpact: number };
  sourceHealth: { attempted: number; healthy: number; officialHealthy: number; failed: string[] };
  brief: { title: string; bullets: string[] };
  items: NewsItem[];
};

const dashboard = dashboardJson as unknown as DashboardData;
const news = dashboard.items;
const dateFormatter = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
const dateOnlyFormatter = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit' });
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' });
const updatedAt = dateFormatter.format(new Date(dashboard.contentUpdatedAt || dashboard.generatedAt));

const companyMatchers = [
  ['OpenAI', ['openai', 'codex', 'chatgpt']], ['Anthropic', ['anthropic', 'claude']],
  ['Google', ['google', 'deepmind', 'gemini']], ['Microsoft', ['microsoft', '微软']],
  ['NVIDIA', ['nvidia', '英伟达']], ['Meta', ['meta', 'llama']], ['AWS', ['aws', 'amazon']],
  ['阿里 / Qwen', ['阿里', 'qwen', '通义']], ['DeepSeek', ['deepseek']],
  ['百度', ['百度', 'baidu', '文心']], ['腾讯', ['腾讯', 'tencent', '混元']],
  ['字节跳动', ['字节', 'bytedance', '豆包', '火山引擎']], ['智谱', ['智谱', 'zhipu', 'glm']],
] as const;

function itemAgeHours(item: NewsItem, clock: number) {
  const timestamp = new Date(item.firstSeenAt || dashboard.contentUpdatedAt || dashboard.generatedAt || item.publishedAt).getTime();
  return Number.isFinite(timestamp) ? Math.max(0, (clock - timestamp) / 3600000) : Number.POSITIVE_INFINITY;
}

function publishedAgeHours(item: NewsItem, clock: number) {
  const timestamp = new Date(item.publishedAt).getTime();
  return Number.isFinite(timestamp) ? Math.max(0, (clock - timestamp) / 3600000) : Number.POSITIVE_INFINITY;
}

function relativeTime(item: NewsItem, clock: number) {
  if (item.publishedPrecision === 'date') return dateOnlyFormatter.format(new Date(item.publishedAt));
  const hours = publishedAgeHours(item, clock);
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${Math.floor(hours)} 小时前`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days} 天前` : dateFormatter.format(new Date(item.publishedAt));
}

const channels = [
  ['全部情报', Newspaper], ['中国AI', Sparkles], ['模型', Zap], ['AI Coding', Code2],
  ['算力', Cpu], ['研究', FlaskConical], ['产品', Globe2], ['资本', Landmark], ['安全', ShieldCheck], ['开源', Globe2],
] as const;

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部情报');
  const [region, setRegion] = useState<'全部' | Region>('全部');
  const [range, setRange] = useState(24);
  const [sort, setSort] = useState<'影响力' | '最新' | '来源数'>('影响力');
  const [bilingual, setBilingual] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let saved: number[] = [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem('aihub-bookmarks') || '[]');
      if (Array.isArray(parsed)) saved = parsed.filter(Number.isInteger);
    } catch {}
    const timer = window.setTimeout(() => setBookmarks(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const rangeNews = useMemo(() => news.filter((item) => itemAgeHours(item, clock) <= range), [clock, range]);

  const computedStats = useMemo(() => {
    const highImpact = rangeNews.filter((item) => item.impact === '突发' || item.impact === '高影响').length;
    const china = rangeNews.filter((item) => item.region === '中国').length;
    return { events: rangeNews.length, highImpact, chinaRatio: rangeNews.length ? Math.round(china / rangeNews.length * 100) : 0 };
  }, [rangeNews]);

  const snapshotAge = Math.max(0, (clock - new Date(dashboard.contentUpdatedAt || dashboard.generatedAt).getTime()) / 3600000);
  const isStale = dashboard.status?.state === 'stale' || dashboard.status?.state === 'failed' || snapshotAge > 36;

  const topics = useMemo(() => {
    const scores = new Map<string, { count: number; score: number }>();
    for (const item of rangeNews) for (const tag of item.tags) {
      const current = scores.get(tag) || { count: 0, score: 0 };
      scores.set(tag, { count: current.count + 1, score: current.score + item.score });
    }
    return [...scores.entries()].sort((a, b) => b[1].score - a[1].score).slice(0, 5);
  }, [rangeNews]);

  const chinaItems = useMemo(() => rangeNews.filter((item) => item.region === '中国').slice(0, 3), [rangeNews]);
  const topFive = useMemo(() => [...rangeNews].sort((a, b) => a.rank - b.rank || b.score - a.score).slice(0, 5), [rangeNews]);
  const sevenDayNews = useMemo(() => news.filter((item) => itemAgeHours(item, clock) <= 168), [clock]);
  const sevenDayTrend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(clock - (6 - offset) * 86400000);
      return { key: dayKeyFormatter.format(date), label: dateOnlyFormatter.format(date), count: 0 };
    });
    const buckets = new Map(days.map((day) => [day.key, day]));
    for (const item of sevenDayNews) {
      const seenAt = new Date(item.firstSeenAt || dashboard.contentUpdatedAt || dashboard.generatedAt);
      const bucket = buckets.get(dayKeyFormatter.format(seenAt));
      if (bucket) bucket.count += 1;
    }
    return days;
  }, [clock, sevenDayNews]);
  const trendPeak = Math.max(1, ...sevenDayTrend.map((day) => day.count));
  const companySignals = useMemo(() => companyMatchers.map(([name, aliases]) => {
    const matches = (item: NewsItem) => {
      const haystack = `${item.title} ${item.titleEn} ${item.source} ${item.sources.join(' ')} ${item.tags.join(' ')}`.toLowerCase();
      return aliases.some((alias) => haystack.includes(alias));
    };
    const day = news.filter((item) => itemAgeHours(item, clock) <= 24 && matches(item)).length;
    const week = sevenDayNews.filter(matches).length;
    return { name, day, week };
  }).filter((item) => item.week > 0).sort((a, b) => b.week - a.week || b.day - a.day).slice(0, 7), [clock, sevenDayNews]);
  const coverage = useMemo(() => channels.slice(1).map(([label]) => ({ label, count: sevenDayNews.filter((item) => item.category === label).length })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count), [sevenDayNews]);
  const topicBoards = useMemo(() => [
    ['中国 AI', rangeNews.filter((item) => item.region === '中国').slice(0, 3)],
    ['模型与产品', rangeNews.filter((item) => ['模型', '产品'].includes(item.category)).slice(0, 3)],
    ['开发者与基础设施', rangeNews.filter((item) => ['AI Coding', '开源', '算力'].includes(item.category)).slice(0, 3)],
  ].filter(([, items]) => (items as NewsItem[]).length > 0) as [string, NewsItem[]][], [rangeNews]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rangeNews.filter((item) => {
      const categoryMatch = category === '全部情报' || item.category === category;
      const regionMatch = region === '全部' || item.region === region;
      const queryMatch = !normalized || `${item.title} ${item.titleEn} ${item.summary} ${item.source} ${item.tags.join(' ')}`.toLowerCase().includes(normalized);
      return categoryMatch && regionMatch && queryMatch;
    }).sort((a, b) => sort === '最新' ? publishedAgeHours(a, clock) - publishedAgeHours(b, clock) : sort === '来源数' ? b.sources.length - a.sources.length : b.score - a.score);
  }, [category, clock, query, rangeNews, region, sort]);

  const categoryCount = (label: string) => label === '全部情报' ? rangeNews.length : rangeNews.filter((item) => item.category === label).length;
  const toggleBookmark = (id: number) => setBookmarks((items) => {
    const next = items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
    try { window.localStorage.setItem('aihub-bookmarks', JSON.stringify(next)); } catch {}
    return next;
  });

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'search_market_pulse', title: '搜索 AI 市场情报', description: '搜索当前 AI 情报流，并同步更新页面结果。',
      inputSchema: { type: 'object', properties: { query: { type: 'string', minLength: 1 } }, required: ['query'], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        const value = typeof input === 'object' && input !== null && 'query' in input ? String(input.query).trim() : '';
        if (!value) throw new Error('query 不能为空');
        setQuery(value); setCategory('全部情报'); setRegion('全部'); setRange(168);
        const matches = news.filter((item) => `${item.title} ${item.titleEn} ${item.summary} ${item.tags.join(' ')}`.toLowerCase().includes(value.toLowerCase()));
        return { query: value, matchCount: matches.length, headlines: matches.map((item) => item.title) };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return (
    <main className="news-center">
      <header className="command-header">
        <a className="command-brand" href="#top"><span className="command-logo"><Activity size={17} /></span><span>AI 情报站</span><b>MARKET PULSE</b></a>
        <div className="global-search"><Search size={16} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索公司、模型、事件、标签或来源" aria-label="搜索市场情报" /><kbd><Command size={11} /> K</kbd></div>
        <div className={`system-state ${isStale ? 'stale' : ''}`}><span><i /> {isStale ? '数据待更新' : '研究已更新'}</span><span>内容时间 {updatedAt}</span><button aria-label="高影响事件"><Bell size={16} /><em>{computedStats.highImpact}</em></button><button className="mobile-toggle" aria-label="打开频道" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button></div>
      </header>

      <div className="news-ticker"><span><Radio size={13} /> 最新信号</span><div>{rangeNews.slice(0, 4).map((item, index) => <span key={item.id}>{index === 0 ? <b>{item.title}</b> : item.title}{index < Math.min(rangeNews.length, 4) - 1 && <i />}</span>)}</div></div>

      <div className="cockpit" id="top">
        <aside className={`channel-rail ${mobileOpen ? 'open' : ''}`}>
          <div className="rail-label">情报频道</div>
          <nav aria-label="情报频道">{channels.map(([label, Icon]) => <button className={category === label ? 'active' : ''} key={label} onClick={() => { setCategory(label); setMobileOpen(false); }}><Icon size={15} /><span>{label}</span><b>{categoryCount(label)}</b></button>)}</nav>
          <div className="rail-divider" />
          <div className="rail-label">阅读视角</div>
          <div className="region-switch">{(['全部', '中国', '全球'] as const).map((item) => <button key={item} className={region === item ? 'active' : ''} onClick={() => setRegion(item)}>{item}</button>)}</div>
          <div className="source-health"><span><i className="healthy" />成功数据源<b>{dashboard.sourceHealth.healthy}</b></span><span><i className="healthy" />一手官方源<b>{dashboard.sourceHealth.officialHealthy}</b></span><span><i className={dashboard.sourceHealth.failed.length ? 'warning' : 'healthy'} />异常数据源<b>{dashboard.sourceHealth.failed.length}</b></span></div>
          <div className="rail-footer"><span>数据模式</span><b>{dashboard.mode}</b><small>更新时间 · {updatedAt}</small></div>
        </aside>

        <section className="intel-workspace">
          <div className="workspace-topline">
            <div><span>AI MARKET PULSE / 中文版</span><h1>今天的 AI 市场，先看这几件事</h1></div>
            <div className="desk-metrics"><span><small>扫描线索</small><b>{dashboard.stats.rawSignals}</b><em>本轮研究</em></span><span><small>聚合事件</small><b>{computedStats.events}</b><em>去重后</em></span><span><small>中国相关</small><b>{computedStats.chinaRatio}%</b><em>按事件计算</em></span><span><small>高影响</small><b>{computedStats.highImpact}</b><em className="warn">需关注</em></span></div>
          </div>

          <section className="top-five-section">
            <div className="section-inline-head"><div><span>EDITOR&apos;S PICKS</span><h2>今日 Top 5</h2></div><small>按影响力、时效与信源质量综合排序</small></div>
            <div className="top-five-grid">{topFive.map((item, index) => <a className={`top-five-card ${index === 0 ? 'hot' : ''}`} href={item.url} target="_blank" rel="noreferrer" key={item.id}><em>{String(index + 1).padStart(2, '0')}</em><span><b>{item.title}</b><small>{item.category} · {item.sources.length} 源 · {item.score}</small></span></a>)}</div>
          </section>

          <div className="control-bar">
            <div className="control-group"><span>时间</span>{[[24, '24小时'], [72, '3天'], [168, '7天']].map(([value, label]) => <button key={value} className={range === value ? 'active' : ''} onClick={() => setRange(Number(value))}>{label}</button>)}</div>
            <div className="control-group"><span>排序</span>{(['影响力', '最新', '来源数'] as const).map((item) => <button key={item} className={sort === item ? 'active' : ''} onClick={() => setSort(item)}>{item}</button>)}</div>
            <button className={`language-toggle ${bilingual ? 'active' : ''}`} onClick={() => setBilingual(!bilingual)}><Languages size={13} /> {bilingual ? '双语' : '仅中文'}</button>
            <span className="refresh-button" title="每日自动更新"><RefreshCw size={13} /> {updatedAt} 更新</span>
          </div>

          <div className="desk-grid">
            <section className="feed-panel">
              <div className="panel-head"><div><h2>聚合情报流</h2><span>{filtered.length} 个事件 · 相似报道已合并</span></div><span className="method-badge">去重 + 交叉信源</span></div>
              {filtered.length > 0 ? <div className="news-feed">{filtered.map((item, index) => <article className={`news-row ${index === 0 ? 'lead' : ''}`} key={item.id}>
                <div className="news-rank"><span>{String(index + 1).padStart(2, '0')}</span><b>{item.score}</b></div>
                <div className="news-body">
                  <div className="news-meta"><span className={`impact impact-${item.impact}`}>{item.impact}</span><span>{item.region}</span><span>{item.category}</span><span><Clock3 size={11} /> {relativeTime(item, clock)}</span></div>
                  <h3>{item.title}</h3>{bilingual && <h4>{item.titleEn}</h4>}
                  <p>{item.summary}</p>
                  {(item.change || item.watch) && <div className="research-lines">{item.change && <span><b>发生了什么变化</b>{item.change}</span>}{item.watch && <span><b>下一步观察</b>{item.watch}</span>}</div>}
                  <div className="why-line"><b>为什么重要</b><span>{item.why}</span></div>
                  <div className="source-line"><span>{item.verification || `${item.sources.length} 个来源`}</span>{item.sourceLinks.slice(0, 4).map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.name}{source.tier === 1 ? ' · 官方' : ''}</a>)}{item.tags.slice(0, 2).map((tag) => <i key={tag}>#{tag}</i>)}</div>
                </div>
                <div className="news-actions"><button onClick={() => toggleBookmark(item.id)} aria-label={bookmarks.includes(item.id) ? '取消收藏' : '收藏'}>{bookmarks.includes(item.id) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}</button><a href={item.url} target="_blank" rel="noreferrer" aria-label={`打开来源：${item.title}`}><ExternalLink size={15} /></a></div>
              </article>)}</div> : <div className="empty-result"><Search size={22} /><b>没有匹配的情报</b><span>扩大时间范围、清空搜索或切换频道</span><button onClick={() => { setQuery(''); setCategory('全部情报'); setRegion('全部'); setRange(168); }}>重置筛选</button></div>}
            </section>

            <aside className="briefing-stack">
              <section className="briefing-card primary-brief"><div className="panel-head"><div><h2>今日三分钟</h2><span>{dashboard.mode}</span></div><span className="verified"><Circle size={7} fill="currentColor" /> {dashboard.sourceHealth.healthy} 源有效</span></div><h3>{dashboard.brief.title}</h3><ol>{dashboard.brief.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ol><div className="brief-footer"><span>约 3 分钟读完</span><span>{rangeNews.filter((item) => item.sourceLinks.length > 1).length} 条多源核验</span></div></section>

              <section className="briefing-card"><div className="panel-head"><div><h2>关注主题</h2><span>按真实事件标签汇总</span></div><TrendingUp size={15} /></div><div className="trend-list">{topics.map(([name, value], index) => <div key={name}><span className="trend-rank">{index + 1}</span><p><b>{name}</b><small>{value.count} 个事件</small></p><em>{value.score}</em></div>)}</div></section>

              <section className="briefing-card china-watch"><div className="panel-head"><div><h2>中国 AI 观察</h2><span>本轮实际收录的本土信号</span></div><Sparkles size={15} /></div>{chinaItems.length ? <div className="watch-list">{chinaItems.map((item, index) => <a href={item.url} target="_blank" rel="noreferrer" key={item.id}><span className={`watch-dot ${index === 0 ? 'red' : index === 1 ? 'blue' : 'amber'}`} /><p><b>{item.title}</b><small>{item.source} · {relativeTime(item, clock)}</small></p><ExternalLink size={14} /></a>)}</div> : <div className="watch-empty">本轮没有通过核验的中国 AI 事件，不用占位内容补齐。</div>}</section>
            </aside>
          </div>

          <section className="market-depth-section">
            <div className="section-heading"><div><span>MARKET DEPTH</span><h2>7天市场结构</h2></div><small>全部指标由滚动事件数据实时计算</small></div>
            <div className="market-depth-grid">
              <article className="company-matrix"><header><div><b>重点公司矩阵</b><span>24小时 / 7天事件数</span></div><Landmark size={15} /></header><div className="matrix-head"><span>公司</span><span>24H</span><span>7D</span><span>动量</span></div>{companySignals.length ? companySignals.map((company) => <div className="matrix-row" key={company.name}><b>{company.name}</b><span>{company.day}</span><span>{company.week}</span><em className={company.day > 0 ? 'rising' : ''}>{company.day > 0 ? '活跃' : '平稳'}</em></div>) : <p className="depth-empty">7天内暂无可归属的公司事件</p>}</article>
              <article className="seven-day-chart"><header><div><b>事件密度</b><span>按首次收录时间计算</span></div><TrendingUp size={15} /></header><div className="bar-chart">{sevenDayTrend.map((day) => <div key={day.key}><span><i style={{ height: `${Math.max(5, day.count / trendPeak * 100)}%` }} /></span><b>{day.count}</b><small>{day.label}</small></div>)}</div></article>
              <article className="coverage-card"><header><div><b>情报篮子</b><span>近7天真实分类覆盖</span></div><Globe2 size={15} /></header><div className="coverage-list">{coverage.map((item) => <div key={item.label}><span>{item.label}</span><i><b style={{ width: `${item.count / Math.max(1, sevenDayNews.length) * 100}%` }} /></i><em>{item.count}</em></div>)}</div></article>
            </div>
          </section>

          <section className="platform-section">
            <div className="section-heading"><div><span>事件覆盖</span><h2>本轮研究覆盖的重点议题</h2></div><small>仅基于已核验事件，不模拟平台热度</small></div>
            <div className="platform-grid">{topicBoards.map(([name, items]) => <article key={name}><header><div><b>{name}</b><span>按事件影响力排序</span></div><Flame size={15} /></header>{items.map((item, index) => <a className="board-item" href={item.url} target="_blank" rel="noreferrer" key={item.id}><em>{index + 1}</em><span>{item.title}</span><small>{item.score}</small></a>)}</article>)}</div>
          </section>
        </section>
      </div>

      <footer className={`status-footer ${isStale ? 'stale' : ''}`}><span><i /> {isStale ? '展示最近成功快照' : '每日研究快照可用'}</span><span>{computedStats.events} 个聚合事件</span><span>{dashboard.sourceHealth.healthy}/{dashboard.sourceHealth.attempted} 个来源有效</span><span>内容更新 {updatedAt}</span><span>AI Intelligence Hub</span></footer>
    </main>
  );
}
