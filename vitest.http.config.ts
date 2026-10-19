import { configDefaults } from "vitest/config";
import baseConfig from "./vitest.config.ts";

// `--exclude` only appends, so this file replaces the Phase 1 exclude.
// The base config still loads `.env` and drops the Cloudflare plugins.
export default async (env: Parameters<typeof baseConfig>[0]) => {
  const config = await baseConfig(env);
  return {
    ...config,
    test: {
      ...config.test,
      exclude: [...configDefaults.exclude],
    },
  };
};
