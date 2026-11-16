import neo4j, { type Driver } from "neo4j-driver";
import { env } from "@/env";

let driver: Driver | null = null;

export function graphDriver(): Driver {
  if (!driver) {
    const e = env();
    const auth =
      e.HYDRADB_AUTH_SCHEME === "none"
        ? undefined
        : e.HYDRADB_AUTH_SCHEME === "bearer"
          ? neo4j.auth.bearer(e.HYDRADB_PASSWORD)
          : neo4j.auth.basic(e.HYDRADB_USER, e.HYDRADB_PASSWORD);

    driver = neo4j.driver(e.HYDRADB_URI, auth, {
      disableLosslessIntegers: true,
      maxConnectionPoolSize: 20,
      connectionAcquisitionTimeout: 15_000,
    });
  }
  return driver;
}

export async function runQuery(
  cypher: string,
  params: Record<string, unknown> = {},
  mode: "read" | "write" = "read",
): Promise<Record<string, unknown>[]> {
  const session = graphDriver().session();
  try {
    const work = async () => {
      const result = await session.run(cypher, params);
      return result.records.map((record) => record.toObject());
    };
    return mode === "write" ? await session.executeWrite(work) : await session.executeRead(work);
  } finally {
    await session.close();
  }
}

export async function verifyGraph(): Promise<{ ok: boolean; detail: string }> {
  try {
    await graphDriver().verifyConnectivity();
    return { ok: true, detail: "connected" };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "unknown error" };
  }
}

export async function closeGraph(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

export function nodeProps(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && "properties" in value) {
    const props = (value as { properties: Record<string, unknown> }).properties;
    return props ?? {};
  }
  return {};
}

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value.length === 0) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}
