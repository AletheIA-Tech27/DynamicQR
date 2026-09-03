import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Desactiva el type-check durante el build de Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // Desactiva las alertas de ESLint en build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
