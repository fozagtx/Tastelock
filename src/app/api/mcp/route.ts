import { timingSafeEqual } from "node:crypto";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { env } from "@/env";
import { createTasteLockServer } from "@/mcp/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonRpcError(status: number, code: number, message: string): Response {
  return Response.json({ jsonrpc: "2.0", error: { code, message }, id: null }, { status });
}

function authorised(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  const expected = env().TASTELOCK_API_TOKEN;
  if (provided.length === 0 || expected.length === 0) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request): Promise<Response> {
  if (!authorised(request)) {
    return jsonRpcError(401, -32001, "Unauthorized. Send Authorization: Bearer <TASTELOCK_API_TOKEN>.");
  }

  const server = createTasteLockServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
  await server.connect(transport);

  try {
    return await transport.handleRequest(request);
  } finally {
    await transport.close();
    await server.close();
  }
}

export function GET(): Response {
  return jsonRpcError(405, -32000, "This endpoint accepts POST only (stateless MCP over JSON).");
}

export function DELETE(): Response {
  return jsonRpcError(405, -32000, "This endpoint is stateless and holds no sessions to delete.");
}
