// Dependency-free palette scan for the dashboard contract.
// Exits 0 when the scanned files are clean, and 1 when a hardcoded value is found.
// node scripts/check-dashboard-tokens.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const files = [
  "src/pages/dashboard.astro",
  "src/pages/dev/dashboard-states.astro",
  "src/components/auth/FormField.tsx",
  "src/components/auth/ServerError.tsx",
  "src/components/auth/SubmitButton.tsx",
  "src/components/ui/card.tsx",
];

// 10x-ui hardcoded-value scan.
const pattern =
  /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(|-\[[0-9.]+(px|rem)\]|\b(bg|text|border|ring|outline|from|via|to|fill|stroke|shadow|divide)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)\b/g;

let hits = 0;

for (const relativePath of files) {
  const source = readFileSync(join(root, relativePath), "utf8");
  const lines = source.split("\n");

  for (const [index, line] of lines.entries()) {
    pattern.lastIndex = 0;
    const matches = line.match(pattern);
    if (!matches) continue;

    for (const match of matches) {
      hits += 1;
      console.error(`${relativePath}:${index + 1}: ${match}`);
    }
  }
}

process.exit(hits > 0 ? 1 : 0);
