# MCP short sprint — Git & GitHub (why “clone” failed)

## Why GitHub Desktop said “empty folder only”

- **Clone** = download a repo **into a new empty directory**.
- Your code **already lives** in `/Users/aashishn/agents/agentaeo-mcp-server/`, so you must **not** clone there.

**Correct pattern for existing code:**

1. `git init` (already done here)
2. `git add` + `git commit`
3. Create an **empty** repo on GitHub (e.g. `agentaeo/mcp-server`) — no README if you want a clean first push
4. `git remote add origin https://github.com/agentaeo/mcp-server.git`
5. `git push -u origin main`

You can do steps 3–5 in **Terminal**; GitHub Desktop can **open** this folder after the first push (“Add Local Repository”).

---

## Activate before we go live

| Step | What you do |
|------|-------------|
| 1 | **GitHub:** Create repo `agentaeo/mcp-server` (empty, or with README — see below). |
| 2 | **SSH vs HTTPS:** Prefer HTTPS + GitHub credential helper, or add SSH key to GitHub. |
| 3 | **npm:** `npm login` (for `@agentaeo` scope: org must exist on npm, or change scope in `package.json`). |
| 4 | **Secrets:** Real `agentaeo_live_*` key for E2E tests (never commit). |
| 5 | **Render:** Confirm `https://agentaeo-api.onrender.com` is the backend URL in MCP (already in code). |

If GitHub repo was created **with** a README, first push needs:

```bash
git pull origin main --rebase   # or: git pull origin main --allow-unrelated-histories
git push -u origin main
```

If repo is **empty**, a normal `git push -u origin main` is enough.

---

## Commands (after first commit exists locally)

```bash
cd /Users/aashishn/agents/agentaeo-mcp-server

git remote add origin https://github.com/agentaeo/mcp-server.git
# If remote already exists: git remote set-url origin https://github.com/agentaeo/mcp-server.git

git push -u origin main
```

---

## Order of operations (full sprint)

1. **Git:** commit → remote → push (this doc).
2. **Test:** `TEST_SEQUENCE.md` + Claude Desktop + real API key.
3. **npm:** `npm publish --access public` (scope/org ready).
4. **Directories:** Anthropic Connectors, MCP Registry, Smithery (after package is on npm).

---

## GitHub Desktop tip

After the first successful push: **File → Add Local Repository** → pick `agentaeo-mcp-server`. Do not use Clone for this folder.
