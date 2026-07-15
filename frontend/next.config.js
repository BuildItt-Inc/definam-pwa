<<<<<<< Updated upstream
/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};
module.exports = nextConfig;
=======
let withPWA = null;
try {
  const p = require("next-pwa");
  withPWA = typeof p === "function" ? p : p && typeof p.default === "function" ? p.default : null;
} catch (e) {
  // next-pwa not available or failed to load (e.g. missing optional peer deps)
  withPWA = null;
}

const baseConfig = {
  reactStrictMode: true,
};

if (withPWA) {
  module.exports = withPWA({
    ...baseConfig,
    pwa: {
      dest: "public",
      disable: process.env.NODE_ENV === "development",
    },
  });
} else {
  module.exports = baseConfig;
}
>>>>>>> Stashed changes
