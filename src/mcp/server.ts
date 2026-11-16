import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { closeGraph } from "@/graph/client";
import { createTasteLockServer } from "./tools";

async function main(): Promise<void> {
  const server = createTasteLockServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TasteLock MCP server ready on stdio");
}

async function shutdown(): Promise<void> {
  await closeGraph();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

main().catch((error: unknown) => {
  console.error("TasteLock MCP server failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
