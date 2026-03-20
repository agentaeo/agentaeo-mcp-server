# Test Sequence Before npm Publish

Run these steps before `npm publish --access public`:

## 1. Build

```bash
npm run build
```

## 2. Pack & verify tarball

```bash
npm pack
# Verify: agentaeo-mcp-server-0.1.0.tgz created
```

## 3. Test with API key (server starts)

```bash
AGENTAEO_API_KEY=test npx ./agentaeo-mcp-server-0.1.0.tgz
# Server should start (stdio mode, waits for input). Ctrl+C to exit.
```

## 4. Test without API key (exits with error)

```bash
unset AGENTAEO_API_KEY
npx ./agentaeo-mcp-server-0.1.0.tgz
# Should exit with code 1 and clear error message
```

## 5. Claude Desktop local test

**Use an absolute path** — `./agentaeo-mcp-server-0.1.0.tgz` fails in Claude Desktop because its cwd is not your repo.

Example (adjust username/path):

```json
{
  "mcpServers": {
    "agentaeo": {
      "command": "npx",
      "args": ["-y", "/Users/aashishn/agents/agentaeo-mcp-server/agentaeo-mcp-server-0.1.0.tgz"],
      "env": {
        "AGENTAEO_API_KEY": "your_real_key"
      }
    }
  }
}
```

Or after `npm run build`, use `node` + `dist/index.js` (see README).

- Fully quit and reopen Claude Desktop
- Ask: "List your MCP tools" — should see `run_aeo_audit` and `check_aeo_audit_status`
- Ask: "Run a free AEO audit for agentaeo.com" — should return auditId
- Ask: "Check the status of that audit" — should return status/results

## 6. Verify 401 with wrong key

Use an invalid key — `run_aeo_audit` should return an error (401 Unauthorized).

## 7. Publish

```bash
npm publish --access public
```

## 8. Verify published

```bash
npm view @agentaeo/mcp-server
```
