/** @type {import('next').NextConfig} */
const nextConfig = {
   // 🚧  Disable React-Strict-Mode while we hunt the mismatch
  reactStrictMode: false,

   images: {
     domains: ['alpinegg-posters.s3.us-east-2.amazonaws.com'],
   },
};

module.exports = nextConfig;