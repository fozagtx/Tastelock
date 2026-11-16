import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/env";
import { DistilOutputSchema, type DistilInput, type DistilResult, type LlmProvider } from "./llm";
import { distilSystemPrompt, distilUserPrompt } from "./prompts";

type JsonSchemaRequest = {
  type: "json_schema" | "json_object";
  json_schema?: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
};

export class ServProvider implements LlmProvider {
  readonly name = "serv";

  private readonly client: OpenAI;
  private readonly model: string;
  private readonly responseFormat: "json_schema" | "json_object";

  constructor(config: {
    baseURL: string;
    apiKey: string;
    model: string;
    responseFormat: "json_schema" | "json_object";
  }) {
    this.client = new OpenAI({ baseURL: config.baseURL, apiKey: config.apiKey });
    this.model = config.model;
    this.responseFormat = config.responseFormat;
  }

  private format<T>(schema: z.ZodType<T>, name: string): JsonSchemaRequest {
    if (this.responseFormat === "json_object") {
      return { type: "json_object" };
    }
    return {
      type: "json_schema",
      json_schema: {
        name,
        strict: true,
        schema: z.toJSONSchema(schema) as Record<string, unknown>,
      },
    };
  }

  async distil(input: DistilInput): Promise<DistilResult> {
    const schema = DistilOutputSchema;
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      messages: [
        { role: "system", content: distilSystemPrompt() },
        { role: "user", content: distilUserPrompt(input.corrections, input.existingRules) },
      ],
      response_format: this.format(schema, "tastelock_rule_distillation") as never,
    });

    const content = response.choices[0]?.message?.content ?? "";
    if (content.trim().length === 0) {
      throw new Error("SERV returned an empty response for the learning pass");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error(`SERV returned non-JSON output for the learning pass: ${content.slice(0, 400)}`);
    }

    const validated = schema.safeParse(parsed);
    if (!validated.success) {
      throw new Error(
        `SERV learning-pass output failed schema validation: ${validated.error.issues
          .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
          .join("; ")}`,
      );
    }

    return { output: validated.data, model: response.model ?? this.model };
  }
}

export function llm(): LlmProvider {
  const e = env();
  const missing: string[] = [];
  if (!e.SERV_BASE_URL) missing.push("SERV_BASE_URL");
  if (!e.SERV_API_KEY) missing.push("SERV_API_KEY");
  if (!e.SERV_MODEL) missing.push("SERV_MODEL");
  if (missing.length > 0) {
    throw new Error(
      `SERV reasoning engine is not configured (missing ${missing.join(", ")}). Set the SERV_* variables in .env and restart.`,
    );
  }
  return new ServProvider({
    baseURL: e.SERV_BASE_URL,
    apiKey: e.SERV_API_KEY,
    model: e.SERV_MODEL,
    responseFormat: e.SERV_RESPONSE_FORMAT,
  });
}
