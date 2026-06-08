/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // pdf-parse uses Node.js builtins — exclude from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, path: false, stream: false, crypto: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
