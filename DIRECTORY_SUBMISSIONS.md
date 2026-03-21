# MCP Directory Submissions — @agentaeo/mcp-server

## Status

| Directory | Action | Status |
|-----------|--------|--------|
| Glama | Add `glama.json` to repo → claim at glama.ai | ✅ File ready — push + claim |
| Smithery | Add `smithery.yaml` to repo → submit URL | ✅ File ready — push + submit |
| awesome-mcp-servers (punkpeye) | PR to GitHub repo | Ready to open |
| mcpservers.org (wong2) | Web form | Copy-paste below |
| mcp.so | Web form / GitHub issue | Copy-paste below |
| Cursor Directory | cursor.directory/plugins/new | Copy-paste below |
| MCP Registry (official) | registry.modelcontextprotocol.io | Copy-paste below |

---

## 1. Glama — https://glama.ai/mcp/servers

`glama.json` is already in the repo root. Steps:
1. Push repo (includes `glama.json`)
2. Go to https://glama.ai/mcp/servers — search for your repo or paste GitHub URL
3. Click **Claim ownership** → authenticate with GitHub (agentaeo org)
4. Done — Glama auto-indexes from npm and GitHub

---

## 2. Smithery — https://smithery.ai

`smithery.yaml` is in the repo root. Steps:
1. Push repo
2. Go to https://smithery.ai and sign in
3. Submit via: `smithery mcp publish https://github.com/agentaeo/agentaeo-mcp-server -n agentaeo/agentaeo-mcp-server`
   OR use the web UI: https://smithery.ai/new → paste GitHub URL
4. Smithery will auto-read `smithery.yaml` and publish

---

## 3. awesome-mcp-servers (punkpeye) — https://github.com/punkpeye/awesome-mcp-servers

Open a PR adding this line to the **🎯 Marketing** (or **🔎 Search & Data Extraction**) section:

```markdown
- [agentaeo/agentaeo-mcp-server](https://github.com/agentaeo/agentaeo-mcp-server) 📇 ☁️ - Run AEO (Answer Engine Optimization) audits across ChatGPT, Perplexity, Claude, and Google AI to measure brand citation visibility and generate content to improve AI search rankings.
```

PR title: `Add @agentaeo/mcp-server — AEO audit tool for AI search visibility`

---

## 4. mcpservers.org / wong2 awesome-mcp-servers

Submit at: https://mcpservers.org/submit

**Fields:**
- **Name:** AgentAEO MCP Server
- **GitHub URL:** https://github.com/agentaeo/agentaeo-mcp-server
- **npm:** https://www.npmjs.com/package/@agentaeo/mcp-server
- **Category:** Marketing / SEO / Analytics
- **Description:** Run AEO (Answer Engine Optimization) audits across ChatGPT, Perplexity, Claude, and Google AI. Measures brand citation visibility, generates an AEO health score, and produces a 9-page content suite to improve AI search rankings. Free (8 queries) and paid (40 queries, 30-day roadmap) tiers.
- **Tags:** aeo, seo, marketing, ai-search, brand-visibility, chatgpt, perplexity, claude

---

## 5. mcp.so

Submit at: https://mcp.so (click Submit in nav)

**Fields — same as above:**
- **Name:** AgentAEO — AEO Audit & AI Search Visibility
- **GitHub:** https://github.com/agentaeo/agentaeo-mcp-server
- **npm package:** @agentaeo/mcp-server
- **Short description (tweet-length):** Audit your brand's visibility across ChatGPT, Perplexity, Claude, and Google AI. Get an AEO health score + content suite to rank in AI-generated answers.
- **Tags:** marketing, seo, aeo, analytics, ai-search

---

## 6. Cursor Directory — https://cursor.directory/plugins/new

- **Plugin name:** AgentAEO — AEO Audit
- **Type:** MCP
- **npm package:** @agentaeo/mcp-server
- **GitHub:** https://github.com/agentaeo/agentaeo-mcp-server
- **Description:** Run AEO (Answer Engine Optimization) audits to measure brand visibility across ChatGPT, Perplexity, Claude, and Google AI. Returns citation rate, AEO health score (Entity Recognition, Content Chunking, Visual Search, Query Gap), and a 9-page content suite to improve AI answer rankings.
- **Config snippet:**
```json
{
  "mcpServers": {
    "agentaeo": {
      "command": "npx",
      "args": ["-y", "@agentaeo/mcp-server"],
      "env": { "AGENTAEO_API_KEY": "your_key_here" }
    }
  }
}
```

---

## 7. Official MCP Registry — https://registry.modelcontextprotocol.io

The registry indexes from npm automatically for packages following MCP conventions. Additionally:
1. Ensure `package.json` has `"keywords": ["mcp", "mcp-server"]`
2. Visit registry.modelcontextprotocol.io and check if auto-listed
3. If manual submission needed: fill in name, npm package, GitHub, description, tools list

**Tools to list:**
- `run_aeo_audit` — Start async AEO audit for a URL; returns auditId
- `check_aeo_audit_status` — Poll audit status; returns results when complete
- `generate_aeo_content_suite` — Start async content suite generation; returns orderId
- `check_aeo_content_suite_status` — Poll content suite status; returns download URL when complete
- `download_aeo_content_suite_zip` — Download completed content ZIP with API key

---

## One-line description (use everywhere)
> Audit your brand's AI search visibility across ChatGPT, Perplexity, Claude & Google AI — get citation rates, AEO health scores, and a 9-page content suite to rank in AI-generated answers.

## Keywords / tags (use everywhere)
`mcp`, `mcp-server`, `aeo`, `seo`, `marketing`, `ai-search`, `brand-visibility`, `chatgpt`, `perplexity`, `claude`, `google-ai`, `answer-engine-optimization`
