import { RecordCorrectionRequestSchema } from "@/contracts";
import { actorFrom, handle, json } from "@/lib/http";
import { listCorrections, recordCorrection, searchCorrections } from "@/services/tastelock";

export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    if (query) {
      return json({ corrections: await searchCorrections(query, limit) });
    }

    const scope = url.searchParams.get("scope");
    const taskRef = url.searchParams.get("taskRef");
    return json({
      corrections: await listCorrections({
        scope: (scope as never) ?? null,
        taskRef,
        limit,
      }),
    });
  });
}

export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const body = RecordCorrectionRequestSchema.parse(await request.json());
    const correction = await recordCorrection({
      scope: body.scope,
      taskRef: body.taskRef ?? null,
      agent: body.agent,
      agentKind: body.agentKind,
      original: body.original ?? null,
      corrected: body.corrected ?? null,
      instruction: body.instruction ?? null,
      author: body.author || actorFrom(request),
      origin: body.origin,
      tags: body.tags,
    });
    return json({ correction }, 201);
  });
}
