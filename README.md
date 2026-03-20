# @agentaeo/mcp-server

MCP (Model Context Protocol) server for [AgentAEO](https://agentaeo.com) — run AEO (Answer Engine Optimization) audits across ChatGPT, Perplexity, Claude, and Google AI.

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

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "agentaeo": {
      "command": "npx",
      "args": ["@agentaeo/mcp-server"],
      "env": {
        "AGENTAEO_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

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

## License

MIT
