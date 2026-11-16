import { closeGraph, graphDriver, runQuery } from "@/graph/client";

const PROBE_ID = "tastelock_connection_probe";

async function main(): Promise<void> {
  const uri = graphDriver();

  console.log("Connecting to the graph...");
  await uri.verifyConnectivity();
  console.log("Connected.");

  const existing = await runQuery("MATCH (n) RETURN count(n) AS total");
  console.log(`Nodes currently in the graph: ${String(existing[0]?.total ?? 0)}`);

  await runQuery(
    "CREATE (p:Probe {id: $id, checkedAt: $checkedAt})",
    { id: PROBE_ID, checkedAt: new Date().toISOString() },
    "write",
  );

  const readBack = await runQuery("MATCH (p:Probe {id: $id}) RETURN p.id AS id, p.checkedAt AS checkedAt", {
    id: PROBE_ID,
  });

  if (readBack.length === 0) {
    throw new Error("Write succeeded but the probe node could not be read back.");
  }
  console.log(`Write and read verified: ${String(readBack[0]?.id)} at ${String(readBack[0]?.checkedAt)}`);

  await runQuery("MATCH (p:Probe {id: $id}) DELETE p", { id: PROBE_ID }, "write");
  console.log("Probe removed. Graph is ready for TasteLock.");
}

main()
  .then(async () => {
    await closeGraph();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("Graph check failed:", error instanceof Error ? error.message : error);
    await closeGraph();
    process.exit(1);
  });
