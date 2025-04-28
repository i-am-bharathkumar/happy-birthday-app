/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static export
  images: {
    unoptimized: true // Disables Image Optimization API
  },
};

module.exports = nextConfig;
