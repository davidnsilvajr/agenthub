import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Ensure @base-ui packages (which ship ESM with bare specifiers) are transpiled
  transpilePackages: ["@base-ui/react", "@base-ui/utils"],
  webpack(config) {
    // @base-ui/utils ESM files import 'reselect' as a bare specifier but webpack
    // can't resolve it from inside node_modules/@base-ui/utils/esm/ — pin it explicitly.
    config.resolve.alias = {
      ...config.resolve.alias,
      reselect: path.resolve("node_modules/reselect"),
    };
    return config;
  },
};

export default nextConfig;
