import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const inputPath = path.resolve(root, process.argv[2] || 'data/dashboard.json');
const outputPath = process.argv[3] ? path.resolve(root, process.argv[3]) : null;
const input = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const runAt = new Date().toISOString();
const firstSeenFallback = input.contentUpdatedAt || input.generatedAt || runAt;
const warnings = [];

const fail = (message) => { throw new Error(`dashboard.json 校验失败：${message}`); };
const requiredString = (value, label, min = 1) => {
  if (typeof value !== 'string' || value.trim().length < min) fail(`${label} 缺失或过短`);
  return value.trim();
};
const validDate = (value, label) => {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) fail(`${label} 不是有效 ISO 时间`);
  if (timestamp > Date.now() + 2 * 3600000) fail(`${label} 晚于当前时间超过 2 小时`);
  return new Date(timestamp).toISOString();
};
const validUrl = (value, label) => {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch { fail(`${label} 不是有效 HTTP(S) URL`); }
};
const stableId = (value) => {
  let hash = 2166136261;
  for (const char of value) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return Math.abs(hash >>> 0);
};

if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 80) {
  fail('items 必须包含 1–80 个事件');
}

const seenUrls = new Set();
const categories = new Set(['中国AI', '模型', 'AI Coding', '算力', '研究', '产品', '资本', '安全', '开源']);
const impacts = new Set(['突发', '高影响', '关注']);
const regions = new Set(['中国', '全球']);

const items = input.items.map((item, index) => {
  if (!outputPath && !Number.isInteger(item.id)) fail(`items[${index}].id 缺失或无效`);
  if (!outputPath && (!Array.isArray(item.sources) || item.sources.length < 1)) fail(`items[${index}].sources 缺失`);
  if (!outputPath && typeof item.url !== 'string') fail(`items[${index}].url 缺失`);
  if (!outputPath && !Number.isInteger(item.rank)) fail(`items[${index}].rank 缺失或无效`);
  const title = requiredString(item.title, `items[${index}].title`, 4);
  const titleEn = requiredString(item.titleEn || title, `items[${index}].titleEn`, 4);
  const summary = requiredString(item.summary, `items[${index}].summary`, 20);
  const why = requiredString(item.why, `items[${index}].why`, 15);
  const publishedAt = validDate(item.publishedAt, `items[${index}].publishedAt`);
  const firstSeenAt = validDate(item.firstSeenAt || firstSeenFallback, `items[${index}].firstSeenAt`);
  const publishedPrecision = ['datetime', 'date'].includes(item.publishedPrecision)
    ? item.publishedPrecision
    : /T00:00:00(?:\.000)?Z$/.test(publishedAt) ? 'date' : 'datetime';
  if (!categories.has(item.category)) fail(`items[${index}].category 不在允许范围`);
  if (!regions.has(item.region)) fail(`items[${index}].region 不在允许范围`);
  if (!impacts.has(item.impact)) fail(`items[${index}].impact 不在允许范围`);
  if (!Array.isArray(item.sourceLinks) || item.sourceLinks.length < 1) fail(`items[${index}] 缺少来源链接`);

  const sourceLinks = item.sourceLinks.slice(0, 5).map((source, sourceIndex) => ({
    name: requiredString(source.name, `items[${index}].sourceLinks[${sourceIndex}].name`),
    url: validUrl(source.url, `items[${index}].sourceLinks[${sourceIndex}].url`),
    tier: [1, 2, 3].includes(Number(source.tier)) ? Number(source.tier) : 1,
  }));
  const primaryUrl = validUrl(item.url || sourceLinks[0].url, `items[${index}].url`);
  if (seenUrls.has(primaryUrl)) fail(`重复事件 URL：${primaryUrl}`);
  seenUrls.add(primaryUrl);

  if (/打开原文|暂无|placeholder|待补充/i.test(summary)) warnings.push(`${title} 的摘要仍像占位内容`);
  if (sourceLinks.length === 1 && ['突发', '高影响'].includes(item.impact)) warnings.push(`${title} 是高影响事件，但只有一个来源`);

  return {
    id: Number.isInteger(item.id) ? item.id : stableId(primaryUrl),
    title,
    titleEn,
    summary,
    why,
    source: requiredString(item.source || sourceLinks[0].name, `items[${index}].source`),
    sources: [...new Set(sourceLinks.map((source) => source.name))],
    sourceLinks,
    publishedAt,
    publishedPrecision,
    firstSeenAt,
    category: item.category,
    region: item.region,
    impact: item.impact,
    score: Math.max(0, Math.min(99, Math.round(Number(item.score) || 0))),
    url: primaryUrl,
    tags: [...new Set((Array.isArray(item.tags) ? item.tags : []).map(String).filter(Boolean))].slice(0, 4),
    rank: index + 1,
  };
});

const bullets = Array.isArray(input.brief?.bullets) ? input.brief.bullets.map(String).filter((item) => item.trim().length >= 12).slice(0, 5) : [];
if (bullets.length < 3) fail('brief.bullets 至少需要 3 条有效内容');

const sourceHealth = {
  attempted: Math.max(0, Math.round(Number(input.sourceHealth?.attempted) || 0)),
  healthy: Math.max(0, Math.round(Number(input.sourceHealth?.healthy) || 0)),
  officialHealthy: Math.max(0, Math.round(Number(input.sourceHealth?.officialHealthy) || 0)),
  failed: Array.isArray(input.sourceHealth?.failed) ? input.sourceHealth.failed.map(String).slice(0, 20) : [],
};
if (sourceHealth.healthy > sourceHealth.attempted) fail('sourceHealth.healthy 不能大于 attempted');

const now = runAt;
const chinaCount = items.filter((item) => item.region === '中国').length;
const normalized = {
  schemaVersion: 2,
  generatedAt: outputPath ? now : validDate(input.generatedAt, 'generatedAt'),
  contentUpdatedAt: outputPath ? now : validDate(input.contentUpdatedAt || input.generatedAt, 'contentUpdatedAt'),
  status: outputPath
    ? { state: 'fresh', lastSuccessfulAt: now }
    : {
        state: ['fresh', 'stale', 'failed'].includes(input.status?.state) ? input.status.state : 'fresh',
        lastSuccessfulAt: validDate(input.status?.lastSuccessfulAt || input.contentUpdatedAt || input.generatedAt, 'status.lastSuccessfulAt'),
        ...(input.status?.note ? { note: String(input.status.note).slice(0, 240) } : {}),
      },
  mode: requiredString(input.mode, 'mode'),
  stats: {
    rawSignals: Math.max(items.length, Math.round(Number(input.stats?.rawSignals) || items.length)),
    events: items.length,
    chinaRatio: Math.round(chinaCount / items.length * 100),
    highImpact: items.filter((item) => item.impact === '突发' || item.impact === '高影响').length,
  },
  sourceHealth,
  brief: { title: requiredString(input.brief?.title, 'brief.title', 6), bullets },
  items,
};

if (!outputPath) {
  if (Number(input.stats?.events) !== normalized.stats.events) fail('stats.events 必须等于 items.length');
  if (Number(input.stats?.chinaRatio) !== normalized.stats.chinaRatio) fail('stats.chinaRatio 与 items 不一致');
  if (Number(input.stats?.highImpact) !== normalized.stats.highImpact) fail('stats.highImpact 与 items 不一致');
}

if (outputPath) {
  let previous = null;
  try { previous = JSON.parse(await fs.readFile(outputPath, 'utf8')); } catch {}
  const signature = (value) => JSON.stringify({ mode: value?.mode, sourceHealth: value?.sourceHealth, brief: value?.brief, items: value?.items });
  if (previous && signature(previous) === signature(normalized)) {
    console.log('研究内容没有变化，保留现有成功快照。');
  } else {
    await fs.writeFile(outputPath, `${JSON.stringify(normalized, null, 2)}\n`);
    console.log(`已生成 ${items.length} 个事件的 dashboard.json。`);
  }
  if (inputPath !== outputPath) await fs.unlink(inputPath).catch(() => undefined);
}

for (const warning of warnings) console.warn(`警告：${warning}`);
console.log(`数据校验通过：${items.length} 个事件，${sourceHealth.healthy}/${sourceHealth.attempted} 个来源有效。`);
