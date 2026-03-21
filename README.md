# @agentaeo/mcp-server

MCP (Model Context Protocol) server for [AgentAEO](https://agentaeo.com) — run AEO (Answer Engine Optimization) audits across ChatGPT, Perplexity, Claude, and Google AI.

**Source:** [`agentaeo/agentaeo-mcp-server`](https://github.com/agentaeo/agentaeo-mcp-server) on GitHub (local folder name: `agentaeo-mcp-server`).

## Installation

```bash
npm install -g @agentaeo/mcp-server
# or
npx @agentaeo/mcp-server
```

## Configuration

Set your API key (get one at [agentaeo.com/agents](https://agentaeo.com/agents)):

```bash
export AGENTAEO_API_KEY=your_api_key_here
```

## Claude Desktop

Config file on macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

### After publishing to npm (recommended)

```json
{
  "mcpServers": {
    "agentaeo": {
      "command": "npx",
      "args": ["-y", "@agentaeo/mcp-server"],
      "env": {
        "AGENTAEO_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

`-y` skips npx’s “Ok to proceed?” prompt (important for GUI-launched processes).

### Local dev (before publish)

**Prefer `node` + `dist/index.js`** — `npx` + a local `.tgz` often breaks in Claude Desktop (npm path bugs, “tarball corrupted”, or `Permission denied` when the shell mishandles the archive). Avoid `.tgz` in the MCP config unless you’ve verified it on your machine.

1. In the repo: `npm install` and `npm run build` (must produce `dist/index.js`).
2. Use your **real** AgentAEO key in `AGENTAEO_API_KEY` (not the literal text `your_real_key_here`).

**Recommended — `node` + absolute path to `dist/index.js`:**

```json
{
  "mcpServers": {
    "agentaeo": {
      "command": "node",
      "args": ["/Users/aashishn/agents/agentaeo-mcp-server/dist/index.js"],
      "env": {
        "AGENTAEO_API_KEY": "paste_your_agentaeo_live_key_here"
      }
    }
  }
}
```

If `node` is not on Claude’s PATH (e.g. only nvm), use the full path to node, e.g. `"/Users/aashishn/.nvm/versions/node/v22.16.0/bin/node"` as `command` and the same `args` for `dist/index.js`.

**Optional — tarball via npx** (only if `node` works from Terminal but you prefer npx): some setups need `file:` prefix — ask in Terminal first:  
`npx -y file:/Users/aashishn/agents/agentaeo-mcp-server/agentaeo-mcp-server-0.1.0.tgz` — if that fails, stick to `node` + `dist`.

After editing the config, **fully quit Claude Desktop** (Cmd+Q) and reopen. Check **Settings → Developer → Local MCP servers** for a green status.

## Tools

| Tool | Description |
|------|-------------|
| `run_aeo_audit` | Run an AEO audit for a URL. Free: 8 queries. Paid: 40 queries with full blueprint. |
| `check_aeo_audit_status` | Poll audit status and retrieve results. Use the `auditId` from `run_aeo_audit`. |
| `generate_aeo_content_suite` | Generate Content Suite ZIP path (HTML + JSON-LD + `llms.txt`) for a **completed** audit. Uses the same `AGENTAEO_API_KEY` as the other tools (no shell). **Admin testing:** `adminContentBypass=true` + admin/allowlisted key. **Production:** pass `orderId` from `aeo_content_orders` after payment. Can take **10–25+ minutes** — some clients may timeout. |

### Why your agent can’t `curl` with `$AGENTAEO_API_KEY`

Sandbox VMs (e.g. Cowork) **do not** load `claude_desktop_config.json` and **do not** inherit your laptop’s shell `export`. Only processes started with that env (e.g. this MCP server) have the key. **Use `generate_aeo_content_suite` from Claude Desktop with MCP enabled**, or paste the key into the sandbox’s own secrets/env if the product supports it.

## Example

Ask Claude: *"Run a free AEO audit for agentaeo.com with keyword 'AI search visibility'"*

Then: *"Check the status of that audit"* (Claude will use the returned auditId)

## Requirements

- Node.js 18+
- AgentAEO API key from [agentaeo.com/agents](https://agentaeo.com/agents)

## Development & publishing

Run all **npm** commands from the repo root (the folder that contains `package.json`), e.g.:

```bash
cd ~/agents/agentaeo-mcp-server   # or your path to agentaeo-mcp-server
npm install
npm run build
npm pack                          # optional: test tarball before publish
```

Publish (after `npm login` and scope access for `@agentaeo`):

```bash
npm publish --access public
```

**GitHub vs npm:** The GitHub repo can stay **private**; the **npm package** `@agentaeo/mcp-server` is usually **public** so `npx @agentaeo/mcp-server` works for everyone. Those are independent settings.

## License

MIT
