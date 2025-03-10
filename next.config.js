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