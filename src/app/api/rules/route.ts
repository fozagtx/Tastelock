import { handle, json } from "@/lib/http";
import { listRules } from "@/services/tastelock";

export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const scope = url.searchParams.get("scope");
    return json({
      rules: await listRules({
        status: (status as never) ?? undefined,
        scope: (scope as never) ?? null,
      }),
    });
  });
}
