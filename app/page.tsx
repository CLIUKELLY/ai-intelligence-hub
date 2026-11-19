'use client';

import {
  Activity, Bell, Bookmark, BookmarkCheck, ChevronRight, Circle, Clock3, Code2,
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
  sources: string[]; time: string; hours: number; category: string; region: Region;
  impact: Impact; score: number; url: string; tags: string[];
  sourceLinks: { name: string; url: string; tier: number }[];
};

type DashboardData = {
  generatedAt: string;
  mode: string;
  stats: { rawSignals: number; events: number; chinaRatio: number; highImpact: number };
  sourceHealth: { attempted: number; healthy: number; officialHealthy: number; failed: string[] };
  brief: { title: string; bullets: string[]; confidence: number };
  trends: { name: string; value: number; label: string; bars: number[] }[];
  platformBoards: { name: string; source: string; items: { title: string; score: number }[] }[];
  items: NewsItem[];
};

const dashboard = dashboardJson as unknown as DashboardData;
const news = dashboard.items;
const updatedAt = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(dashboard.generatedAt));

const channels = [
  ['全部情报', Newspaper], ['中国AI', Sparkles], ['模型', Zap], ['AI Coding', Code2],
  ['算力', Cpu], ['研究', FlaskConical], ['产品', Globe2], ['资本', Landmark], ['安全', ShieldCheck], ['开源', Globe2],
] as const;

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部情报');
  const [region, setRegion] = useState<'全部' | Region>('全部');
  const [range, setRange] = useState(72);
  const [sort, setSort] = useState<'影响力' | '最新' | '来源数'>('影响力');
  const [bilingual, setBilingual] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return news.filter((item) => {
      const categoryMatch = category === '全部情报' || item.category === category;
      const regionMatch = region === '全部' || item.region === region;
      const rangeMatch = item.hours <= range;
      const queryMatch = !normalized || `${item.title} ${item.titleEn} ${item.summary} ${item.source} ${item.tags.join(' ')}`.toLowerCase().includes(normalized);
      return categoryMatch && regionMatch && rangeMatch && queryMatch;
    }).sort((a, b) => sort === '最新' ? a.hours - b.hours : sort === '来源数' ? b.sources.length - a.sources.length : b.score - a.score);
  }, [category, query, range, region, sort]);

  const categoryCount = (label: string) => label === '全部情报' ? news.length : news.filter((item) => item.category === label).length;
  const toggleBookmark = (id: number) => setBookmarks((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

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
        <div className="system-state"><span><i /> 数据已更新</span><span>北京时间 {updatedAt}</span><button aria-label="通知"><Bell size={16} /><em>{dashboard.stats.highImpact}</em></button><button className="mobile-toggle" aria-label="打开频道" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button></div>
      </header>

      <div className="news-ticker"><span><Radio size={13} /> 最新信号</span><div>{news.slice(0, 4).map((item, index) => <span key={item.id}>{index === 0 ? <b>{item.title}</b> : item.title}{index < Math.min(news.length, 4) - 1 && <i />}</span>)}</div></div>

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
            <div className="desk-metrics"><span><small>采集信号</small><b>{dashboard.stats.rawSignals}</b><em>真实抓取</em></span><span><small>聚合事件</small><b>{dashboard.stats.events}</b><em>去重后</em></span><span><small>中国相关</small><b>{dashboard.stats.chinaRatio}%</b><em>动态计算</em></span><span><small>高影响</small><b>{dashboard.stats.highImpact}</b><em className="warn">需关注</em></span></div>
          </div>

          <div className="signal-strip">
            {news.slice(0, 3).map((item, index) => <div className={`signal-card ${index === 0 ? 'hot' : ''}`} key={item.id}><span>{index === 0 && <Flame size={14} />}{index === 0 ? '今日焦点' : item.category}</span><b>{item.title}</b><small>{item.sources.length} 个来源 · 影响力 {item.score}</small></div>)}
          </div>

          <div className="control-bar">
            <div className="control-group"><span>时间</span>{[[24, '24小时'], [72, '3天'], [168, '7天']].map(([value, label]) => <button key={value} className={range === value ? 'active' : ''} onClick={() => setRange(Number(value))}>{label}</button>)}</div>
            <div className="control-group"><span>排序</span>{(['影响力', '最新', '来源数'] as const).map((item) => <button key={item} className={sort === item ? 'active' : ''} onClick={() => setSort(item)}>{item}</button>)}</div>
            <button className={`language-toggle ${bilingual ? 'active' : ''}`} onClick={() => setBilingual(!bilingual)}><Languages size={13} /> {bilingual ? '双语' : '仅中文'}</button>
            <button className="refresh-button" title="每日自动更新"><RefreshCw size={13} /> {updatedAt} 更新</button>
          </div>

          <div className="desk-grid">
            <section className="feed-panel">
              <div className="panel-head"><div><h2>聚合情报流</h2><span>{filtered.length} 个事件 · 相似报道已合并</span></div><span className="method-badge">去重 + 交叉信源</span></div>
              {filtered.length > 0 ? <div className="news-feed">{filtered.map((item, index) => <article className={`news-row ${index === 0 ? 'lead' : ''}`} key={item.id}>
                <div className="news-rank"><span>{String(index + 1).padStart(2, '0')}</span><b>{item.score}</b></div>
                <div className="news-body">
                  <div className="news-meta"><span className={`impact impact-${item.impact}`}>{item.impact}</span><span>{item.region}</span><span>{item.category}</span><span><Clock3 size={11} /> {item.time}</span></div>
                  <h3>{item.title}</h3>{bilingual && <h4>{item.titleEn}</h4>}
                  <p>{item.summary}</p>
                  <div className="why-line"><b>为什么重要</b><span>{item.why}</span></div>
                  <div className="source-line"><span>{item.sources.length} 个来源</span>{item.sourceLinks.slice(0, 4).map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.name}</a>)}{item.tags.slice(0, 2).map((tag) => <i key={tag}>#{tag}</i>)}</div>
                </div>
                <div className="news-actions"><button onClick={() => toggleBookmark(item.id)} aria-label={bookmarks.includes(item.id) ? '取消收藏' : '收藏'}>{bookmarks.includes(item.id) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}</button><a href={item.url} target="_blank" rel="noreferrer" aria-label={`打开来源：${item.title}`}><ExternalLink size={15} /></a></div>
              </article>)}</div> : <div className="empty-result"><Search size={22} /><b>没有匹配的情报</b><span>扩大时间范围、清空搜索或切换频道</span><button onClick={() => { setQuery(''); setCategory('全部情报'); setRegion('全部'); setRange(168); }}>重置筛选</button></div>}
            </section>

            <aside className="briefing-stack">
              <section className="briefing-card primary-brief"><div className="panel-head"><div><h2>今日三分钟</h2><span>{dashboard.mode}</span></div><span className="verified"><Circle size={7} fill="currentColor" /> {dashboard.sourceHealth.healthy} 源在线</span></div><h3>{dashboard.brief.title}</h3><ol>{dashboard.brief.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ol><div className="brief-footer"><span>约 3 分钟读完</span><span>置信度 {dashboard.brief.confidence}%</span></div></section>

              <section className="briefing-card"><div className="panel-head"><div><h2>趋势雷达</h2><span>按事件影响分动态计算</span></div><TrendingUp size={15} /></div><div className="trend-list">{dashboard.trends.map((item, index) => <div key={item.name}><span className="trend-rank">{index + 1}</span><p><b>{item.name}</b><small>{item.label}</small></p><span className="spark-bars">{item.bars.map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</span><em>{item.value}</em></div>)}</div></section>

              <section className="briefing-card china-watch"><div className="panel-head"><div><h2>中国 AI 观察</h2><span>需要单独跟踪的本土信号</span></div><Sparkles size={15} /></div><div className="watch-list"><div><span className="watch-dot red" /><p><b>国产基础模型</b><small>能力、开源节奏与 API 价格</small></p><ChevronRight size={14} /></div><div><span className="watch-dot blue" /><p><b>AI 应用出海</b><small>视频、Agent、陪伴与效率工具</small></p><ChevronRight size={14} /></div><div><span className="watch-dot amber" /><p><b>国产算力生态</b><small>芯片适配、推理框架与供应链</small></p><ChevronRight size={14} /></div></div></section>
            </aside>
          </div>

          <section className="platform-section">
            <div className="section-heading"><div><span>跨平台热榜</span><h2>同一时间，中文互联网还在关注什么</h2></div><small>聚合展示 · 不等同于本站判断</small></div>
            <div className="platform-grid">{dashboard.platformBoards.map((board) => <article key={board.name}><header><div><b>{board.name}</b><span>{board.source}</span></div><Flame size={15} /></header>{board.items.map((item, index) => <div className="board-item" key={item.title}><em>{index + 1}</em><span>{item.title}</span><small>{item.score}</small></div>)}</article>)}</div>
          </section>
        </section>
      </div>

      <footer className="status-footer"><span><i /> 自动数据快照可用</span><span>{dashboard.stats.events} 个聚合事件</span><span>{dashboard.sourceHealth.healthy}/{dashboard.sourceHealth.attempted} 个来源在线</span><span>{updatedAt}</span><span>AI Intelligence Hub</span></footer>
    </main>
  );
}
