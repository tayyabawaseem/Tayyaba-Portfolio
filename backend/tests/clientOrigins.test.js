import test from "node:test";
import assert from "node:assert/strict";
import { getAllowedClientOrigins } from "../utils/clientOrigins.js";

test("development origin allowlist includes both Vite ports and configured origins", () => {
  assert.deepEqual(getAllowedClientOrigins({
    NODE_ENV: "development",
    CLIENT_URLS: " https://portfolio.example/,http://localhost:5200 ",
    CLIENT_URL: "https://admin.example"
  }), [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://portfolio.example",
    "http://localhost:5200",
    "https://admin.example"
  ]);
});

test("production origin allowlist only includes explicitly configured origins", () => {
  assert.deepEqual(getAllowedClientOrigins({
    NODE_ENV: "production",
    CLIENT_URLS: "https://portfolio.example,https://admin.example"
  }), [
    "https://portfolio.example",
    "https://admin.example"
  ]);
});

test("production requires an explicit origin and rejects invalid configured origins", () => {
  assert.throws(() => getAllowedClientOrigins({ NODE_ENV: "production" }), /must configure/);
  assert.throws(() => getAllowedClientOrigins({
    NODE_ENV: "production",
    CLIENT_URL: "file://portfolio.example"
  }), /HTTP or HTTPS/);
});
