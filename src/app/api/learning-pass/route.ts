import { LearningPassRequestSchema } from "@/contracts";
import { actorFrom, handle, json } from "@/lib/http";
import { runLearningPass } from "@/services/tastelock";

export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const body = LearningPassRequestSchema.parse(await request.json().catch(() => ({})));
    const result = await runLearningPass({
      scope: body.scope ?? null,
      taskRef: body.taskRef ?? null,
      author: body.author || actorFrom(request),
    });
    return json({ result });
  });
}
