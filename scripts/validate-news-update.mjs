import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

// Compare with the parent snapshot: unchanged archives may migrate gradually,
// but new or substantively changed stories must have complete English coverage.
const current = JSON.parse(fs.readFileSync('data/dashboard.json', 'utf8'));
const previous = JSON.parse(execFileSync('git', ['show', 'HEAD^:data/dashboard.json'], {encoding:'utf8'}));
const before = new Map(previous.items.map(item => [item.id,item]));
const fields = ['title','titleEn','summary','why','change','watch','publishedAt','url','sourceLinks'];
const englishFields = ['titleEn','summaryEn','whyEn','changeEn','watchEn'];
const updated = current.items.filter(item => {
  const old = before.get(item.id);
  return !old || fields.some(field => JSON.stringify(old[field]) !== JSON.stringify(item[field]));
});
for (const item of updated) {
  for (const field of englishFields) {
    if (typeof item[field] !== 'string' || item[field].trim().length < 12 || /[\u3400-\u9fff]/u.test(item[field])) {
      throw new Error(`新增或更新事件 ${item.id} 缺少有效英文 ${field}；请补齐双语后重新提交。`);
    }
  }
}
console.log(`双语更新校验通过：${updated.length} 个新增或实质更新事件。未改动的历史记录允许逐步补译。`);
