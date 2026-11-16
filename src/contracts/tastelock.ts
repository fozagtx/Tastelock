import { z } from "zod";

export const CORRECTION_SCOPES = [
  "style",
  "architecture",
  "workflow",
  "tooling",
  "testing",
  "documentation",
  "security",
  "naming",
  "process",
  "general",
] as const;
export type CorrectionScope = (typeof CORRECTION_SCOPES)[number];

export const AGENT_KINDS = [
  "claude-code",
  "codex",
  "cursor",
  "cloud",
  "human",
  "other",
] as const;
export type AgentKind = (typeof AGENT_KINDS)[number];

export const CORRECTION_ORIGINS = ["ui", "mcp", "api"] as const;
export type CorrectionOrigin = (typeof CORRECTION_ORIGINS)[number];

export const CorrectionSchema = z.object({
  id: z.string(),
  scope: z.enum(CORRECTION_SCOPES),
  taskRef: z.string().nullable(),
  agent: z.string(),
  agentKind: z.enum(AGENT_KINDS),
  original: z.string().nullable(),
  corrected: z.string().nullable(),
  instruction: z.string().nullable(),
  author: z.string(),
  origin: z.enum(CORRECTION_ORIGINS),
  tags: z.array(z.string()),
  createdAt: z.string(),
});
export type Correction = z.infer<typeof CorrectionSchema>;

export const LEARNED_RULE_STATUSES = ["candidate", "validated", "retired"] as const;
export type LearnedRuleStatus = (typeof LEARNED_RULE_STATUSES)[number];

export const LearnedRuleSchema = z.object({
  id: z.string(),
  scope: z.enum(CORRECTION_SCOPES),
  text: z.string().min(1),
  status: z.enum(LEARNED_RULE_STATUSES),
  confidence: z.number().min(0).max(1),
  support: z.number().int().nonnegative(),
  derivedFrom: z.array(z.string()),
  supersedes: z.string().nullable(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  validatedBy: z.string().nullable(),
  validatedAt: z.string().nullable(),
});
export type LearnedRule = z.infer<typeof LearnedRuleSchema>;

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(AGENT_KINDS),
  lastSeenAt: z.string(),
  correctionCount: z.number().int().nonnegative(),
  ruleCount: z.number().int().nonnegative(),
});
export type Agent = z.infer<typeof AgentSchema>;

export const TasteLockExportSchema = z.object({
  generatedAt: z.string(),
  scope: z.enum(CORRECTION_SCOPES).nullable(),
  taskRef: z.string().nullable(),
  rules: z.array(LearnedRuleSchema),
  markdown: z.string(),
});
export type TasteLockExport = z.infer<typeof TasteLockExportSchema>;

export const LearningPassResultSchema = z.object({
  evaluatedCorrections: z.number().int().nonnegative(),
  candidates: z.array(LearnedRuleSchema),
  skippedDuplicates: z.number().int().nonnegative(),
  summary: z.string(),
});
export type LearningPassResult = z.infer<typeof LearningPassResultSchema>;

export const LearnedContextSchema = z.object({
  rules: z.array(LearnedRuleSchema),
  markdown: z.string(),
});
export type LearnedContext = z.infer<typeof LearnedContextSchema>;
