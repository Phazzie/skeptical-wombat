import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Treat @stackframe packages as external to avoid React 19 ESM bundling
  // issues where 'useContext' is not found in the bundled react module.
  serverExternalPackages: [
    '@stackframe/stack',
    '@stackframe/stack-shared',
    '@stackframe/stack-sc',
  ],
  transpilePackages: ['motion'],
};

export default nextConfig;
