import { CORRECTION_SCOPES, type Correction, type LearnedRule } from "@/contracts";

export function distilSystemPrompt(): string {
  return [
    "You turn human and agent corrections into durable working rules for AI coding agents.",
    "A correction records what an agent got wrong (original), what the human wanted instead (corrected), or an explicit instruction.",
    "Produce candidate rules that would prevent the same correction from recurring across any agent - Claude Code, Codex, Cursor or a cloud agent.",
    `Each candidate rule must use exactly one of these scopes: ${CORRECTION_SCOPES.join(", ")}.`,
    "Write each rule as a direct instruction to an agent, in one sentence, with no hedging.",
    "Only propose a rule supported by at least two corrections, or by a single correction that states an explicit instruction.",
    "Never restate a rule that already exists in the provided rule list - skip it instead.",
    "Set support to the number of corrections backing the rule and list their ids in derivedFrom.",
    "Confidence is your calibrated certainty between 0 and 1. Tags are short lowercase topical labels.",
  ].join("\n");
}

export function distilUserPrompt(corrections: Correction[], existingRules: LearnedRule[]): string {
  const correctionBlocks = corrections.map((correction) => {
    const lines = [
      `id: ${correction.id}`,
      `scope: ${correction.scope}`,
      `agent: ${correction.agent} (${correction.agentKind})`,
      `author: ${correction.author} via ${correction.origin}`,
    ];
    if (correction.taskRef) lines.push(`task: ${correction.taskRef}`);
    if (correction.tags.length > 0) lines.push(`tags: ${correction.tags.join(", ")}`);
    if (correction.original) lines.push(`agent did: ${correction.original}`);
    if (correction.corrected) lines.push(`should have done: ${correction.corrected}`);
    if (correction.instruction) lines.push(`instruction: ${correction.instruction}`);
    lines.push(`recorded: ${correction.createdAt}`);
    return lines.join("\n");
  });

  const ruleList =
    existingRules.length === 0
      ? "none"
      : existingRules
          .map((rule) => `- [${rule.status}/${rule.scope}] ${rule.text}`)
          .join("\n");

  return [
    "Corrections to review:",
    correctionBlocks.join("\n\n"),
    "",
    "Existing rules (do not duplicate these):",
    ruleList,
  ].join("\n");
}
