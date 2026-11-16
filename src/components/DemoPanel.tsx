"use client";

import { Button, Field, HStack, Input, NativeSelect, Stack, Text, Textarea } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AGENT_KINDS, CORRECTION_SCOPES } from "@/contracts";
import { browserApi, errorText } from "@/lib/browserApi";

export function DemoPanel() {
  const router = useRouter();
  const [instruction, setInstruction] = useState("Always use pnpm in this repo, never npm.");
  const [scope, setScope] = useState<string>("tooling");
  const [agentKind, setAgentKind] = useState<string>("claude-code");
  const [agent, setAgent] = useState("claude-code");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function record() {
    setPending(true);
    setMessage(null);
    setFailed(false);
    try {
      const created = await browserApi.post<{ correction: { id: string } }>("/api/corrections", {
        scope,
        agent: agent || "ui",
        agentKind,
        instruction,
        author: agent || "ui",
        origin: "ui",
        tags: [scope],
      });
      setMessage(`Correction recorded: ${created.correction.id}`);
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(errorText(error));
    } finally {
      setPending(false);
    }
  }

  async function learn() {
    setPending(true);
    setMessage(null);
    setFailed(false);
    try {
      const result = await browserApi.post<{
        result: { evaluatedCorrections: number; candidates: unknown[]; skippedDuplicates: number; summary: string };
      }>("/api/learning-pass", { scope: null, author: "ui" });
      setMessage(
        `Learning pass: ${result.result.candidates.length} new candidate(s), ${result.result.skippedDuplicates} duplicate(s) skipped, ${result.result.evaluatedCorrections} correction(s) read. ${result.result.summary}`,
      );
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(errorText(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <Stack gap="4">
      <Field.Root>
        <Field.Label fontSize="xs">Correction / instruction</Field.Label>
        <Textarea
          size="sm"
          rows={2}
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
        />
      </Field.Root>

      <HStack gap="4" alignItems="flex-end">
        <Field.Root width="180px">
          <Field.Label fontSize="xs">Scope</Field.Label>
          <NativeSelect.Root size="sm">
            <NativeSelect.Field value={scope} onChange={(event) => setScope(event.target.value)}>
              {CORRECTION_SCOPES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root width="180px">
          <Field.Label fontSize="xs">Agent kind</Field.Label>
          <NativeSelect.Root size="sm">
            <NativeSelect.Field value={agentKind} onChange={(event) => setAgentKind(event.target.value)}>
              {AGENT_KINDS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root width="200px">
          <Field.Label fontSize="xs">Agent name</Field.Label>
          <Input size="sm" value={agent} onChange={(event) => setAgent(event.target.value)} />
        </Field.Root>

        <Button colorPalette="teal" size="sm" loading={pending} onClick={record}>
          Record correction
        </Button>
        <Button colorPalette="purple" size="sm" variant="outline" loading={pending} onClick={learn}>
          Run learning pass
        </Button>
      </HStack>

      {message && (
        <Text fontSize="xs" color={failed ? "red.300" : "teal.300"}>
          {message}
        </Text>
      )}
    </Stack>
  );
}
