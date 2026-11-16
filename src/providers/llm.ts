import { z } from "zod";
import { CORRECTION_SCOPES, type Correction, type LearnedRule } from "@/contracts";

export const DistilOutputSchema = z.object({
  summary: z.string(),
  candidates: z.array(
    z.object({
      scope: z.enum(CORRECTION_SCOPES),
      text: z.string().min(1),
      confidence: z.number().min(0).max(1),
      support: z.number().int().nonnegative(),
      derivedFrom: z.array(z.string()),
      tags: z.array(z.string()).default([]),
    }),
  ),
});
export type DistilOutput = z.infer<typeof DistilOutputSchema>;

export type DistilInput = { corrections: Correction[]; existingRules: LearnedRule[] };
export type DistilResult = { output: DistilOutput; model: string };

export interface LlmProvider {
  readonly name: string;
  distil(input: DistilInput): Promise<DistilResult>;
}
