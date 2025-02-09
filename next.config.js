/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'prices.aluvefarm.co.za',
        port: '',
        pathname: '/public/learn/learner/get-image',
      },
    ],
  },
}

module.exports = nextConfig 