import { NextResponse } from "next/server";
import { env, servConfigured } from "@/env";
import { verifyGraph } from "@/graph/client";
import { stats } from "@/services/tastelock";

export async function GET(): Promise<NextResponse> {
  const [graph, tally] = await Promise.all([verifyGraph(), stats().catch(() => null)]);
  return NextResponse.json({
    graph,
    serv: {
      configured: servConfigured(),
      model: env().SERV_MODEL || null,
    },
    rules: tally?.rules ?? { validated: 0, candidates: 0, retired: 0 },
    corrections: tally?.corrections ?? 0,
  });
}
