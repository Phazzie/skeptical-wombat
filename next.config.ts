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
  // Do NOT mark any @stackframe/* packages as external.
  //
  // Previously @stackframe/stack-shared and @stackframe/stack-sc were listed here
  // as a middle-ground (keeping the main @stackframe/stack bundled for RSC serialization,
  // but marking its transitive deps external to avoid double-instantiation). However,
  // those packages are TRANSITIVE deps — not in package.json directly — so Vercel's NFT
  // (Node File Tracing) doesn't reliably trace all their subpath exports. At Lambda
  // cold-start the bundled @stackframe/stack calls require('@stackframe/stack-shared/…')
  // which fails with "Cannot find module", producing a bare 500 with no runtime logs.
  //
  // Bundling all @stackframe/* packages together avoids the runtime module-not-found crash
  // and is safe because we never pass StackServerApp instances through RSC boundaries
  // (only serializable props are passed to client components).
  serverExternalPackages: [],
  transpilePackages: ['motion'],
};

export default nextConfig;
