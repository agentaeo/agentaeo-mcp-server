#!/usr/bin/env node
/**
 * @agentaeo/mcp-server — MCP server for AgentAEO
 * Run AEO audits across ChatGPT, Perplexity, Claude, and Google AI.
 *
 * Requires: AGENTAEO_API_KEY environment variable
 * Get your key at: https://agentaeo.com/agents
 *
 * Note: Claude Desktop often limits a *single tool call* to ~60s. `run_aeo_audit` therefore
 * returns immediately after the server accepts the job (HTTP 202 + auditId). The model must
 * call `check_aeo_audit_status` every 10–15s until `is_complete` / `free_preview_ready`.
 * Set AGENTAEO_MCP_INLINE_POLL=1 to embed polling inside run_aeo_audit (for clients with
 * longer tool timeouts only).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = "https://agentaeo-api.onrender.com";

function defaultKeyword(urlStr: string, kw?: string): string {
  const k = kw?.trim();
  if (k) return k;
  try {
    const host = new URL(urlStr).hostname.replace(/^www\./, "").split(".")[0];
    return host || "website";
  } catch {
    return "website";
  }
}

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
  const inlinePoll = process.env.AGENTAEO_MCP_INLINE_POLL === "1" || process.env.AGENTAEO_MCP_INLINE_POLL === "true";

  const server = new McpServer({
    name: "agentaeo",
    version: "0.1.4",
  });

  server.tool(
    "run_aeo_audit",
    "Start an AEO audit for a URL (async). Returns auditId immediately. Then call check_aeo_audit_status every 10–15s until is_complete or free_preview_ready (free tier stops at step 2).",
    {
      url: z.string().url().describe("The website URL to audit (e.g. https://example.com)"),
      keyword: z.string().optional().describe("Primary industry keyword; defaults from domain if omitted"),
      tier: z.enum(["free", "paid"]).optional().default("free").describe("Audit tier: free (8 queries) or paid (40 queries)"),
    },
    async ({ url, keyword, tier }) => {
      try {
        const kw = defaultKeyword(url, keyword);

        const tierVal = tier || "free";
        const res = await fetch(`${API_BASE}/api/aeo-audit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
            // Ensures Render applies admin paid bypass if body tier is lost by a proxy/client
            ...(String(tierVal).toLowerCase() === "paid"
              ? { "X-AgentAEO-Admin-Paid-Tier": "1" }
              : {}),
          },
          body: JSON.stringify({ url, keyword: kw, tier: tierVal, async: true }),
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
        if (!auditId) {
          return {
            content: [{ type: "text" as const, text: `Audit started but no auditId returned:\n${JSON.stringify(data, null, 2)}` }],
          };
        }

        const reportUrl = `https://agentaeo.com/audit/${auditId}/summary`;

        if (!inlinePoll) {
          const text =
            `✅ Audit job accepted (async).\n\n` +
            `auditId: ${auditId}\n` +
            `keyword used: ${kw}\n\n` +
            `Next: call tool **check_aeo_audit_status** every 10–15s: **free** tier → stop when **free_preview_ready**; **paid** tier → keep polling until **is_complete** (full report, step 5). If **paid_pipeline_pending** is true, the paid pipeline is still running — keep polling.\n\n` +
            `View report when ready: ${reportUrl}\n\n` +
            `Server response:\n${JSON.stringify(data, null, 2)}`;
          return { content: [{ type: "text" as const, text }] };
        }

        // Optional long poll (may exceed Claude Desktop ~60s tool limit)
        const POLL_INTERVAL_MS = 12000;
        const MAX_POLLS = 30;
        let lastStatus: Record<string, unknown> = {};

        for (let i = 0; i < MAX_POLLS; i++) {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

          const pollRes = await fetch(`${API_BASE}/api/aeo-status/${auditId}`, {
            method: "GET",
            headers: { "X-API-Key": apiKey },
          });
          const pollData = (await pollRes.json()) as Record<string, unknown>;
          lastStatus = pollData;

          const paidPipelinePending = (pollData?.paid_pipeline_pending as boolean) === true;
          const isComplete = (pollData?.is_complete as boolean) === true;
          const freePreviewReady = (pollData?.free_preview_ready as boolean) === true;
          const isTerminal = (pollData?.is_terminal as boolean) === true;

          if (paidPipelinePending) {
            continue;
          }
          if (isComplete || freePreviewReady || isTerminal) {
            const text =
              `✅ Audit complete!\n` +
              `auditId: ${auditId}\n` +
              `Status: ${pollData?.status ?? "free_preview"}\n` +
              `free_preview_ready: ${freePreviewReady}\n` +
              `View report: ${reportUrl}\n\n` +
              `Raw response:\n${JSON.stringify(pollData, null, 2)}`;
            return { content: [{ type: "text" as const, text }] };
          }
        }

        return {
          content: [{
            type: "text" as const,
            text: `Audit started (auditId: ${auditId}) but did not complete within 6 minutes.\nLast status:\n${JSON.stringify(lastStatus, null, 2)}\nUse check_aeo_audit_status with auditId "${auditId}" to continue polling.`,
          }],
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
    "Check status of an AEO audit. Poll until free_preview_ready (free) or is_complete at full report (paid). If paid_pipeline_pending is true, keep polling.",
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
        const freePreviewReady = (data?.free_preview_ready as boolean) === true;
        const paidPipelinePending = (data?.paid_pipeline_pending as boolean) === true;
        let text =
          `Status: ${status}\n` +
          `current_step: ${data?.current_step ?? "?"}\n` +
          `is_complete: ${isComplete}\n` +
          `free_preview_ready: ${freePreviewReady}\n` +
          `paid_pipeline_pending: ${paidPipelinePending}\n`;
        if (data?.score != null) text += `Score: ${data.score}\n`;
        if (data?.grade) text += `Grade: ${data.grade}\n`;
        text += `\nRaw response:\n${JSON.stringify(data, null, 2)}`;
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
