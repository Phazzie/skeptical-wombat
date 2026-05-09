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
  // Only mark the low-level shared packages as external (not the main @stackframe/stack).
  // Keeping @stackframe/stack bundled is required for RSC serialization to work correctly —
  // when it's external, StackServerApp class instances can't be passed through RSC boundaries.
  serverExternalPackages: [
    '@stackframe/stack-shared',
    '@stackframe/stack-sc',
  ],
  transpilePackages: ['motion'],
};

export default nextConfig;
