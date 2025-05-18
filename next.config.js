const { truncate } = require('fs');

/** @type {import('next').NextConfig} */
const nextConfig = {
   // 🚧  Disable React-Strict-Mode while we hunt the mismatch
  reactStrictMode: true,

   images: {
     domains: ['alpinegg-posters.s3.us-east-2.amazonaws.com'],
   },
   async rewrites() {
    return [
      {
        source: '/adminservice',
        destination: '/AdminService',
        permanent: true
      },
    ];
  },
};

module.exports = nextConfig;