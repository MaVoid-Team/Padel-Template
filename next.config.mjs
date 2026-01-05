/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['*']
    }
  },
  // output: "export",

  // basePath: "/Padel-Template",
  // assetPrefix: "/Padel-Template/",

  images: {
    unoptimized: true,
  },
};
export default nextConfig;