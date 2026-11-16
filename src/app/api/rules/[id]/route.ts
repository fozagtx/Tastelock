import { RuleDecisionRequestSchema } from "@/contracts";
import { handle, json } from "@/lib/http";
import { decideRule } from "@/services/tastelock";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const body = RuleDecisionRequestSchema.parse(await request.json());
    const rule = await decideRule(id, body.status, body.author);
    return json({ rule });
  });
}
