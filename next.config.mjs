/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // Firebase Storage (product images)
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      // Placeholder fallback images
      { protocol: 'https', hostname: 'placehold.co' },
      // Any other https image source (broad catch-all for dev flexibility)
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
