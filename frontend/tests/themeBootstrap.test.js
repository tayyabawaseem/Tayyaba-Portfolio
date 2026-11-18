import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const bootstrap = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/)?.[1];
assert.ok(bootstrap, "index.html should contain the pre-render theme bootstrap");

const runBootstrap = (entries) => {
  const values = new Map(Object.entries(entries));
  const styles = new Map();
  const root = { dataset: {}, style: { setProperty: (key, value) => styles.set(key, value) } };
  const storage = {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  runInNewContext(bootstrap, {
    document: { documentElement: root },
    localStorage: storage,
    console: { warn() {} },
  });
  return { root, styles, values };
};

test("valid visitor preference overrides cached default before first render", () => {
  const { root, styles } = runBootstrap({
    "portfolio-theme": "dark",
    "portfolio-appearance-cache": JSON.stringify({
      theme: { defaultTheme: "light" },
      colors: { dark: { background: "#111111", text: "#eeeeee" } },
    }),
  });
  assert.equal(root.dataset.portfolioTheme, "dark");
  assert.equal(styles.get("--portfolio-boot-background"), "#111111");
  assert.equal(styles.get("--portfolio-boot-text"), "#eeeeee");
});

test("invalid visitor preference is cleared and cached default is applied", () => {
  const { root, values, styles } = runBootstrap({
    "portfolio-theme": "system",
    "portfolio-appearance-cache": JSON.stringify({
      theme: { defaultTheme: "light" },
      colors: { light: { background: "#f0f0f0", text: "#202020" } },
    }),
  });
  assert.equal(root.dataset.portfolioTheme, "light");
  assert.equal(values.has("portfolio-theme"), false);
  assert.equal(styles.get("--portfolio-boot-background"), "#f0f0f0");
});

test("malformed cached settings safely fall back to dark", () => {
  const { root, styles } = runBootstrap({
    "portfolio-appearance-cache": "{broken",
  });
  assert.equal(root.dataset.portfolioTheme, "dark");
  assert.equal(styles.size, 0);
});
