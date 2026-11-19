import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'ai-intelligence-hub';
const assetPrefix = isGitHubPages ? `/${repositoryName}` : '';

const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix,
  images: { unoptimized: true },
};

export default nextConfig;
