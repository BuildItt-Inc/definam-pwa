/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
};

let nextConfig = baseConfig;

try {
  const pwaFactory = require('next-pwa');
  // next-pwa v5: factory takes PWA options and returns a HOC
  const withPWA =
    typeof pwaFactory === 'function'
      ? pwaFactory
      : pwaFactory && typeof pwaFactory.default === 'function'
        ? pwaFactory.default
        : null;

  if (withPWA) {
    nextConfig = withPWA({
      dest: 'public',
      disable: process.env.NODE_ENV === 'development',
      register: true,
      skipWaiting: true,
    })(baseConfig);
  }
} catch (e) {
  // next-pwa not available — fall back to plain config
}

module.exports = nextConfig;
