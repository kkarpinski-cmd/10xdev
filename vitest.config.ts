import { getViteConfig } from "astro/config";
import "vitest/config";
import type { PluginOption } from "vite";

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

export default async (env: Parameters<typeof astroViteConfig>[0]) => {
  const config = await astroViteConfig(env);
  return {
    ...config,
    plugins: withoutCloudflarePlugins(config.plugins),
  };
};
