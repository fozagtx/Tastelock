import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ConflictError, NotFoundError } from "@/lib/errors";

export function json<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function failure(message: string, status = 400, code: string | null = null): NextResponse {
  return NextResponse.json({ error: { message, code } }, { status });
}

export async function handle(work: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof NotFoundError) {
      return failure(error.message, 404, "not_found");
    }
    if (error instanceof ConflictError) {
      return failure(error.message, 409, "conflict");
    }
    if (error instanceof ZodError) {
      return failure(
        error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; "),
        422,
        "validation_error",
      );
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return failure(message, 500, "internal_error");
  }
}

export function actorFrom(request: Request, fallback = "agent"): string {
  const header = request.headers.get("x-tastelock-actor");
  return header?.trim() || fallback;
}
