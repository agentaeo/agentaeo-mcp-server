# Release, testing & directories (quick reference)

## How API keys work (each user is different)

- The **npm package** does not contain any API key.
- Each person sets **`AGENTAEO_API_KEY`** in their own **Claude Desktop** config (or shell env) to **their** key from [agentaeo.com/agents](https://agentaeo.com/agents).
- Your admin/test key is only for **your** machine. Customers/agents each use **their** account’s `agentaeo_live_*` key.
- **Never** commit keys, paste them in public chats, or put them in the repo.

---

## Publish to npm (from repo root)

```bash
cd /path/to/agentaeo-mcp-server
npm install
npm run build
npm whoami    # must show your npm user
```

1. **Scope `@agentaeo`:** On [npmjs.com](https://www.npmjs.com), create/join org **agentaeo** and ensure your user can publish scoped packages. If you use another scope, change `"name"` in `package.json` first.

2. **Login** (once per machine):

```bash
npm login
```

3. **Publish**:

```bash
npm publish --access public
```

4. **Verify**:

```bash
npm view @agentaeo/mcp-server
```

5. **Optional — switch Claude Desktop to registry** (after publish):

```json
"command": "npx",
"args": ["-y", "@agentaeo/mcp-server"],
"env": { "AGENTAEO_API_KEY": "<their_own_key>" }
```

You do **not** have to change JSON until you want everyone on `npx` instead of local `node` + `dist`.

---

## What to ask Claude (Cowork / Desktop) to test E2E

Copy-paste as one session:

1. **List tools** — “List MCP tools from the agentaeo server” — confirm `run_aeo_audit` and `check_aeo_audit_status`.

2. **Run audit** — “Use `run_aeo_audit` with url `https://stripe.com`, keyword `payment API`, tier `free`.” — expect an `auditId` (or error if key/backend rejects).

3. **Poll status** — “Use `check_aeo_audit_status` with the auditId from the previous step.” — expect status / progress / completion when ready.

4. **Invalid key (optional)** — Temporarily set a wrong key in config, restart Claude, run step 2 — expect 401 or clear error; then restore the real key.

---

## Submit to directories (after npm is live)

Do these **after** `npm view @agentaeo/mcp-server` works.

| Where | Notes |
|-------|--------|
| **Anthropic** | [Connector submission](https://support.anthropic.com) / product forms — use official Anthropic connector/MCP listing process when available. |
| **MCP Registry** | [https://registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io) — submit package name `@agentaeo/mcp-server`. |
| **Smithery** | [smithery.ai](https://smithery.ai) — search “submit” / list MCP server. |
| **GitHub** | Repo is already under `agentaeo/agentaeo-mcp-server` — add topics: `mcp`, `agentaeo`, `aeo`. |

Exact URLs change; search “Anthropic MCP connector submit” / “MCP registry submit” for the latest forms.

---

## Pre-directory checklist

- [ ] `npm publish` succeeded
- [ ] `npx -y @agentaeo/mcp-server` runs (stdio) with a valid key
- [ ] Claude Desktop E2E: run audit → check status
- [ ] README install instructions match published package name
- [ ] No secrets in git history
