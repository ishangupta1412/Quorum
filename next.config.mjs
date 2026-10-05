/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/nexus',
        destination: '/core/nexus',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
