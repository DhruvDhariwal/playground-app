/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: false // disable lightningcss to fix Vercel build
  }
}

module.exports = nextConfig
