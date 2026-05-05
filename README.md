# AgentAEO MCP Server

[![npm version](https://img.shields.io/npm/v/@agentaeo/mcp-server?logo=npm&label=@agentaeo/mcp-server)](https://www.npmjs.com/package/@agentaeo/mcp-server)
[![Anthropic MCP Registry](https://img.shields.io/badge/Anthropic-MCP%20Registry-black?labelColor=111827)](https://registry.modelcontextprotocol.io/)
[![Glama AAA](https://img.shields.io/badge/Glama-AAA-10b981?labelColor=111827)](https://glama.ai/mcp/servers/search/agent-aeo-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-3b82f6?labelColor=111827)](./LICENSE)

> Ask Claude: "Why is [competitor] being cited instead of us for [category] queries?" Get the answer. Get the fix.

AgentAEO is a retrieval intelligence layer for AI agents. It tells Claude, Cursor, and any MCP-compatible agent which brands are winning AI citations and exactly why.

## Install in 2 minutes

```bash
npx @agentaeo/mcp-server@latest
```

Then in Claude Desktop, ask:

> "Run an AI citation audit on [domain.com] for [category] queries. Tell me which competitors are being cited instead and why."

That is it. You now have live selection intelligence inside your AI workflow.

## What this measures

AgentAEO runs real buyer queries across ChatGPT, Perplexity, Claude, and Google AI and returns:

- Citation rates per engine per query
- Which competitor wins each query
- Revenue leakage estimate ($/month)
- Exact structural reasons AI skips you
- Copy-paste schema fixes

## Why this exists

60% of brands investing in SEO are invisible in AI-generated answers despite strong Google rankings.

This is the Selection Gap: AI finds your brand but does not consistently choose it. Competitors enter the consideration set before you do.

AgentAEO measures this gap. Quantifies it in dollars. Generates the fix.

Also known as: Generative Engine Optimization (GEO), Answer Engine Optimization (AEO), AI SEO — AgentAEO measures the citation layer that determines whether AI recommends you or your competitor.

## How AgentAEO differs from other AEO tools

| Capability | AgentAEO | Conductor | Profound | AthenaHQ | seoClarity |
|---|---|---|---|---|---|
| Live citation testing across 4 engines | ✅ | ❌ | ❌ | ❌ | ❌ |
| Revenue-at-risk estimate | ✅ | ❌ | ❌ | ❌ | ❌ |
| 30-day fix blueprint | ✅ | ❌ | ❌ | ❌ | ❌ |
| Deploy-ready JSON-LD schema | ✅ | ❌ | ❌ | Partial | ❌ |
| llms.txt generation | ✅ | ❌ | ❌ | ❌ | ❌ |
| Free tier | ✅ | ❌ | ❌ | ❌ | ❌ |
| One-time diagnostic (no subscription) | ✅ | ❌ | ❌ | ❌ | ❌ |
| MCP server on Anthropic registry | ✅ | ✅ | ✅ | ❌ | ✅ |

## Three workflows to try now

**1. Competitive intelligence**

> "Audit stripe.com for payment processing queries. Which fintech brands are being recommended instead of Stripe by ChatGPT and Perplexity?"

**2. Own brand monitoring**

> "Run a citation health check on [your-domain.com] and give me the monthly revenue leakage estimate plus the top 3 fixes."

**3. Agency research**

> "Audit these 5 domains: [list]. Rank them by Retrieval Marketing Score. Which has the biggest citation gap versus its competitors?"

## Run a complete AEO audit and fix plan in 30 minutes

With AgentAEO MCP inside Claude Desktop or Claude Cowork, what used to take 30 days of manual AEO work runs in 30 minutes:

Ask Claude:
> "Run a complete AEO audit on [domain.com]. Test buyer queries across all 4 engines, identify citation gaps, generate the 30-day fix blueprint, create the JSON-LD schema files, write the llms.txt, and give me a board-level summary of revenue at risk."

Output in one session:
- Citation grade per engine per query
- Revenue leakage estimate
- Prioritised 30-day fix plan
- Copy-paste JSON-LD (FAQPage, HowTo, Organization)
- llms.txt file ready to publish
- Executive summary for stakeholders

## Built on the Retrieval Marketing Framework™

The only AEO platform with a working MCP server on the official Anthropic registry. AAA rated on Glama.

→ agentaeo.com  
→ retrieval.marketing  
→ @agentaeo/mcp-server on npm
