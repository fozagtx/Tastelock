import { ExportRequestSchema } from "@/contracts";
import { handle, json } from "@/lib/http";
import { exportBundle } from "@/services/tastelock";

export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const url = new URL(request.url);
    const scope = url.searchParams.get("scope");
    const taskRef = url.searchParams.get("taskRef");
    const includeCandidates = url.searchParams.get("includeCandidates") === "true";
    return json({
      bundle: await exportBundle({
        scope: (scope as never) ?? null,
        taskRef,
        includeCandidates,
      }),
    });
  });
}

export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const body = ExportRequestSchema.parse(await request.json().catch(() => ({})));
    return json({
      bundle: await exportBundle({
        scope: body.scope ?? null,
        taskRef: body.taskRef ?? null,
        includeCandidates: body.includeCandidates,
      }),
    });
  });
}
