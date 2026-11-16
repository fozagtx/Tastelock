import {
  GRAPH_LABELS,
  GRAPH_RELATIONSHIPS,
  type Agent,
  type AgentKind,
  type Correction,
  type CorrectionScope,
  type GraphEdge,
  type GraphLabel,
  type GraphNode,
  type GraphRelationship,
  type GraphView,
  type LearnedRule,
  type LearnedRuleStatus,
} from "@/contracts";
import { asNumber, asString, nodeProps, parseJson, runQuery, toJson } from "./client";

const LABELS = new Set<string>(GRAPH_LABELS);
const RELATIONSHIPS = new Set<string>(GRAPH_RELATIONSHIPS);
const PROP_KEY = /^[A-Za-z][A-Za-z0-9_]*$/;

type PropertyValue = string | number | boolean | null;

function assertLabel(label: string): GraphLabel {
  if (!LABELS.has(label)) throw new Error(`unknown graph label: ${label}`);
  return label as GraphLabel;
}

function assertRelationship(rel: string): GraphRelationship {
  if (!RELATIONSHIPS.has(rel)) throw new Error(`unknown graph relationship: ${rel}`);
  return rel as GraphRelationship;
}

function assertProps(props: Record<string, PropertyValue>): Record<string, PropertyValue> {
  for (const key of Object.keys(props)) {
    if (!PROP_KEY.test(key)) throw new Error(`invalid property key: ${key}`);
  }
  return props;
}

export async function upsertNode(
  label: GraphLabel,
  id: string,
  props: Record<string, PropertyValue>,
): Promise<void> {
  const safeLabel = assertLabel(label);
  const safeProps = assertProps(props);
  const keys = Object.keys(safeProps);
  const existing = await runQuery(`MATCH (n:${safeLabel} {id: $id}) RETURN n.id AS id LIMIT 1`, { id });
  if (existing.length === 0) {
    const assignments = keys.map((key) => `${key}: $${key}`).join(", ");
    const suffix = assignments.length > 0 ? `, ${assignments}` : "";
    await runQuery(`CREATE (n:${safeLabel} {id: $id${suffix}})`, { id, ...safeProps }, "write");
    return;
  }
  if (keys.length === 0) return;
  const setClause = keys.map((key) => `n.${key} = $${key}`).join(", ");
  await runQuery(`MATCH (n:${safeLabel} {id: $id}) SET ${setClause}`, { id, ...safeProps }, "write");
}

export async function link(
  fromLabel: GraphLabel,
  fromId: string,
  rel: GraphRelationship,
  toLabel: GraphLabel,
  toId: string,
): Promise<void> {
  const safeRel = assertRelationship(rel);
  const a = assertLabel(fromLabel);
  const b = assertLabel(toLabel);
  const existing = await runQuery(
    `MATCH (a:${a} {id: $fromId})-[r:${safeRel}]->(b:${b} {id: $toId}) RETURN r LIMIT 1`,
    { fromId, toId },
  );
  if (existing.length > 0) return;
  await runQuery(
    `MATCH (a:${a} {id: $fromId}), (b:${b} {id: $toId}) CREATE (a)-[:${safeRel}]->(b)`,
    { fromId, toId },
    "write",
  );
}

const CORRECTION_RETURN = `
  c.id AS id, c.scope AS scope, c.taskRef AS taskRef, c.agent AS agent, c.agentKind AS agentKind,
  c.original AS original, c.corrected AS corrected, c.instruction AS instruction, c.author AS author,
  c.origin AS origin, c.tagsJson AS tagsJson, c.createdAt AS createdAt
`;

function toCorrection(row: Record<string, unknown>): Correction {
  return {
    id: asString(row.id),
    scope: asString(row.scope, "general") as CorrectionScope,
    taskRef: row.taskRef === null || row.taskRef === undefined ? null : asString(row.taskRef),
    agent: asString(row.agent, "unknown"),
    agentKind: asString(row.agentKind, "other") as AgentKind,
    original: row.original === null || row.original === undefined ? null : asString(row.original),
    corrected: row.corrected === null || row.corrected === undefined ? null : asString(row.corrected),
    instruction:
      row.instruction === null || row.instruction === undefined ? null : asString(row.instruction),
    author: asString(row.author, "unknown"),
    origin: asString(row.origin, "api") as Correction["origin"],
    tags: parseJson<string[]>(row.tagsJson, []),
    createdAt: asString(row.createdAt),
  };
}

export async function upsertAgent(id: string, name: string, kind: AgentKind, seenAt: string): Promise<void> {
  await upsertNode("Agent", id, { name, kind, lastSeenAt: seenAt });
}

export async function createCorrection(correction: Correction): Promise<void> {
  await upsertNode("Correction", correction.id, {
    scope: correction.scope,
    taskRef: correction.taskRef,
    agent: correction.agent,
    agentKind: correction.agentKind,
    original: correction.original,
    corrected: correction.corrected,
    instruction: correction.instruction,
    author: correction.author,
    origin: correction.origin,
    tagsJson: toJson(correction.tags),
    createdAt: correction.createdAt,
  });

  await upsertAgent(correction.agent, correction.agent, correction.agentKind, correction.createdAt);
  await link("Correction", correction.id, "RECORDED_BY", "Agent", correction.agent);

  const reviewerId = `reviewer_${correction.author.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  await upsertNode("Reviewer", reviewerId, { name: correction.author });
  await link("Correction", correction.id, "MADE_BY", "Reviewer", reviewerId);

  if (correction.taskRef) {
    const taskId = `task_${correction.taskRef.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    await upsertNode("TaskRef", taskId, { name: correction.taskRef });
    await link("Correction", correction.id, "APPLIES_TO", "TaskRef", taskId);
  }

  for (const tag of correction.tags) {
    const tagId = `tag_${tag.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    await upsertNode("Tag", tagId, { name: tag });
    await link("Correction", correction.id, "TAGGED_WITH", "Tag", tagId);
  }
}

export async function listCorrections(options: {
  scope?: CorrectionScope;
  taskRef?: string;
  limit?: number;
} = {}): Promise<Correction[]> {
  const clauses: string[] = [];
  const params: Record<string, unknown> = { limit: Math.min(Math.max(options.limit ?? 50, 1), 300) };
  if (options.scope) {
    clauses.push("c.scope = $scope");
    params.scope = options.scope;
  }
  if (options.taskRef) {
    clauses.push("c.taskRef = $taskRef");
    params.taskRef = options.taskRef;
  }
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await runQuery(
    `MATCH (c:Correction) ${where} RETURN ${CORRECTION_RETURN} ORDER BY c.createdAt DESC LIMIT $limit`,
    params,
  );
  return rows.map(toCorrection);
}

export async function searchCorrections(query: string, limit = 10): Promise<Correction[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const rows = await runQuery(
    `MATCH (c:Correction) RETURN ${CORRECTION_RETURN} ORDER BY c.createdAt DESC LIMIT 300`,
  );
  return rows
    .map(toCorrection)
    .filter((correction) =>
      [
        correction.instruction ?? "",
        correction.original ?? "",
        correction.corrected ?? "",
        correction.taskRef ?? "",
        correction.agent,
        correction.scope,
        correction.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    )
    .slice(0, limit);
}

export async function countCorrections(): Promise<number> {
  const rows = await runQuery(`MATCH (c:Correction) RETURN count(c) AS total`);
  return rows[0] ? asNumber(rows[0].total, 0) : 0;
}

export async function listAgents(): Promise<Agent[]> {
  const rows = await runQuery(
    `MATCH (a:Agent) RETURN a.id AS id, a.name AS name, a.kind AS kind, a.lastSeenAt AS lastSeenAt ORDER BY a.name ASC`,
  );
  const agents: Agent[] = [];
  for (const row of rows) {
    const id = asString(row.id);
    const correctionRows = await runQuery(
      `MATCH (c:Correction)-[:RECORDED_BY]->(a:Agent {id: $id}) RETURN count(c) AS total`,
      { id },
    );
    const ruleRows = await runQuery(
      `MATCH (l:LearnedRule)-[:DERIVED_FROM]->(c:Correction)-[:RECORDED_BY]->(a:Agent {id: $id})
       RETURN count(l) AS total`,
      { id },
    );
    agents.push({
      id,
      name: asString(row.name, id),
      kind: asString(row.kind, "other") as AgentKind,
      lastSeenAt: asString(row.lastSeenAt),
      correctionCount: correctionRows[0] ? asNumber(correctionRows[0].total, 0) : 0,
      ruleCount: ruleRows[0] ? asNumber(ruleRows[0].total, 0) : 0,
    });
  }
  return agents;
}

export async function upsertLearnedRule(rule: LearnedRule): Promise<void> {
  await upsertNode("LearnedRule", rule.id, {
    scope: rule.scope,
    text: rule.text,
    status: rule.status,
    confidence: rule.confidence,
    support: rule.support,
    supersedes: rule.supersedes,
    tagsJson: toJson(rule.tags),
    createdAt: rule.createdAt,
    validatedBy: rule.validatedBy,
    validatedAt: rule.validatedAt,
  });

  for (const correctionId of rule.derivedFrom) {
    await link("LearnedRule", rule.id, "DERIVED_FROM", "Correction", correctionId);
  }
  if (rule.supersedes) {
    await link("LearnedRule", rule.id, "SUPERSEDES", "LearnedRule", rule.supersedes);
  }
  for (const tag of rule.tags) {
    const tagId = `tag_${tag.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    await upsertNode("Tag", tagId, { name: tag });
    await link("LearnedRule", rule.id, "TAGGED_WITH", "Tag", tagId);
  }
}

export async function listLearnedRules(options: {
  status?: LearnedRuleStatus;
  scope?: CorrectionScope;
  limit?: number;
} = {}): Promise<LearnedRule[]> {
  const clauses: string[] = [];
  const params: Record<string, unknown> = { limit: Math.min(Math.max(options.limit ?? 100, 1), 300) };
  if (options.status) {
    clauses.push("l.status = $status");
    params.status = options.status;
  }
  if (options.scope) {
    clauses.push("l.scope = $scope");
    params.scope = options.scope;
  }
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await runQuery(
    `MATCH (l:LearnedRule) ${where}
     RETURN l.id AS id, l.scope AS scope, l.text AS text, l.status AS status, l.confidence AS confidence,
            l.support AS support, l.supersedes AS supersedes, l.tagsJson AS tagsJson, l.createdAt AS createdAt,
            l.validatedBy AS validatedBy, l.validatedAt AS validatedAt
     ORDER BY l.createdAt DESC LIMIT $limit`,
    params,
  );

  const rules: LearnedRule[] = [];
  for (const row of rows) {
    const id = asString(row.id);
    const derived = await runQuery(
      `MATCH (l:LearnedRule {id: $id})-[:DERIVED_FROM]->(c:Correction) RETURN c.id AS id`,
      { id },
    );
    rules.push({
      id,
      scope: asString(row.scope, "general") as CorrectionScope,
      text: asString(row.text),
      status: asString(row.status, "candidate") as LearnedRuleStatus,
      confidence: asNumber(row.confidence, 0),
      support: asNumber(row.support, 0),
      derivedFrom: derived.map((entry) => asString(entry.id)),
      supersedes: row.supersedes === null || row.supersedes === undefined ? null : asString(row.supersedes),
      tags: parseJson<string[]>(row.tagsJson, []),
      createdAt: asString(row.createdAt),
      validatedBy: row.validatedBy === null || row.validatedBy === undefined ? null : asString(row.validatedBy),
      validatedAt: row.validatedAt === null || row.validatedAt === undefined ? null : asString(row.validatedAt),
    });
  }
  return rules;
}

export async function getLearnedRule(id: string): Promise<LearnedRule | null> {
  const rules = await listLearnedRules({ limit: 300 });
  return rules.find((rule) => rule.id === id) ?? null;
}

export async function setRuleStatus(
  id: string,
  status: LearnedRuleStatus,
  author: string,
): Promise<void> {
  const validatedAt = status === "validated" ? new Date().toISOString() : null;
  await upsertNode("LearnedRule", id, {
    status,
    validatedBy: status === "validated" ? author : null,
    validatedAt,
  });
  if (status === "validated") {
    const reviewerId = `reviewer_${author.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    await upsertNode("Reviewer", reviewerId, { name: author });
    await link("LearnedRule", id, "VALIDATED_BY", "Reviewer", reviewerId);
  }
}

export async function ruleCounts(): Promise<{ validated: number; candidates: number; retired: number }> {
  const count = async (status: LearnedRuleStatus): Promise<number> => {
    const rows = await runQuery(`MATCH (l:LearnedRule {status: $status}) RETURN count(l) AS total`, {
      status,
    });
    return rows[0] ? asNumber(rows[0].total, 0) : 0;
  };
  return {
    validated: await count("validated"),
    candidates: await count("candidate"),
    retired: await count("retired"),
  };
}

export async function recordAuditEvent(event: {
  id: string;
  action: string;
  actor: string;
  targetType: string;
  targetId: string;
  detail: string | null;
  createdAt: string;
}): Promise<void> {
  await upsertNode("AuditEvent", event.id, {
    action: event.action,
    actor: event.actor,
    targetType: event.targetType,
    targetId: event.targetId,
    detail: event.detail,
    createdAt: event.createdAt,
  });
}

export async function recentAuditEvents(limit = 25): Promise<
  { id: string; action: string; actor: string; targetType: string; targetId: string; detail: string | null; createdAt: string }[]
> {
  const rows = await runQuery(
    `MATCH (a:AuditEvent) RETURN a.id AS id, a.action AS action, a.actor AS actor,
      a.targetType AS targetType, a.targetId AS targetId, a.detail AS detail, a.createdAt AS createdAt
     ORDER BY a.createdAt DESC LIMIT $limit`,
    { limit },
  );
  return rows.map((row) => ({
    id: asString(row.id),
    action: asString(row.action),
    actor: asString(row.actor, "unknown"),
    targetType: asString(row.targetType),
    targetId: asString(row.targetId),
    detail: row.detail === null || row.detail === undefined ? null : asString(row.detail),
    createdAt: asString(row.createdAt),
  }));
}

export async function graphView(rootId: string): Promise<GraphView | null> {
  const rule = await getLearnedRule(rootId);
  if (rule) return ruleGraph(rule);

  const corrections = await listCorrections({ limit: 300 });
  const correction = corrections.find((entry) => entry.id === rootId);
  if (correction) return correctionGraph(correction);

  return null;
}

async function correctionGraph(correction: Correction): Promise<GraphView> {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const addNode = (node: GraphNode) => {
    if (!nodes.has(node.id)) nodes.set(node.id, node);
  };
  const addEdge = (type: string, from: string, to: string) => {
    const id = `${type}:${from}->${to}`;
    if (!edges.some((edge) => edge.id === id)) edges.push({ id, type, from, to });
  };

  addNode({
    id: correction.id,
    label: "Correction",
    title: correction.instruction ?? correction.corrected ?? correction.id,
    subtitle: `${correction.scope} · ${correction.agent}`,
    properties: {
      scope: correction.scope,
      agent: correction.agent,
      createdAt: correction.createdAt,
      taskRef: correction.taskRef,
    },
  });

  const agentId = correction.agent;
  addNode({ id: agentId, label: "Agent", title: correction.agent, subtitle: correction.agentKind, properties: {} });
  addEdge("RECORDED_BY", correction.id, agentId);

  const reviewerId = `reviewer_${correction.author.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  addNode({ id: reviewerId, label: "Reviewer", title: correction.author, subtitle: null, properties: {} });
  addEdge("MADE_BY", correction.id, reviewerId);

  if (correction.taskRef) {
    const taskId = `task_${correction.taskRef.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    addNode({ id: taskId, label: "TaskRef", title: correction.taskRef, subtitle: null, properties: {} });
    addEdge("APPLIES_TO", correction.id, taskId);
  }

  for (const tag of correction.tags) {
    const tagId = `tag_${tag.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    addNode({ id: tagId, label: "Tag", title: tag, subtitle: null, properties: {} });
    addEdge("TAGGED_WITH", correction.id, tagId);
  }

  const ruleRows = await runQuery(
    `MATCH (l:LearnedRule)-[:DERIVED_FROM]->(c:Correction {id: $id}) RETURN l.id AS id, l.text AS text, l.status AS status`,
    { id: correction.id },
  );
  for (const row of ruleRows) {
    const id = asString(row.id);
    addNode({
      id,
      label: "LearnedRule",
      title: asString(row.text),
      subtitle: asString(row.status),
      properties: { status: asString(row.status) },
    });
    addEdge("DERIVED_FROM", id, correction.id);
  }

  return { rootId: correction.id, nodes: [...nodes.values()], edges };
}

async function ruleGraph(rule: LearnedRule): Promise<GraphView> {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const addNode = (node: GraphNode) => {
    if (!nodes.has(node.id)) nodes.set(node.id, node);
  };
  const addEdge = (type: string, from: string, to: string) => {
    const id = `${type}:${from}->${to}`;
    if (!edges.some((edge) => edge.id === id)) edges.push({ id, type, from, to });
  };

  addNode({
    id: rule.id,
    label: "LearnedRule",
    title: rule.text,
    subtitle: `${rule.status} · confidence ${rule.confidence.toFixed(2)}`,
    properties: {
      status: rule.status,
      scope: rule.scope,
      confidence: rule.confidence,
      support: rule.support,
      validatedBy: rule.validatedBy,
    },
  });

  if (rule.validatedBy) {
    const reviewerId = `reviewer_${rule.validatedBy.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    addNode({ id: reviewerId, label: "Reviewer", title: rule.validatedBy, subtitle: null, properties: {} });
    addEdge("VALIDATED_BY", rule.id, reviewerId);
  }

  for (const tag of rule.tags) {
    const tagId = `tag_${tag.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    addNode({ id: tagId, label: "Tag", title: tag, subtitle: null, properties: {} });
    addEdge("TAGGED_WITH", rule.id, tagId);
  }

  for (const correctionId of rule.derivedFrom) {
    const rows = await runQuery(
      `MATCH (c:Correction {id: $id}) RETURN ${CORRECTION_RETURN}`,
      { id: correctionId },
    );
    const row = rows[0];
    if (!row) continue;
    const correction = toCorrection(row);
    addNode({
      id: correction.id,
      label: "Correction",
      title: correction.instruction ?? correction.corrected ?? correction.id,
      subtitle: `${correction.scope} · ${correction.agent}`,
      properties: {
        scope: correction.scope,
        agent: correction.agent,
        createdAt: correction.createdAt,
        taskRef: correction.taskRef,
      },
    });
    addEdge("DERIVED_FROM", rule.id, correction.id);

    const agentId = correction.agent;
    addNode({
      id: agentId,
      label: "Agent",
      title: correction.agent,
      subtitle: correction.agentKind,
      properties: {},
    });
    addEdge("RECORDED_BY", correction.id, agentId);

    const reviewerId = `reviewer_${correction.author.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    addNode({ id: reviewerId, label: "Reviewer", title: correction.author, subtitle: null, properties: {} });
    addEdge("MADE_BY", correction.id, reviewerId);
  }

  return { rootId: rule.id, nodes: [...nodes.values()], edges };
}

export function nodeProperty(value: unknown, key: string): string | null {
  const props = nodeProps(value);
  const entry = props[key];
  return typeof entry === "string" ? entry : null;
}
