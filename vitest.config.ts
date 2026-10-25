import { getViteConfig } from "astro/config";
import "vitest/config";
import { loadEnv, type PluginOption } from "vite";

const astroViteConfig = getViteConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["test/band-http.test.ts"],
  },
});

function isCloudflarePlugin(plugin: PluginOption): boolean {
  if (!plugin || typeof plugin !== "object" || !("name" in plugin) || typeof plugin.name !== "string") {
    return false;
  }
  return (
    plugin.name === "vite-plugin-cloudflare" ||
    plugin.name.startsWith("vite-plugin-cloudflare:") ||
    plugin.name.startsWith("@astrojs/cloudflare")
  );
}

function withoutCloudflarePlugins(plugins: PluginOption[] | undefined): PluginOption[] {
  if (!plugins) {
    return [];
  }
  const kept: PluginOption[] = [];
  for (const plugin of plugins) {
    if (Array.isArray(plugin)) {
      const nested = withoutCloudflarePlugins(plugin);
      if (nested.length > 0) {
        kept.push(nested);
      }
      continue;
    }
    if (!isCloudflarePlugin(plugin)) {
      kept.push(plugin);
    }
  }
  return kept;
}

function envFromFiles(mode: string): Record<string, string> {
  const fromFile = loadEnv(mode, process.cwd(), "");
  const merged: Record<string, string> = { ...fromFile };
  for (const key of Object.keys(fromFile)) {
    const current = process.env[key];
    if (current) {
      merged[key] = current;
    }
  }
  return merged;
}

export default async (env: Parameters<typeof astroViteConfig>[0]) => {
  const config = await astroViteConfig(env);
  return {
    ...config,
    test: {
      ...config.test,
      env: envFromFiles(env.mode),
    },
    plugins: withoutCloudflarePlugins(config.plugins),
  };
};
