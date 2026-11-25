import { existsSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const repositoryName =
  process.env.GITHUB_REPOSITORY?.split('/')[1] || 'there-goes-ai-again';
const outputRoot = join(process.cwd(), 'dist', 'client');
const nestedRoot = join(outputRoot, repositoryName);
const nestedNext = join(nestedRoot, '_next');
const rootNext = join(outputRoot, '_next');

if (!existsSync(nestedNext)) {
  throw new Error(`Expected Pages assets at ${nestedNext}`);
}

if (existsSync(rootNext)) {
  rmSync(rootNext, { recursive: true, force: true });
}

renameSync(nestedNext, rootNext);
rmSync(nestedRoot, { recursive: true, force: true });

console.log(`Prepared GitHub Pages assets in ${rootNext}`);
