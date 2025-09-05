/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable Turbopack for production builds to avoid Prisma issues
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Ensure Prisma client is properly handled
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    return config
  },
  // Disable static optimization for API routes that use Prisma
  output: 'standalone',
  // Ensure proper handling of environment variables
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

module.exports = nextConfig
