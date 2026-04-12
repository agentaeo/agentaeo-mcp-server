# @agentaeo/mcp-server

[![agentaeo-mcp-server MCP server](https://glama.ai/mcp/servers/agentaeo/agentaeo-mcp-server/badges/card.svg)](https://glama.ai/mcp/servers/agentaeo/agentaeo-mcp-server)
[![agentaeo-mcp-server MCP server](https://glama.ai/mcp/servers/agentaeo/agentaeo-mcp-server/badges/score.svg)](https://glama.ai/mcp/servers/agentaeo/agentaeo-mcp-server)

MCP (Model Context Protocol) server for [AgentAEO](https://agentaeo.com) — run AEO (Answer Engine Optimization) audits across ChatGPT, Perplexity, Claude, and Google AI.

---

## Quick Start (30 seconds)

**Step 1** — Get your API key at [agentaeo.com/agents](https://agentaeo.com/agents)

**Step 2** — Add to your MCP host config (Claude Desktop, Cursor, etc.):

```json
{
  "mcpServers": {
    "agentaeo": {
      "command": "npx",
      "args": ["-y", "@agentaeo/mcp-server"],
      "env": {
        "AGENTAEO_API_KEY": "your_key_here"
      }
    }
  }
}
```

**Step 3** — Ask your agent:

```
Run a free AEO audit for example.com with keyword "AI search visibility"
```

---

## How the API Key Works with AI Agents

**The agent never visits agentaeo.com to get a key.** You (the operator) get the key once and set it in your MCP host config. Every AI agent that runs through that host inherits the key silently from the environment — the agent never sees it in chat, never handles it directly.

```
You (one time)
  ├─ 1. Get API key from agentaeo.com/agents
  ├─ 2. Set AGENTAEO_API_KEY in MCP host config
  │
MCP Host (Claude Desktop / Cursor)
  ├─ 3. Starts MCP server process with env var injected
  │
@agentaeo/mcp-server
  ├─ 4. Reads AGENTAEO_API_KEY from environment
  ├─ 5. Exposes 5 tools to the agent
  │
AI Agent
  └─ 6. Calls tools by name — never sees or touches the key
```

> Keep your key private. Never commit it to git or paste it in chat.

---

## Configure Your MCP Host

### Claude Desktop

Config file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "agentaeo": {
      "command": "npx",
      "args": ["-y", "@agentaeo/mcp-server"],
      "env": {
        "AGENTAEO_API_KEY": "your_key_here"
      }
    }
  }
}
```

Fully quit Claude Desktop (Cmd+Q) and reopen after editing. Check **Settings → Developer → Local MCP servers** for a green status.

### Cursor IDE

**Global** (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "agentaeo": {
      "command": "npx",
      "args": ["-y", "@agentaeo/mcp-server"],
      "env": {
        "AGENTAEO_API_KEY": "your_key_here"
      }
    }
  }
}
```

**Project-only** (`.cursor/mcp.json` in repo root) — same format; takes effect for that project only.

### Glama Inspector

In Glama's hosted MCP inspector, set the `AGENTAEO_API_KEY` environment variable in your instance's **Secrets / Environment** settings before connecting. Without it, any tool that calls the AgentAEO API will return an auth error.

### Global install + env var

```bash
npm install -g @agentaeo/mcp-server
export AGENTAEO_API_KEY=your_key_here
agentaeo-mcp-server
```

---

## Tools

| Tool | Description |
|------|-------------|
| `run_aeo_audit` | Start an async AEO audit. Returns `auditId` immediately. Poll `check_aeo_audit_status` every 10–15s. |
| `check_aeo_audit_status` | Poll audit status and retrieve results. Free tier: stop when `free_preview_ready`. Paid: poll until `is_complete`. |
| `generate_aeo_content_suite` | Start Content Suite generation (async, returns `orderId`). Requires completed paid audit. Poll every 30s; takes 5–25 min. |
| `check_aeo_content_suite_status` | Poll Content Suite job. When `status` is `completed`, download with `download_aeo_content_suite_zip`. |
| `download_aeo_content_suite_zip` | Download completed Content Suite ZIP to local filesystem. |

### Typical flows

**Free audit (preview):**
```
run_aeo_audit → check_aeo_audit_status (poll every 10s) → preview report
```

**Full audit + content suite (paid):**
```
run_aeo_audit → check_aeo_audit_status (poll until is_complete)
  → generate_aeo_content_suite → check_aeo_content_suite_status (poll every 30s)
  → download_aeo_content_suite_zip
```

### Optional env vars

| Variable | Default | Purpose |
|----------|---------|---------|
| `AGENTAEO_API_KEY` | — | **Required.** Your API key from agentaeo.com/agents |
| `AGENTAEO_MCP_INLINE_POLL` | `0` | Set `1` to poll inside `run_aeo_audit` (may exceed Claude Desktop's ~60s tool limit) |
| `AGENTAEO_MCP_INLINE_CONTENT_POLL` | `0` | Set `1` to poll inside `generate_aeo_content_suite` |
| `AGENTAEO_MCP_DOWNLOAD_DIR` | cwd | Directory for downloaded Content Suite ZIPs |

---

## Resources

The server exposes one static resource at `agentaeo://workflow` — a Markdown guide covering the recommended tool sequence (audit → poll → content suite → poll → download). Read it with any MCP client that supports resources.

---

## Troubleshooting

**`AGENTAEO_API_KEY is required but not set`**
The env var is missing. Add it to your MCP host config's `env` block (see Configure above). Re-run `run_aeo_audit` after.

**`npx @agentaeo/mcp-server` → `command not found`**
Add `--yes` flag: `npx --yes @agentaeo/mcp-server`. Or install globally: `npm install -g @agentaeo/mcp-server`.

**Audit stuck in `processing` for 10+ minutes**
Call `check_aeo_audit_status` with the `auditId`. If `status` is `failed`, start a new audit. Free preview is usually 3–5 min; full paid report 15–20 min.

**Claude Desktop shows MCP server as disconnected**
Fully quit (Cmd+Q on Mac, not just close window) and reopen. Check `Settings → Developer → Local MCP servers`.

**nvm / node not found**
Replace `"command": "npx"` with the full path: `"/Users/yourname/.nvm/versions/node/v22.x.x/bin/npx"`.

---

## Requirements

- Node.js 18+
- AgentAEO API key from [agentaeo.com/agents](https://agentaeo.com/agents)

---

## Development

```bash
git clone https://github.com/agentaeo/agentaeo-mcp-server
cd agentaeo-mcp-server
npm install
npm run build      # produces dist/index.js
node dist/index.js # test locally (set AGENTAEO_API_KEY first)
```

Publish (requires `npm login` and `@agentaeo` org access):

```bash
npm publish --access public
```

---

## License

[MIT](LICENSE) — AIMetica Solutions LLP
