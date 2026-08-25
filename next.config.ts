import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    useTypeScriptCli: false,
  },
  reactStrictMode: true,
};

export default nextConfig;
