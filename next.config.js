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