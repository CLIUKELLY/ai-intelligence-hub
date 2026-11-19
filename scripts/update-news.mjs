import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sources = JSON.parse(await fs.readFile(path.join(root, 'config/sources.json'), 'utf8'));
const outputPath = path.join(root, process.env.DASHBOARD_OUTPUT || 'data/dashboard.json');
const previous = await readJson(outputPath, null);
const now = new Date();
const cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
const aiKeywords = /\b(ai|artificial intelligence|model|agent|llm|gpt|claude|gemini|deepseek|qwen|machine learning|inference|multimodal|robot|copilot|open source|benchmark|nvidia)\b|人工智能|大模型|智能体|推理|多模态|开源模型|算力|机器人/i;

const health = [];
const raw = [];
await Promise.all(sources.map(async (source) => {
  try {
    const response = await fetch(source.url, { headers: { 'user-agent': 'AI-Market-Pulse/1.0 (+https://github.com/CLIUKELLY/ai-intelligence-hub)' }, signal: AbortSignal.timeout(20000), redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const entries = parseFeed(text, source).filter((item) => item.publishedAt >= cutoff && aiKeywords.test(`${item.title} ${item.summary}`));
    raw.push(...entries);
    health.push({ name: source.name, ok: true, count: entries.length, tier: source.tier });
  } catch (error) {
    health.push({ name: source.name, ok: false, count: 0, tier: source.tier, error: String(error).slice(0, 120) });
  }
}));

const clusters = clusterItems(raw);
let items = clusters.slice(0, 24).map((cluster, index) => finalizeCluster(cluster, index));
let brief = buildBrief(items);
let mode = '公开源自动聚合';

if (process.env.OPENAI_API_KEY) {
  try {
    const enriched = await researchWithOpenAI(items);
    if (enriched.items?.length) {
      items = enriched.items.map((item, index) => normalizeModelItem(item, index));
      brief = enriched.brief;
      mode = '公开源 + OpenAI 每日研究';
    }
  } catch (error) {
    console.warn(`OpenAI enrichment skipped: ${String(error)}`);
  }
}

if (!items.length && previous?.items?.length) {
  items = previous.items;
  brief = previous.brief;
  mode = '沿用最近成功快照';
}

const stats = calculateStats(raw, items);
const dashboard = {
  generatedAt: now.toISOString(),
  mode,
  stats,
  sourceHealth: {
    attempted: health.length,
    healthy: health.filter((item) => item.ok).length,
    officialHealthy: health.filter((item) => item.ok && item.tier === 3).length,
    failed: health.filter((item) => !item.ok).map((item) => item.name),
  },
  brief,
  trends: calculateTrends(items),
  platformBoards: calculateBoards(items),
  items,
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(dashboard, null, 2)}\n`);
console.log(`Updated ${items.length} events from ${health.filter((item) => item.ok).length}/${health.length} sources (${mode}).`);

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; }
}

function parseFeed(xml, source) {
  const blocks = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)].map((match) => match[2]);
  return blocks.map((block) => {
    const title = clean(firstTag(block, ['title']));
    const link = extractLink(block);
    const summary = clean(firstTag(block, ['description', 'summary', 'content', 'content:encoded'])).slice(0, 420);
    const dateValue = firstTag(block, ['pubDate', 'published', 'updated', 'dc:date']);
    const publishedAt = Date.parse(clean(dateValue)) || now.getTime();
    return { title, summary, url: link, publishedAt, source };
  }).filter((item) => item.title && item.url);
}

function firstTag(block, tags) {
  for (const tag of tags) {
    const escaped = tag.replace(':', '\\:');
    const match = block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'i'));
    if (match) return match[1];
  }
  return '';
}

function extractLink(block) {
  const href = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];
  return clean(href || firstTag(block, ['link', 'guid']));
}

function clean(value = '') {
  return decodeEntities(value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function decodeEntities(value) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function normalizeTitle(title) {
  return title.toLowerCase().replace(/https?:\/\/\S+/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(title) {
  const normalized = normalizeTitle(title);
  const latin = normalized.split(' ').filter((token) => token.length > 2);
  const chinese = [...normalized.matchAll(/[\u3400-\u9fff]{2,}/g)].flatMap((match) => {
    const word = match[0]; const grams = [];
    for (let i = 0; i < word.length - 1; i += 1) grams.push(word.slice(i, i + 2));
    return grams;
  });
  return new Set([...latin, ...chinese]);
}

function similarity(a, b) {
  const left = tokens(a); const right = tokens(b);
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / (left.size + right.size - intersection);
}

function clusterItems(items) {
  const sorted = [...items].sort((a, b) => b.publishedAt - a.publishedAt);
  const result = [];
  for (const item of sorted) {
    const canonical = canonicalUrl(item.url);
    const found = result.find((cluster) => cluster.some((candidate) => canonicalUrl(candidate.url) === canonical || similarity(candidate.title, item.title) >= 0.46));
    if (found) found.push(item); else result.push([item]);
  }
  return result.sort((a, b) => scoreCluster(b) - scoreCluster(a));
}

function canonicalUrl(value) {
  try { const url = new URL(value); return `${url.hostname}${url.pathname}`.replace(/\/$/, ''); } catch { return value; }
}

function scoreCluster(cluster) {
  const lead = cluster[0];
  const hours = Math.max(0, (now.getTime() - lead.publishedAt) / 3600000);
  const freshness = Math.max(0, 20 - hours / 8);
  const tier = Math.max(...cluster.map((item) => item.source.tier));
  const keywordBoost = /launch|release|introduc|announce|发布|推出|开源|security|安全/i.test(lead.title) ? 8 : 0;
  return Math.min(99, Math.round(18 + tier * 10 + freshness + Math.min(cluster.length * 6, 18) + keywordBoost));
}

function finalizeCluster(cluster, index) {
  const lead = [...cluster].sort((a, b) => b.source.tier - a.source.tier || b.publishedAt - a.publishedAt)[0];
  const score = scoreCluster(cluster);
  const category = classify(`${lead.title} ${lead.summary}`, lead.source.category);
  const sourceLinks = uniqueBy(cluster.map((item) => ({ name: item.source.name, url: item.url, tier: item.source.tier })), (item) => item.name);
  const hours = Math.max(0, Math.round((now.getTime() - lead.publishedAt) / 3600000));
  return {
    id: stableId(lead.url || lead.title),
    title: lead.title,
    titleEn: lead.title,
    summary: lead.summary || `来自 ${lead.source.name} 的最新动态，打开原文查看完整信息。`,
    why: whyItMatters(category),
    source: lead.source.name,
    sources: sourceLinks.map((item) => item.name),
    sourceLinks,
    publishedAt: new Date(lead.publishedAt).toISOString(),
    time: relativeTime(hours),
    hours,
    category,
    region: cluster.some((item) => item.source.region === '中国') ? '中国' : '全球',
    impact: score >= 92 ? '突发' : score >= 78 ? '高影响' : '关注',
    score,
    url: lead.url,
    tags: inferTags(`${lead.title} ${lead.summary}`),
    rank: index + 1,
  };
}

function classify(text, fallback) {
  if (/security|safety|漏洞|安全|risk/i.test(text)) return '安全';
  if (/fund|invest|revenue|market|ipo|融资|估值|资本/i.test(text)) return '资本';
  if (/chip|gpu|inference|data.?center|芯片|算力|推理成本/i.test(text)) return '算力';
  if (/research|paper|benchmark|science|研究|评测/i.test(text)) return '研究';
  if (/code|developer|sdk|api|github|编程|开发者/i.test(text)) return 'AI Coding';
  if (/model|gpt|claude|gemini|deepseek|qwen|大模型/i.test(text)) return '模型';
  return fallback || '产品';
}

function whyItMatters(category) {
  return ({
    模型: '模型能力、成本和可用性变化会直接影响企业选型与产品边界。',
    中国AI: '它反映中国模型生态在中文能力、开源和本地部署上的竞争位置。',
    'AI Coding': '开发工具正从辅助补全走向可交付完整任务的 Agent 工作流。',
    算力: '推理成本和基础设施供给决定 AI 产品能否规模化进入生产环境。',
    研究: '研究进展可能改变下一代模型能力、评测方法和落地速度。',
    资本: '资本与收入信号会影响行业估值、算力投入和竞争节奏。',
    安全: '安全能力与治理要求正在成为模型进入企业和监管场景的门槛。',
    产品: '产品变化反映 AI 能力是否真正进入用户日常工作流。',
    开源: '开源进展降低采用门槛，并可能改变开发者生态的技术选择。',
  })[category] || '这条动态可能影响 AI 产品、技术路线或市场竞争。';
}

function inferTags(text) {
  const catalog = ['OpenAI', 'GPT', 'Claude', 'Gemini', 'DeepSeek', 'Qwen', 'Agent', 'Coding', '开源', '多模态', '推理', '安全', 'GPU'];
  return catalog.filter((tag) => new RegExp(tag, 'i').test(text)).slice(0, 3).concat(classify(text, 'AI')).slice(0, 3);
}

function stableId(value) {
  let hash = 2166136261;
  for (const char of value) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return Math.abs(hash >>> 0);
}

function relativeTime(hours) {
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function uniqueBy(items, key) {
  const seen = new Set();
  return items.filter((item) => { const value = key(item); if (seen.has(value)) return false; seen.add(value); return true; });
}

function calculateStats(rawItems, finalItems) {
  const highImpact = finalItems.filter((item) => item.impact === '突发' || item.impact === '高影响').length;
  const china = finalItems.filter((item) => item.region === '中国').length;
  return { rawSignals: rawItems.length, events: finalItems.length, chinaRatio: finalItems.length ? Math.round(china / finalItems.length * 100) : 0, highImpact };
}

function calculateTrends(items) {
  const counts = new Map();
  for (const item of items) for (const tag of item.tags || []) counts.set(tag, (counts.get(tag) || 0) + item.score);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, value], index) => ({ name, value: value, label: index === 0 ? '领涨' : '升温', bars: [28, 35, 31, 46, 52, 61, Math.min(96, 55 + value % 40)] }));
}

function calculateBoards(items) {
  const groups = [['中国 AI', (item) => item.region === '中国'], ['模型与产品', (item) => ['模型', '产品'].includes(item.category)], ['开发者与开源', (item) => ['AI Coding', '开源'].includes(item.category)]];
  return groups.map(([name, predicate]) => ({ name, source: '按真实事件热度计算', items: items.filter(predicate).slice(0, 3).map((item) => ({ title: item.title, score: item.score })) }));
}

function buildBrief(items) {
  const top = items.slice(0, 3);
  return { title: top.length ? `今天优先关注：${top.map((item) => item.category).join('、')}` : '今日暂未发现高影响事件', bullets: top.map((item) => `${item.title}：${item.why}`), confidence: items.length >= 8 ? 82 : 65 };
}

async function researchWithOpenAI(seedItems) {
  const model = process.env.OPENAI_MODEL || 'gpt-6.2-sol';
  const prompt = `你是面向中国 AI 从业者的严谨新闻编辑。研究过去 24 小时最重要的全球与中国 AI 新闻。优先使用公司官方公告、研究机构、GitHub 发布和可靠媒体；不要编造；同一事件合并；每条必须提供实际查阅过的来源 URL。参考自动采集线索：\n${seedItems.slice(0, 15).map((item) => `- ${item.title} (${item.url})`).join('\n')}\n输出简体中文。impact 只能是“突发”“高影响”“关注”；region 只能是“中国”“全球”；category 只能是“中国AI”“模型”“AI Coding”“算力”“研究”“产品”“资本”“安全”“开源”。`;
  const schema = {
    type: 'object', additionalProperties: false, required: ['brief', 'items'],
    properties: {
      brief: { type: 'object', additionalProperties: false, required: ['title', 'bullets', 'confidence'], properties: { title: { type: 'string' }, bullets: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 }, confidence: { type: 'number' } } },
      items: { type: 'array', minItems: 8, maxItems: 16, items: { type: 'object', additionalProperties: false, required: ['title', 'titleEn', 'summary', 'why', 'source', 'sourceLinks', 'publishedAt', 'category', 'region', 'impact', 'score', 'tags'], properties: {
        title: { type: 'string' }, titleEn: { type: 'string' }, summary: { type: 'string' }, why: { type: 'string' }, source: { type: 'string' },
        sourceLinks: { type: 'array', minItems: 1, maxItems: 5, items: { type: 'object', additionalProperties: false, required: ['name', 'url', 'tier'], properties: { name: { type: 'string' }, url: { type: 'string' }, tier: { type: 'number' } } } },
        publishedAt: { type: 'string' }, category: { type: 'string', enum: ['中国AI', '模型', 'AI Coding', '算力', '研究', '产品', '资本', '安全', '开源'] }, region: { type: 'string', enum: ['中国', '全球'] }, impact: { type: 'string', enum: ['突发', '高影响', '关注'] }, score: { type: 'number' }, tags: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 },
      } } },
    },
  };
  const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ model, tools: [{ type: 'web_search', external_web_access: true, search_context_size: 'low' }], tool_choice: 'required', input: prompt, text: { format: { type: 'json_schema', name: 'daily_ai_market_pulse', strict: true, schema } }, max_output_tokens: 8000 }) });
  if (!response.ok) throw new Error(`Responses API ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const payload = await response.json();
  const text = payload.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text;
  if (!text) throw new Error('Responses API returned no structured text');
  return JSON.parse(text);
}

function normalizeModelItem(item, index) {
  const published = Date.parse(item.publishedAt) || now.getTime();
  const hours = Math.max(0, Math.round((now.getTime() - published) / 3600000));
  const sourceLinks = uniqueBy(item.sourceLinks.filter((source) => /^https?:\/\//.test(source.url)), (source) => source.url);
  return { ...item, id: stableId(sourceLinks[0]?.url || item.title), sources: sourceLinks.map((source) => source.name), sourceLinks, publishedAt: new Date(published).toISOString(), time: relativeTime(hours), hours, url: sourceLinks[0]?.url || '#', score: Math.max(0, Math.min(99, Math.round(item.score))), rank: index + 1 };
}
