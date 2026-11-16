import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnv(): void {
  const candidate = join(REPO_ROOT, ".env");
  if (!existsSync(candidate)) return;
  try {
    process.loadEnvFile(candidate);
  } catch {
    // malformed .env - fall back to values already present in the environment
  }
}

const EnvSchema = z.object({
  HYDRADB_URI: z.string().default("neo4j://127.0.0.1:7687"),
  HYDRADB_USER: z.string().default("hydradb"),
  HYDRADB_PASSWORD: z.string().default("local-development-token-32-bytes"),
  HYDRADB_AUTH_SCHEME: z.enum(["basic", "bearer", "none"]).default("basic"),
  HYDRADB_NAMESPACE: z.string().default("default"),
  HYDRADB_GRAPH: z.string().default("default"),
  HYDRADB_CELL_ID: z.string().default("cell-0"),
  HYDRADB_DATABASE: z.string().default(""),

  SERV_BASE_URL: z.string().default(""),
  SERV_API_KEY: z.string().default(""),
  SERV_MODEL: z.string().default(""),
  SERV_RESPONSE_FORMAT: z.enum(["json_schema", "json_object"]).default("json_schema"),

  TASTELOCK_API_TOKEN: z.string().default("change-me-local-dev-token"),
});

export type ServerEnv = z.infer<typeof EnvSchema>;

let cached: ServerEnv | null = null;

export function env(): ServerEnv {
  if (!cached) {
    loadDotEnv();
    cached = EnvSchema.parse({
      HYDRADB_URI: process.env.HYDRADB_URI,
      HYDRADB_USER: process.env.HYDRADB_USER,
      HYDRADB_PASSWORD: process.env.HYDRADB_PASSWORD,
      HYDRADB_AUTH_SCHEME: process.env.HYDRADB_AUTH_SCHEME,
      HYDRADB_NAMESPACE: process.env.HYDRADB_NAMESPACE,
      HYDRADB_GRAPH: process.env.HYDRADB_GRAPH,
      HYDRADB_CELL_ID: process.env.HYDRADB_CELL_ID,
      HYDRADB_DATABASE: process.env.HYDRADB_DATABASE,
      SERV_BASE_URL: process.env.SERV_BASE_URL,
      SERV_API_KEY: process.env.SERV_API_KEY,
      SERV_MODEL: process.env.SERV_MODEL,
      SERV_RESPONSE_FORMAT: process.env.SERV_RESPONSE_FORMAT,
      TASTELOCK_API_TOKEN: process.env.TASTELOCK_API_TOKEN,
    });
  }
  return cached;
}

export function servConfigured(): boolean {
  const e = env();
  return Boolean(e.SERV_BASE_URL && e.SERV_API_KEY && e.SERV_MODEL);
}
