import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';

const repository = process.env.GITHUB_REPOSITORY || 'CLIUKELLY/ai-intelligence-hub';
const filePath = 'data/dashboard.json';
const content = fs.readFileSync(filePath, 'utf8');

execFileSync(process.execPath, ['scripts/prepare-dashboard.mjs', filePath], { stdio: 'inherit' });

const api = (endpoint, method = 'GET', body) => {
  const args = ['api', `repos/${repository}/${endpoint}`];
  if (method !== 'GET') args.push('--method', method);
  if (body) args.push('--input', '-');
  return JSON.parse(execFileSync('gh', args, {
    input: body ? JSON.stringify(body) : undefined,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  }));
};

const remoteFile = api(`contents/${filePath}?ref=main`);
const localBlobSha = createHash('sha1').update(`blob ${Buffer.byteLength(content)}\0${content}`).digest('hex');
if (remoteFile.sha === localBlobSha) {
  console.log('GitHub 已是最新数据，无需提交。');
  process.exit(0);
}

const ref = api('git/ref/heads/main');
const headSha = ref.object.sha;
const baseCommit = api(`git/commits/${headSha}`);
const blob = api('git/blobs', 'POST', { content, encoding: 'utf-8' });
const tree = api('git/trees', 'POST', {
  base_tree: baseCommit.tree.sha,
  tree: [{ path: filePath, mode: '100644', type: 'blob', sha: blob.sha }],
});
const commit = api('git/commits', 'POST', {
  message: 'data: publish daily AI research',
  tree: tree.sha,
  parents: [headSha],
});
api('git/refs/heads/main', 'PATCH', { sha: commit.sha, force: false });
console.log(`已发布数据提交 ${commit.sha.slice(0, 7)}。`);
