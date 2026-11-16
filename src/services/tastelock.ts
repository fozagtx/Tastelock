import {
  type Agent,
  type AgentKind,
  type Correction,
  type CorrectionOrigin,
  type CorrectionScope,
  type LearnedContext,
  type LearnedRule,
  type LearnedRuleStatus,
  type LearningPassResult,
  type TasteLockExport,
} from "@/contracts";
import * as repo from "@/graph/repositories";
import { newId, nowIso, slug } from "@/ids";
import { NotFoundError } from "@/lib/errors";
import { llm } from "@/providers/serv";

export type RecordCorrectionInput = {
  scope: CorrectionScope;
  taskRef?: string | null;
  agent?: string;
  agentKind?: AgentKind;
  original?: string | null;
  corrected?: string | null;
  instruction?: string | null;
  author?: string;
  origin?: CorrectionOrigin;
  tags?: string[];
};

export async function recordCorrection(input: RecordCorrectionInput): Promise<Correction> {
  const createdAt = nowIso();
  const agent = input.agent?.trim() || "unknown-agent";
  const correction: Correction = {
    id: newId("cor"),
    scope: input.scope,
    taskRef: input.taskRef?.trim() || null,
    agent,
    agentKind: input.agentKind ?? "other",
    original: input.original?.trim() || null,
    corrected: input.corrected?.trim() || null,
    instruction: input.instruction?.trim() || null,
    author: input.author?.trim() || agent,
    origin: input.origin ?? "api",
    tags: normaliseTags(input.tags ?? []),
    createdAt,
  };

  if (!correction.instruction && !correction.corrected && !correction.original) {
    throw new Error("A correction needs an instruction, a corrected output, or the original output.");
  }

  await repo.createCorrection(correction);
  await repo.recordAuditEvent({
    id: newId("audit"),
    action: "correction.recorded",
    actor: correction.author,
    targetType: "Correction",
    targetId: correction.id,
    detail: `${correction.scope} from ${correction.agent}`,
    createdAt,
  });

  return correction;
}

function normaliseTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => slug(tag)).filter((tag) => tag.length > 0))];
}

export async function listCorrections(options: {
  scope?: CorrectionScope | null;
  taskRef?: string | null;
  limit?: number;
} = {}): Promise<Correction[]> {
  return repo.listCorrections({
    scope: options.scope ?? undefined,
    taskRef: options.taskRef ?? undefined,
    limit: options.limit,
  });
}

export async function searchCorrections(query: string, limit = 10): Promise<Correction[]> {
  return repo.searchCorrections(query, limit);
}

export async function listRules(options: {
  status?: LearnedRuleStatus;
  scope?: CorrectionScope | null;
} = {}): Promise<LearnedRule[]> {
  return repo.listLearnedRules({
    status: options.status,
    scope: options.scope ?? undefined,
    limit: 300,
  });
}

export async function decideRule(
  ruleId: string,
  status: "validated" | "retired",
  author: string,
): Promise<LearnedRule> {
  const rule = await repo.getLearnedRule(ruleId);
  if (!rule) throw new NotFoundError(`Learned rule ${ruleId} not found`);

  await repo.setRuleStatus(ruleId, status, author);
  await repo.recordAuditEvent({
    id: newId("audit"),
    action: `rule.${status}`,
    actor: author,
    targetType: "LearnedRule",
    targetId: ruleId,
    detail: rule.text.slice(0, 200),
    createdAt: nowIso(),
  });

  const refreshed = await repo.getLearnedRule(ruleId);
  if (!refreshed) throw new NotFoundError(`Learned rule ${ruleId} disappeared`);
  return refreshed;
}

export async function listAgents(): Promise<Agent[]> {
  return repo.listAgents();
}

export async function stats(): Promise<{ rules: { validated: number; candidates: number; retired: number }; corrections: number }> {
  const [rules, corrections] = await Promise.all([repo.ruleCounts(), repo.countCorrections()]);
  return { rules, corrections };
}

export async function runLearningPass(input: {
  scope?: CorrectionScope | null;
  taskRef?: string | null;
  author: string;
}): Promise<LearningPassResult> {
  const corrections = await repo.listCorrections({
    scope: input.scope ?? undefined,
    taskRef: input.taskRef ?? undefined,
    limit: 100,
  });

  if (corrections.length === 0) {
    return {
      evaluatedCorrections: 0,
      candidates: [],
      skippedDuplicates: 0,
      summary: "No corrections recorded yet.",
    };
  }

  const existing = await repo.listLearnedRules({ limit: 300 });
  const provider = llm();
  const { output, model } = await provider.distil({ corrections, existingRules: existing });

  const created: LearnedRule[] = [];
  let skippedDuplicates = 0;

  for (const candidate of output.candidates) {
    const normalisedText = candidate.text.trim().toLowerCase();
    const duplicate = existing.some(
      (rule) => rule.status !== "retired" && rule.text.trim().toLowerCase() === normalisedText,
    );
    if (duplicate) {
      skippedDuplicates += 1;
      continue;
    }

    const derivedFrom = candidate.derivedFrom.filter((id) =>
      corrections.some((correction) => correction.id === id),
    );

    const rule: LearnedRule = {
      id: newId("rule"),
      scope: candidate.scope,
      text: candidate.text.trim(),
      status: "candidate",
      confidence: candidate.confidence,
      support: candidate.support || derivedFrom.length,
      derivedFrom,
      supersedes: null,
      tags: normaliseTags(candidate.tags),
      createdAt: nowIso(),
      validatedBy: null,
      validatedAt: null,
    };

    await repo.upsertLearnedRule(rule);
    created.push(rule);
  }

  await repo.recordAuditEvent({
    id: newId("audit"),
    action: "learning_pass.completed",
    actor: input.author,
    targetType: "LearnedRule",
    targetId: input.scope ?? input.taskRef ?? "all",
    detail: `${created.length} candidate(s) from ${corrections.length} correction(s) via ${model}`,
    createdAt: nowIso(),
  });

  return {
    evaluatedCorrections: corrections.length,
    candidates: created,
    skippedDuplicates,
    summary: output.summary,
  };
}

export function rulesToMarkdown(rules: LearnedRule[], header = "TasteLock"): string {
  if (rules.length === 0) {
    return `# ${header}\n\nNo validated rules yet.`;
  }

  const byScope = new Map<string, LearnedRule[]>();
  for (const rule of rules) {
    const bucket = byScope.get(rule.scope) ?? [];
    bucket.push(rule);
    byScope.set(rule.scope, bucket);
  }

  const lines: string[] = [
    `# ${header}`,
    "",
    `${rules.length} validated rule(s). Apply these before starting work.`,
  ];

  for (const [scope, scopeRules] of byScope) {
    lines.push("", `## ${scope}`);
    for (const rule of scopeRules) {
      lines.push(`- ${rule.text}`);
    }
  }

  return lines.join("\n");
}

export async function getLearnedContext(input: {
  scope?: CorrectionScope | null;
  task?: string | null;
}): Promise<LearnedContext> {
  const validated = await repo.listLearnedRules({ status: "validated", limit: 300 });
  const task = input.task?.trim().toLowerCase();

  const rules = validated.filter((rule) => {
    if (input.scope && rule.scope !== input.scope) return false;
    if (!task) return true;
    return `${rule.scope} ${rule.text} ${rule.tags.join(" ")}`.toLowerCase().includes(task);
  });

  return { rules, markdown: rulesToMarkdown(rules) };
}

export async function exportBundle(options: {
  scope?: CorrectionScope | null;
  taskRef?: string | null;
  includeCandidates?: boolean;
}): Promise<TasteLockExport> {
  const all = await repo.listLearnedRules({ scope: options.scope ?? undefined, limit: 300 });
  const rules = all.filter((rule) =>
    options.includeCandidates ? rule.status !== "retired" : rule.status === "validated",
  );

  const title = options.taskRef ? `TasteLock — ${options.taskRef}` : "TasteLock";
  return {
    generatedAt: nowIso(),
    scope: options.scope ?? null,
    taskRef: options.taskRef ?? null,
    rules,
    markdown: rulesToMarkdown(rules, title),
  };
}
