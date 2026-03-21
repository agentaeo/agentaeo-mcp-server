# Test Sequence Before npm Publish

Run these steps before `npm publish --access public`:

## 1. Build

```bash
npm run build
```

## 2. Pack & verify tarball

```bash
TGZ=$(npm pack | tail -1)
echo "Packed: $TGZ"
# Filename matches version in package.json, e.g. agentaeo-mcp-server-0.1.7.tgz
```

## 3. Test with API key (server starts)

```bash
TGZ=$(ls -1 agentaeo-mcp-server-*.tgz 2>/dev/null | tail -1)
AGENTAEO_API_KEY=test npx "./$TGZ"
# Server should start (stdio mode, waits for input). Ctrl+C to exit.
```

(Or run `npm pack` first, then `npx "./agentaeo-mcp-server-<version>.tgz"` using the printed name.)

## 4. Test without API key (exits with error)

```bash
TGZ=$(ls -1 agentaeo-mcp-server-*.tgz 2>/dev/null | tail -1)
unset AGENTAEO_API_KEY
npx "./$TGZ"
# Should exit with code 1 and clear error message
```

## 5. Claude Desktop local test

**Use an absolute path** — a bare `./agentaeo-mcp-server-*.tgz` may fail in Claude Desktop because its cwd is not your repo.

After `npm pack`, take the printed filename (e.g. `agentaeo-mcp-server-0.1.7.tgz`) and use the **full path** to that file:

```json
{
  "mcpServers": {
    "agentaeo": {
      "command": "npx",
      "args": ["-y", "/Users/aashishn/agents/agentaeo-mcp-server/agentaeo-mcp-server-0.1.7.tgz"],
      "env": {
        "AGENTAEO_API_KEY": "your_real_key"
      }
    }
  }
}
```

Replace the path and `.tgz` name with **your** machine path and the file from **`npm pack`**.

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
