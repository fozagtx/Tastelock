async function call<T>(method: "GET" | "POST" | "PATCH", path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const payload = text.length > 0 ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: { message?: string } }).error?.message ?? "request failed")
        : `request failed with status ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

export const browserApi = {
  get: <T>(path: string) => call<T>("GET", path),
  post: <T>(path: string, body?: unknown) => call<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => call<T>("PATCH", path, body),
};

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
