import { z } from "zod";
import { GraphViewSchema } from "./graph";
import {
  AgentSchema,
  AGENT_KINDS,
  CORRECTION_ORIGINS,
  CORRECTION_SCOPES,
  CorrectionSchema,
  LearnedContextSchema,
  LearnedRuleSchema,
  LearningPassResultSchema,
  TasteLockExportSchema,
} from "./tastelock";

export const RecordCorrectionRequestSchema = z.object({
  scope: z.enum(CORRECTION_SCOPES),
  taskRef: z.string().nullable().optional(),
  agent: z.string().default("api"),
  agentKind: z.enum(AGENT_KINDS).default("other"),
  original: z.string().nullable().optional(),
  corrected: z.string().nullable().optional(),
  instruction: z.string().nullable().optional(),
  author: z.string().default("api"),
  origin: z.enum(CORRECTION_ORIGINS).default("api"),
  tags: z.array(z.string()).default([]),
});
export type RecordCorrectionRequest = z.infer<typeof RecordCorrectionRequestSchema>;

export const CorrectionResponseSchema = z.object({ correction: CorrectionSchema });
export const CorrectionsListResponseSchema = z.object({ corrections: z.array(CorrectionSchema) });
export const RulesListResponseSchema = z.object({ rules: z.array(LearnedRuleSchema) });
export const AgentsListResponseSchema = z.object({ agents: z.array(AgentSchema) });
export const LearnedContextResponseSchema = LearnedContextSchema;

export const LearningPassRequestSchema = z.object({
  scope: z.enum(CORRECTION_SCOPES).nullable().optional(),
  taskRef: z.string().nullable().optional(),
  author: z.string().default("api"),
});
export type LearningPassRequest = z.infer<typeof LearningPassRequestSchema>;
export const LearningPassResponseSchema = z.object({ result: LearningPassResultSchema });

export const RuleDecisionRequestSchema = z.object({
  status: z.enum(["validated", "retired"]),
  author: z.string().default("api"),
});
export type RuleDecisionRequest = z.infer<typeof RuleDecisionRequestSchema>;

export const ExportRequestSchema = z.object({
  scope: z.enum(CORRECTION_SCOPES).nullable().optional(),
  taskRef: z.string().nullable().optional(),
  includeCandidates: z.boolean().default(false),
});
export type ExportRequest = z.infer<typeof ExportRequestSchema>;
export const ExportResponseSchema = z.object({ bundle: TasteLockExportSchema });

export const GraphResponseSchema = z.object({ graph: GraphViewSchema });

export const HealthResponseSchema = z.object({
  graph: z.object({ ok: z.boolean(), detail: z.string() }),
  serv: z.object({ configured: z.boolean(), model: z.string().nullable() }),
  rules: z.object({
    validated: z.number().int(),
    candidates: z.number().int(),
    retired: z.number().int(),
  }),
  corrections: z.number().int(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({ message: z.string(), code: z.string().nullable() }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
