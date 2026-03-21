#!/usr/bin/env node
/**
 * Download Content Suite ZIP with portal Agent API key (same as MCP).
 * Usage:
 *   export AGENTAEO_API_KEY=agentaeo_live_...
 *   export ORDER_ID=2d89baf3-8037-4982-8d8a-5235fa129523   # optional if you edit default below
 *   node download-content.mjs
 *
 * AGENTAEO_API_KEY is read from the environment first, then from Claude Desktop config (macOS).
 */
import { readFileSync, createWriteStream } from "fs";
import { homedir } from "os";
import { join } from "path";
import https from "https";

const ORDER_ID =
  process.env.ORDER_ID?.trim() || "2d89baf3-8037-4982-8d8a-5235fa129523";
const DOWNLOAD_URL = `https://agentaeo-api.onrender.com/api/aeo-content-download/${ORDER_ID}`;
const OUT_FILE =
  process.env.OUT_FILE?.trim() ||
  `content-suite-${ORDER_ID.replace(/-/g, "").slice(0, 8)}.zip`;

let apiKey = process.env.AGENTAEO_API_KEY?.trim();
if (!apiKey) {
  const configPath = join(
    homedir(),
    "Library/Application Support/Claude/claude_desktop_config.json"
  );
  try {
    const cfg = JSON.parse(readFileSync(configPath, "utf8"));
    for (const server of Object.values(cfg.mcpServers || {})) {
      if (server?.env?.AGENTAEO_API_KEY) {
        apiKey = server.env.AGENTAEO_API_KEY;
        break;
      }
    }
  } catch (e) {
    console.error("Could not read Claude config:", e.message);
  }
}

if (!apiKey) {
  console.error(
    "Set AGENTAEO_API_KEY or add it to claude_desktop_config.json → mcpServers.*.env"
  );
  process.exit(1);
}

console.log(`Downloading to ${OUT_FILE}...`);
const file = createWriteStream(OUT_FILE);
const req = https.get(
  DOWNLOAD_URL,
  { headers: { "X-API-Key": apiKey } },
  (res) => {
    if (res.statusCode !== 200) {
      console.error(`HTTP ${res.statusCode}`);
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        console.error(body.slice(0, 500));
        process.exit(1);
      });
      return;
    }
    res.pipe(file);
    file.on("finish", () => {
      file.close();
      console.log(`✅ Saved: ${OUT_FILE}`);
    });
  }
);
req.on("error", (e) => {
  console.error(e.message);
  process.exit(1);
});
