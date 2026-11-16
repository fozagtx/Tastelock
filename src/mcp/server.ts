import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  DecideRuleInputSchema,
  ExportTasteLockInputSchema,
  GetLearnedContextInputSchema,
  ListCorrectionsInputSchema,
  ListRulesInputSchema,
  RecordCorrectionInputSchema,
  RecordFeedbackInputSchema,
  RunLearningPassInputSchema,
  SearchCorrectionsInputSchema,
} from "@/contracts";
import { closeGraph } from "@/graph/client";
import {
  decideRule,
  exportBundle,
  getLearnedContext,
  listCorrections,
  listRules,
  recordCorrection,
  runLearningPass,
  searchCorrections,
} from "@/services/tastelock";

const server = new McpServer({ name: "tastelock", version: "0.1.0" });

function text(value: string) {
  return { content: [{ type: "text" as const, text: value }] };
}

function jsonText(value: unknown) {
  return text(JSON.stringify(value, null, 2));
}

server.registerTool(
  "get_learned_context",
  {
    title: "Get learned context",
    description:
      "Read the validated TasteLock rules for a task BEFORE starting work. Call this at the beginning of any task so you follow what the user has already corrected. Returns the rules plus a markdown block to apply.",
    inputSchema: GetLearnedContextInputSchema.shape,
  },
  async (args) => {
    const context = await getLearnedContext({ scope: args.scope ?? null, task: args.task ?? null });
    if (context.rules.length === 0) {
      return text("No validated TasteLock rules match this task yet.");
    }
    return jsonText({ count: context.rules.length, rules: context.rules, markdown: context.markdown });
  },
);

server.registerTool(
  "record_correction",
  {
    title: "Record a correction",
    description:
      "Record a correction when the user says something was wrong or should differ. Capture what you did (original), what they wanted (corrected), and the instruction. Stored in the shared HydraDB graph; becomes a rule after human validation.",
    inputSchema: RecordCorrectionInputSchema.shape,
  },
  async (args) => {
    const correction = await recordCorrection({
      scope: args.scope,
      taskRef: args.taskRef ?? null,
      agent: args.agent,
      agentKind: args.agentKind,
      original: args.original ?? null,
      corrected: args.corrected ?? null,
      instruction: args.instruction,
      author: args.agent,
      origin: "mcp",
      tags: args.tags ?? [],
    });
    return jsonText({ recorded: true, correctionId: correction.id, correction });
  },
);

server.registerTool(
  "record_feedback",
  {
    title: "Record feedback",
    description:
      "Record a free-text preference or instruction from the user, such as 'always use pnpm, never npm'. Use this when there is no specific wrong output to point at.",
    inputSchema: RecordFeedbackInputSchema.shape,
  },
  async (args) => {
    const correction = await recordCorrection({
      scope: args.scope,
      taskRef: args.taskRef ?? null,
      instruction: args.instruction,
      agent: args.agent,
      agentKind: args.agentKind,
      author: args.agent,
      origin: "mcp",
    });
    return jsonText({ recorded: true, correctionId: correction.id });
  },
);

server.registerTool(
  "list_corrections",
  {
    title: "List corrections",
    description: "List recorded corrections, newest first, so you can review what recent agents got wrong.",
    inputSchema: ListCorrectionsInputSchema.shape,
  },
  async (args) => {
    const corrections = await listCorrections({
      scope: args.scope ?? null,
      taskRef: args.taskRef ?? null,
      limit: args.limit,
    });
    return jsonText({ count: corrections.length, corrections });
  },
);

server.registerTool(
  "search_corrections",
  {
    title: "Search corrections",
    description: "Search across recorded corrections: instruction, original output, corrected output, tags and agent.",
    inputSchema: SearchCorrectionsInputSchema.shape,
  },
  async (args) => {
    const corrections = await searchCorrections(args.query, args.limit);
    return jsonText({ count: corrections.length, corrections });
  },
);

server.registerTool(
  "list_rules",
  {
    title: "List learned rules",
    description:
      "List learned rules by status. 'validated' rules are active and safe to apply; 'candidate' rules are proposals awaiting human validation.",
    inputSchema: ListRulesInputSchema.shape,
  },
  async (args) => {
    const rules = await listRules({ status: args.status, scope: args.scope ?? null });
    return jsonText({ count: rules.length, rules });
  },
);

server.registerTool(
  "run_learning_pass",
  {
    title: "Run learning pass",
    description:
      "Distil recent corrections into candidate rules using SERV reasoning. Candidates are proposals only - a human must validate them before they take effect.",
    inputSchema: RunLearningPassInputSchema.shape,
  },
  async (args) => {
    const result = await runLearningPass({
      scope: args.scope ?? null,
      taskRef: args.taskRef ?? null,
      author: "mcp",
    });
    return jsonText(result);
  },
);

server.registerTool(
  "decide_rule",
  {
    title: "Validate or retire a rule",
    description:
      "Approve a candidate rule so every agent follows it (validated), or retire a rule that is no longer true. Only call this on an explicit human decision.",
    inputSchema: DecideRuleInputSchema.shape,
  },
  async (args) => {
    const rule = await decideRule(args.ruleId, args.status, args.author);
    return jsonText({ updated: true, rule });
  },
);

server.registerTool(
  "export_tastelock",
  {
    title: "Export TasteLock rules",
    description:
      "Export active rules as a portable bundle (JSON plus markdown). Use it to hand the same context to another agent, a cloud agent, or to commit a tastelock.md into a repository.",
    inputSchema: ExportTasteLockInputSchema.shape,
  },
  async (args) => {
    const bundle = await exportBundle({
      scope: args.scope ?? null,
      includeCandidates: args.includeCandidates,
    });
    return jsonText(bundle);
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TasteLock MCP server ready on stdio");
}

async function shutdown(): Promise<void> {
  await closeGraph();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

main().catch((error: unknown) => {
  console.error("TasteLock MCP server failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
