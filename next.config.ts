import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __projectDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: __projectDir,
  },
};

export default nextConfig;
