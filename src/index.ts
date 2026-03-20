#!/usr/bin/env node
/**
 * @agentaeo/mcp-server — MCP server for AgentAEO
 * Run AEO audits across ChatGPT, Perplexity, Claude, and Google AI.
 *
 * Requires: AGENTAEO_API_KEY environment variable
 * Get your key at: https://agentaeo.com/agents
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = "https://agentaeo-api.onrender.com";

function getApiKey(): string {
  const key = process.env.AGENTAEO_API_KEY?.trim();
  if (!key) {
    console.error(
      "[agentaeo-mcp-server] ERROR: AGENTAEO_API_KEY is required but not set.\n" +
        "Get your API key at https://agentaeo.com/agents and set it:\n" +
        "  export AGENTAEO_API_KEY=your_key_here\n" +
        "Or add it to your Claude Desktop config: env.AGENTAEO_API_KEY"
    );
    process.exit(1);
  }
  return key;
}

async function main() {
  const apiKey = getApiKey();

  const server = new McpServer({
    name: "agentaeo",
    version: "0.1.0",
  });

  server.tool(
    "run_aeo_audit",
    "Run an AEO audit for a URL. Tests visibility across ChatGPT, Perplexity, Claude, and Google AI. Free tier: 8 queries. Paid tier: 40 queries with full blueprint.",
    {
      url: z.string().url().describe("The website URL to audit (e.g. https://example.com)"),
      keyword: z.string().optional().describe("Primary industry keyword for query generation (e.g. payment API)"),
      tier: z.enum(["free", "paid"]).optional().default("free").describe("Audit tier: free (8 queries) or paid (40 queries)"),
    },
    async ({ url, keyword, tier }) => {
      try {
        const res = await fetch(`${API_BASE}/api/aeo-audit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
          },
          body: JSON.stringify({ url, keyword: keyword || "", tier: tier || "free" }),
        });
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) {
          const err = (data?.error as string) || (data?.message as string) || `HTTP ${res.status}`;
          return {
            content: [{ type: "text" as const, text: `Error: ${err}` }],
            isError: true,
          };
        }
        const auditId = (data?.auditId ?? data?.audit_id ?? data?.id) as string | undefined;
        const status = (data?.status as string) ?? "queued";
        const text = auditId
          ? `Audit started. auditId: ${auditId}\nStatus: ${status}\nUse check_aeo_audit_status with this auditId to poll for results.`
          : JSON.stringify(data, null, 2);
        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Error: ${msg}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "check_aeo_audit_status",
    "Check the status and results of an AEO audit. Poll this with the auditId returned from run_aeo_audit until status is completed.",
    {
      auditId: z.string().describe("The audit ID returned from run_aeo_audit"),
    },
    async ({ auditId }) => {
      try {
        const res = await fetch(`${API_BASE}/api/aeo-status/${auditId}`, {
          method: "GET",
          headers: {
            "X-API-Key": apiKey,
          },
        });
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) {
          const err = (data?.error as string) || (data?.message as string) || `HTTP ${res.status}`;
          return {
            content: [{ type: "text" as const, text: `Error: ${err}` }],
            isError: true,
          };
        }
        const status = (data?.status as string) ?? (data?.current_step != null ? "processing" : "unknown");
        const isComplete = (data?.is_complete as boolean) ?? (data?.status === "completed");
        const score = data?.score;
        const grade = data?.grade;
        let text = `Status: ${status}\nis_complete: ${isComplete}`;
        if (score != null) text += `\nScore: ${score}`;
        if (grade) text += `\nGrade: ${grade}`;
        if (isComplete && data?.findings) {
          text += `\n\nFull results:\n${JSON.stringify(data, null, 2)}`;
        } else {
          text += `\n\nRaw response:\n${JSON.stringify(data, null, 2)}`;
        }
        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Error: ${msg}` }],
          isError: true,
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("[agentaeo-mcp-server] Fatal:", err);
  process.exit(1);
});
