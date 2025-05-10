/**
 * @type {import('next').NextConfig}
 */
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'alpinegg-posters-dev.s3.us-east-2.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'alpinegg-posters.s3.us-east-2.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
};
