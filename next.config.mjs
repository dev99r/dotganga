/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ['pdf-parse', 'mongoose'] },
  images: { domains: ['graph.facebook.com'] },
};

export default nextConfig;
