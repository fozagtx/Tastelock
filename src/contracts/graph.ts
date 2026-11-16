import { z } from "zod";

export const GRAPH_LABELS = [
  "Correction",
  "LearnedRule",
  "Agent",
  "Reviewer",
  "TaskRef",
  "Tag",
  "AuditEvent",
] as const;
export type GraphLabel = (typeof GRAPH_LABELS)[number];

export const GRAPH_RELATIONSHIPS = [
  "RECORDED_BY",
  "MADE_BY",
  "DERIVED_FROM",
  "SUPERSEDES",
  "APPLIES_TO",
  "TAGGED_WITH",
  "VALIDATED_BY",
] as const;
export type GraphRelationship = (typeof GRAPH_RELATIONSHIPS)[number];

export const GraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});
export type GraphNode = z.infer<typeof GraphNodeSchema>;

export const GraphEdgeSchema = z.object({
  id: z.string(),
  type: z.string(),
  from: z.string(),
  to: z.string(),
});
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

export const GraphViewSchema = z.object({
  rootId: z.string(),
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
});
export type GraphView = z.infer<typeof GraphViewSchema>;
