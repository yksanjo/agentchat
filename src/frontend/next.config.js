/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'api.agentchat.io'],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://api.agentchat.io/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
