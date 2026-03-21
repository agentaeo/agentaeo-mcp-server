# Glama.ai — claim & score

## Claim (“Author not verified”)

1. **`glama.json` → `maintainers`** must list the **exact GitHub username(s)** of the account that will click **Claim** (case-sensitive). Org repos: use a user who is allowed to represent the org.
2. After editing `glama.json`, push to GitHub, then in [Glama server admin](https://glama.ai/mcp/servers/agentaeo/agentaeo-mcp-server) use **Sync Server** (or wait up to ~24h for auto-sync).
3. Sign in to Glama with **the same GitHub account** as one of the `maintainers` entries.
4. If it still fails: try an incognito window, revoke/re-auth GitHub on Glama, or contact Glama support — org permissions sometimes block OAuth until the user’s role is visible to Glama.

## LICENSE

Glama scans the **GitHub repo** for a **`LICENSE` file** (not only `package.json` `"license": "MIT"`). This repo includes **`LICENSE`** at the root so GitHub shows the MIT badge and Glama can mark “has license” after the next scan.

## Score page

Items on [Score](https://glama.ai/mcp/servers/agentaeo/agentaeo-mcp-server/score) improve automatically when:

| Item | Action |
|------|--------|
| Missing LICENSE | ✅ Add root `LICENSE` (done). |
| Author not verified | Claim with matching GitHub user (above). |
| No recent usage | Normal for new servers; grows with installs. |
| No related servers | Optional later. |

You do **not** need to block on a perfect score to list elsewhere (awesome-mcp-servers, mcp.so, etc.).
