import { z } from "zod";
import {
  AgentSchema,
  AGENT_KINDS,
  CORRECTION_SCOPES,
  CorrectionSchema,
  LearnedRuleSchema,
  TasteLockExportSchema,
} from "./tastelock";

export const MCP_TOOLS = [
  "get_learned_context",
  "record_correction",
  "record_feedback",
  "list_corrections",
  "search_corrections",
  "list_rules",
  "run_learning_pass",
  "decide_rule",
  "export_tastelock",
] as const;
export type McpToolName = (typeof MCP_TOOLS)[number];

export const GetLearnedContextInputSchema = z.object({
  scope: z.enum(CORRECTION_SCOPES).nullable().optional(),
  task: z.string().nullable().optional(),
});
export const GetLearnedContextOutputSchema = z.object({
  rules: z.array(LearnedRuleSchema),
  markdown: z.string(),
});

export const RecordCorrectionInputSchema = z.object({
  scope: z.enum(CORRECTION_SCOPES),
  instruction: z.string().min(1),
  original: z.string().nullable().optional(),
  corrected: z.string().nullable().optional(),
  taskRef: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  agent: z.string().default("mcp"),
  agentKind: z.enum(AGENT_KINDS).default("other"),
});
export const RecordCorrectionOutputSchema = z.object({
  correctionId: z.string(),
  recorded: z.boolean(),
});

export const RecordFeedbackInputSchema = z.object({
  instruction: z.string().min(1),
  scope: z.enum(CORRECTION_SCOPES).default("general"),
  taskRef: z.string().nullable().optional(),
  agent: z.string().default("mcp"),
  agentKind: z.enum(AGENT_KINDS).default("other"),
});
export const RecordFeedbackOutputSchema = z.object({
  correctionId: z.string(),
  recorded: z.boolean(),
});

export const ListCorrectionsInputSchema = z.object({
  scope: z.enum(CORRECTION_SCOPES).nullable().optional(),
  taskRef: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(100).default(25),
});
export const ListCorrectionsOutputSchema = z.object({ corrections: z.array(CorrectionSchema) });

export const SearchCorrectionsInputSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(50).default(10),
});
export const SearchCorrectionsOutputSchema = z.object({ corrections: z.array(CorrectionSchema) });

export const ListRulesInputSchema = z.object({
  status: z.enum(["candidate", "validated", "retired"]).optional(),
  scope: z.enum(CORRECTION_SCOPES).nullable().optional(),
});
export const ListRulesOutputSchema = z.object({ rules: z.array(LearnedRuleSchema) });

export const RunLearningPassInputSchema = z.object({
  scope: z.enum(CORRECTION_SCOPES).nullable().optional(),
  taskRef: z.string().nullable().optional(),
});
export const RunLearningPassOutputSchema = z.object({
  evaluatedCorrections: z.number().int(),
  candidates: z.array(LearnedRuleSchema),
  skippedDuplicates: z.number().int(),
  summary: z.string(),
});

export const DecideRuleInputSchema = z.object({
  ruleId: z.string(),
  status: z.enum(["validated", "retired"]),
  author: z.string().default("mcp"),
});
export const DecideRuleOutputSchema = z.object({ rule: LearnedRuleSchema });

export const ExportTasteLockInputSchema = z.object({
  scope: z.enum(CORRECTION_SCOPES).nullable().optional(),
  includeCandidates: z.boolean().default(false),
});
export const ExportTasteLockOutputSchema = z.object({ bundle: TasteLockExportSchema });

export const RegisterAgentInputSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(AGENT_KINDS).default("other"),
});
export const RegisterAgentOutputSchema = z.object({ agent: AgentSchema });
