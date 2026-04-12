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
 *
 * Content Suite: **generate_aeo_content_suite** sends `async: true` (HTTP 202 + orderId) so the
 * tool returns under ~60s; poll **check_aeo_content_suite_status** every 15–30s (generation often
 * 5–25+ min). AGENTAEO_MCP_INLINE_CONTENT_POLL=1 embeds polling (long tool call). Same
 * AGENTAEO_API_KEY as audits — no shell/curl (works in VM sandboxes that cannot read Desktop config).
 */

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
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
  const inlineContentPoll =
    process.env.AGENTAEO_MCP_INLINE_CONTENT_POLL === "1" || process.env.AGENTAEO_MCP_INLINE_CONTENT_POLL === "true";

  const server = new McpServer({
    name: "agentaeo",
    version: "0.1.9",
  });

  server.registerResource(
    "agentaeo-workflow",
    "agentaeo://workflow",
    {
      title: "AgentAEO MCP workflow",
      description:
        "Static guide: recommended order for audits and optional content suite (audit → poll → generate → poll → download).",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: [
            "# AgentAEO MCP workflow",
            "",
            "## Step 1 — Audit",
            "1. Call **run_aeo_audit** with `url` (required), optional `keyword`, optional `tier` (`free` = 8 queries preview, `paid` = 40 queries full report).",
            "2. You receive an **auditId** immediately (async job). This tool does not return the full report.",
            "",
            "## Step 2 — Poll audit",
            "3. Call **check_aeo_audit_status** with that **auditId** every **10–15 seconds** until the job is done.",
            "4. For **free** tier, stop when the preview is ready (see response fields such as `free_preview_ready`). For **paid**, keep polling until the full report is complete (`is_complete` / terminal success). If `paid_pipeline_pending` is true, keep polling.",
            "5. If status indicates failure, stop polling.",
            "",
            "## Step 3 — Optional content suite (paid tier)",
            "6. Only after the audit is successfully complete: call **generate_aeo_content_suite** with **auditId** (and `orderId` after purchase, or `adminContentBypass` only when AgentAEO support tells you to).",
            "7. You receive an **orderId** (async). Call **check_aeo_content_suite_status** every **30 seconds** until status is completed or failed.",
            "8. When completed: call **download_aeo_content_suite_zip** with **orderId** to save the ZIP (optional `outputFileName`; directory from `AGENTAEO_MCP_DOWNLOAD_DIR` or current working directory).",
            "",
            "Do not confuse **check_aeo_audit_status** (audit pipeline) with **check_aeo_content_suite_status** (content generation).",
          ].join("\n"),
        },
      ],
    })
  );

  server.tool(
    "run_aeo_audit",
    [
      "Initiates an asynchronous AEO (Answer Engine Optimization) audit for a given URL.",
      "The audit measures the brand's AI citation rate, structured data health, and content gaps across ChatGPT, Perplexity, Claude, and Google AI.",
      "",
      "Returns an auditId string. ALWAYS follow up with check_aeo_audit_status using that auditId — this tool does not return results directly.",
      "",
      "Parameters:",
      '- url (string, required): The full URL to audit (e.g. "https://example.com"). Must include protocol. Homepage or key landing pages work best.',
      '- keyword (string, optional): Primary target keyword for the audit (e.g. "AI search visibility"). Defaults to topic inferred from the page.',
      '- tier (string, optional): "free" (8 queries, preview report) or "paid" (40 queries, full 9-page report). Defaults to "free".',
      "",
      "Typical flow: run_aeo_audit → check_aeo_audit_status (poll every 10s) → optionally generate_aeo_content_suite.",
    ].join("\n"),
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
    [
      "Polls the status of a previously initiated AEO audit. Call this repeatedly every 10–15 seconds after run_aeo_audit until the audit is finished (success or failure per response fields).",
      "",
      "Returns full audit results when complete: AEO health score (0–100), citation rate per AI engine, structured data gaps, and content recommendations.",
      "Free tier returns a preview; paid tier returns the full report.",
      "",
      "Parameters:",
      "- auditId (string, required): The audit identifier returned by run_aeo_audit.",
      "",
      "Do NOT call this without a valid auditId. If status is still processing, wait 10 seconds and poll again. Stop polling if the response indicates failure.",
    ].join("\n"),
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

  server.tool(
    "check_aeo_content_suite_status",
    [
      "Polls the status of a content suite generation job. Call every 30 seconds after generate_aeo_content_suite until status is completed or failed.",
      "",
      "Returns a download-ready orderId and content summary when complete.",
      "",
      "Parameters:",
      "- orderId (string, required): The order identifier returned by generate_aeo_content_suite.",
      "",
      "Do NOT confuse with check_aeo_audit_status — this polls content generation, not audit processing. Stop polling if status is failed.",
    ].join("\n"),
    {
      orderId: z.string().describe("orderid returned from generate_aeo_content_suite"),
    },
    async ({ orderId }) => {
      try {
        const oid = orderId.trim();
        if (!oid) {
          return {
            content: [{ type: "text" as const, text: "Error: orderId is required" }],
            isError: true,
          };
        }
        const res = await fetch(`${API_BASE}/api/aeo-content-status/${encodeURIComponent(oid)}`, {
          method: "GET",
          headers: { "X-API-Key": apiKey },
        });
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) {
          const err = (data?.error as string) || (data?.message as string) || `HTTP ${res.status}`;
          return {
            content: [{ type: "text" as const, text: `Error: ${err}\n\n${JSON.stringify(data, null, 2)}` }],
            isError: true,
          };
        }
        const status = (data?.status as string) ?? "unknown";
        const downloadUrl = data?.download_url as string | null | undefined;
        let text =
          `orderid: ${data?.orderid ?? oid}\n` +
          `status: ${status}\n` +
          (downloadUrl ? `download_url: ${downloadUrl}\n` : "") +
          `\nWhen status is **completed**, GET the ZIP with the same X-API-Key (see download_url).\n\n` +
          `Raw response:\n${JSON.stringify(data, null, 2)}`;
        return { content: [{ type: "text" as const, text }] };
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
    "download_aeo_content_suite_zip",
    [
      "Downloads the completed AEO content suite as a ZIP file to the local filesystem.",
      "Only call after check_aeo_content_suite_status returns status completed.",
      "",
      "The ZIP contains: FAQ JSON-LD schema, HowTo schema, Article schema, structured answer blocks (HTML + plain text), entity definition file, and a content brief.",
      "",
      "Parameters:",
      "- orderId (string, required): Order ID from a completed content suite job.",
      "- outputFileName (string, optional): Filename for the ZIP (default: content-suite-<prefix>.zip).",
      "Save directory: set AGENTAEO_MCP_DOWNLOAD_DIR or defaults to the current working directory.",
    ].join("\n"),
    {
      orderId: z.string().describe("orderid UUID from generate_aeo_content_suite / check_aeo_content_suite_status"),
      outputFileName: z
        .string()
        .optional()
        .describe("Optional filename, e.g. content-stripe.zip (default: content-suite-<first8ofuuid>.zip)"),
    },
    async ({ orderId, outputFileName }) => {
      try {
        const oid = orderId.trim();
        if (!oid) {
          return {
            content: [{ type: "text" as const, text: "Error: orderId is required" }],
            isError: true,
          };
        }
        const name = (outputFileName?.trim() || `content-suite-${oid.replace(/-/g, "").slice(0, 8)}.zip`) as string;
        const dir = (process.env.AGENTAEO_MCP_DOWNLOAD_DIR || "").trim() || process.cwd();
        mkdirSync(dir, { recursive: true });

        const res = await fetch(`${API_BASE}/api/aeo-content-download/${encodeURIComponent(oid)}`, {
          method: "GET",
          headers: { "X-API-Key": apiKey },
        });
        if (!res.ok) {
          const errBody = await res.text();
          return {
            content: [
              {
                type: "text" as const,
                text:
                  `HTTP ${res.status} downloading ZIP.\n` +
                  (res.status === 403
                    ? "If this persists, ensure Render has the latest backend (portal Agent API key allowed on GET /api/aeo-content-download).\n"
                    : "") +
                  `\nBody (truncated): ${errBody.slice(0, 800)}`,
              },
            ],
            isError: true,
          };
        }
        const buf = Buffer.from(await res.arrayBuffer());
        const outPath = join(dir, name);
        writeFileSync(outPath, buf);
        return {
          content: [
            {
              type: "text" as const,
              text:
                `✅ Saved **${buf.length}** bytes to:\n\`${outPath}\`\n\n` +
                `Unzip to inspect HTML, JSON-LD, llms.txt, README.`,
            },
          ],
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
    "generate_aeo_content_suite",
    [
      "Generates a 9-page AEO content suite based on a completed audit. The suite includes FAQ schema, structured answer blocks, entity definitions, and AI-optimised page content ready for publication.",
      "",
      "This is an async operation — returns an orderId. ALWAYS follow up with check_aeo_content_suite_status using that orderId.",
      "",
      "Parameters:",
      '- auditId (string, required): Must be from a COMPLETED audit (check_aeo_audit_status must show the audit finished successfully).',
      "- adminContentBypass (boolean, optional): Internal QA mode. Do not set unless instructed by AgentAEO support.",
      "- orderId (string, optional): Required for normal users after Cashfree content purchase.",
      '- packageType (string, optional): "full" or "faq". Defaults to "full".',
      "",
      "Typical time to complete: 5–25 minutes. Only works with paid-tier audits.",
    ].join("\n"),
    {
      auditId: z.string().describe("Completed audit id (e.g. aud_xxx_timestamp)"),
      packageType: z.enum(["full", "faq"]).optional().default("full").describe("Content bundle type"),
      orderId: z
        .string()
        .optional()
        .describe("UUID from aeo_content_orders after $499 payment. Required when adminContentBypass is false."),
      adminContentBypass: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "If true: omit orderId; server creates aeo_content_orders (admin/allowlisted key + X-AgentAEO-Admin-Content). For internal QA only."
        ),
    },
    async ({ auditId, packageType, orderId, adminContentBypass }) => {
      try {
        const adminBypass = adminContentBypass === true;
        if (!adminBypass && (!orderId || !orderId.trim())) {
          return {
            content: [
              {
                type: "text" as const,
                text:
                  "Error: either pass orderId (after Cashfree content purchase) or set adminContentBypass=true for admin testing.",
              },
            ],
            isError: true,
          };
        }
        const pkg = packageType || "full";
        const body: Record<string, unknown> = {
          auditid: auditId.trim(),
          packagetype: pkg,
          async: true,
        };
        if (orderId && orderId.trim() && !adminBypass) {
          body.orderid = orderId.trim();
        }
        if (adminBypass) {
          body.admin_content_bypass = true;
        }

        const res = await fetch(`${API_BASE}/api/aeo-generate-content`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
            ...(adminBypass ? { "X-AgentAEO-Admin-Content": "1" } : {}),
          },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) {
          const err = (data?.error as string) || (data?.message as string) || `HTTP ${res.status}`;
          return {
            content: [{ type: "text" as const, text: `Error: ${err}\n\n${JSON.stringify(data, null, 2)}` }],
            isError: true,
          };
        }

        const resolvedOrderId = String(data?.orderid ?? data?.order_id ?? "").trim();
        const syncStatus = String(data?.status ?? "").toLowerCase();

        // Sync path: already complete or idempotent "already generating" (HTTP 200)
        if (res.status === 200) {
          if (syncStatus === "completed" && data?.downloadurl) {
            const text =
              `✅ Content Suite already complete.\n\n` +
              `orderid: ${resolvedOrderId}\n` +
              `auditid: ${data?.auditid ?? auditId}\n` +
              `download (GET with same X-API-Key): ${API_BASE}${data?.downloadurl}\n\n` +
              `Full JSON:\n${JSON.stringify(data, null, 2)}`;
            return { content: [{ type: "text" as const, text }] };
          }
          if (syncStatus === "generating" && resolvedOrderId) {
            if (!inlineContentPoll) {
              const text =
                `✅ Content generation already in progress (or accepted).\n\n` +
                `orderid: ${resolvedOrderId}\n\n` +
                `Next: call **check_aeo_content_suite_status** every 15–30s until status is **completed**.\n\n` +
                `Server response:\n${JSON.stringify(data, null, 2)}`;
              return { content: [{ type: "text" as const, text }] };
            }
            // fall through to inline poll using resolvedOrderId
          } else if (!resolvedOrderId) {
            const text = `Unexpected 200 response:\n${JSON.stringify(data, null, 2)}`;
            return { content: [{ type: "text" as const, text }] };
          }
        }

        // HTTP 202 async accepted — or inline poll from "generating" 200
        if (res.status === 202 || (inlineContentPoll && resolvedOrderId && (res.status === 202 || syncStatus === "generating"))) {
          const oid = resolvedOrderId;
          if (!oid) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Async response missing orderid:\n${JSON.stringify(data, null, 2)}`,
                },
              ],
              isError: true,
            };
          }

          if (!inlineContentPoll) {
            const text =
              `✅ Content Suite job accepted (**async**).\n\n` +
              `orderid: ${oid}\n` +
              `auditid: ${data?.auditid ?? auditId}\n\n` +
              `Next: call **check_aeo_content_suite_status** every 15–30s until status is **completed** or **failed** (often 5–25+ minutes).\n` +
              (data?.pollUrl ? `Poll URL: ${data.pollUrl}\n` : "") +
              `\nServer response:\n${JSON.stringify(data, null, 2)}`;
            return { content: [{ type: "text" as const, text }] };
          }

          const POLL_INTERVAL_MS = 20000;
          const MAX_POLLS = 150;
          let last: Record<string, unknown> = {};

          for (let i = 0; i < MAX_POLLS; i++) {
            if (i > 0) await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

            const pollRes = await fetch(`${API_BASE}/api/aeo-content-status/${encodeURIComponent(oid)}`, {
              method: "GET",
              headers: { "X-API-Key": apiKey },
            });
            last = (await pollRes.json()) as Record<string, unknown>;
            if (!pollRes.ok) break;

            const st = String(last?.status ?? "").toLowerCase();
            if (st === "failed") {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Content generation failed for order ${oid}.\n\n${JSON.stringify(last, null, 2)}`,
                  },
                ],
                isError: true,
              };
            }
            if (st === "completed") {
              const du = (last?.download_url as string) || `${API_BASE}/api/aeo-content-download/${oid}`;
              const text =
                `✅ Content Suite generation finished.\n\n` +
                `orderid: ${oid}\n` +
                `download (GET with same X-API-Key): ${du}\n\n` +
                `Last poll:\n${JSON.stringify(last, null, 2)}`;
              return { content: [{ type: "text" as const, text }] };
            }
          }

          return {
            content: [
              {
                type: "text" as const,
                text:
                  `Content job started (orderid: ${oid}) but did not complete within ~50 minutes of polling.\n` +
                  `Last status:\n${JSON.stringify(last, null, 2)}\n\n` +
                  `Use **check_aeo_content_suite_status** with orderId "${oid}" to continue.`,
              },
            ],
          };
        }

        // Synchronous completion (HTTP 200 full result — e.g. server without async or legacy)
        const text =
          `✅ Content Suite generation finished.\n\n` +
          `orderid: ${data?.orderid ?? "?"}\n` +
          `auditid: ${data?.auditid ?? auditId}\n` +
          `pages: ${data?.pagesgenerated ?? "?"}\n` +
          `download (use same X-API-Key as GET): ${API_BASE}${data?.downloadurl ?? ""}\n\n` +
          `Full JSON:\n${JSON.stringify(data, null, 2)}`;
        return { content: [{ type: "text" as const, text }] };
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
