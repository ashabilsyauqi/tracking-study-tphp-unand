import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url).replace(/IT-ONLY!/gi, 'IT-ONLY-LINK');
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.symlinks = false;
    if (config.resolveLoader) {
      config.resolveLoader.symlinks = false;
    }
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};

export default nextConfig;
