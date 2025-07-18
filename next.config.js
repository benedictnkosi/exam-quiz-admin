const { API_HOST } = require('./config/constants.js')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: API_HOST.replace('https://', ''),
        port: '',
        pathname: '/public/learn/learner/get-image',
      },
      {
        protocol: 'https',
        hostname: 'ozhhkdhtddoznswtplbx.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/question_images/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/og-image.png',
        destination: '/public/og-image.png',
      },
      {
        source: '/.well-known/apple-app-site-association',
        destination: '/public/.well-known/apple-app-site-association',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/.well-known/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    // Add a rule to handle the undici module
    config.module.rules.push({
      test: /node_modules\/undici\/.*\.js$/,
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env'],
      },
    });

    return config;
  },
}

module.exports = nextConfig 