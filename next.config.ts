import type { NextConfig } from "next";

// Set BASE_PATH when building for a subpath host such as GitHub Pages (e.g. "/campfire").
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
