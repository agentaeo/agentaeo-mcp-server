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

### Local dev (before publish, or testing a `.tgz`)

**Do not use relative paths** like `./agentaeo-mcp-server-0.1.0.tgz` — Claude Desktop’s working directory is **not** your repo folder, so the file won’t be found.

Use **one** of these (replace with your real path):

**A — Absolute path to the tarball**

```json
{
  "mcpServers": {
    "agentaeo": {
      "command": "npx",
      "args": ["-y", "/Users/aashishn/agents/agentaeo-mcp-server/agentaeo-mcp-server-0.1.0.tgz"],
      "env": {
        "AGENTAEO_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**B — `node` + built `dist` (no npx, no tarball)**

Run `npm run build` first so `dist/index.js` exists:

```json
{
  "mcpServers": {
    "agentaeo": {
      "command": "node",
      "args": ["/Users/aashishn/agents/agentaeo-mcp-server/dist/index.js"],
      "env": {
        "AGENTAEO_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

After editing the config, **fully quit Claude Desktop** (not just close the window) and reopen. If it still fails, check **Claude → Settings → Developer → MCP** for error messages.

## Tools

| Tool | Description |
|------|-------------|
| `run_aeo_audit` | Run an AEO audit for a URL. Free: 8 queries. Paid: 40 queries with full blueprint. |
| `check_aeo_audit_status` | Poll audit status and retrieve results. Use the `auditId` from `run_aeo_audit`. |

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
