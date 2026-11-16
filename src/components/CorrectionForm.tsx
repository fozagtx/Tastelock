"use client";

import { Badge, Button, Field, HStack, Input, NativeSelect, SimpleGrid, Stack, Text, Textarea } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AGENT_KINDS, CORRECTION_SCOPES } from "@/contracts";
import { browserApi, errorText } from "@/lib/browserApi";

export function CorrectionForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [scope, setScope] = useState("general");
  const [agentKind, setAgentKind] = useState("claude-code");
  const [agent, setAgent] = useState("claude-code");
  const [taskRef, setTaskRef] = useState("");
  const [original, setOriginal] = useState("");
  const [corrected, setCorrected] = useState("");
  const [instruction, setInstruction] = useState("");
  const [tags, setTags] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function submit() {
    setPending(true);
    setMessage(null);
    setFailed(false);
    try {
      const created = await browserApi.post<{ correction: { id: string } }>("/api/corrections", {
        scope,
        agent: agent || "ui",
        agentKind,
        taskRef: taskRef || null,
        original: original || null,
        corrected: corrected || null,
        instruction: instruction || null,
        author: agent || "ui",
        origin: "ui",
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      });
      setMessage(`Recorded ${created.correction.id}`);
      setOriginal("");
      setCorrected("");
      setInstruction("");
      setTags("");
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
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="3">
        <Field.Root>
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

        <Field.Root>
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

        <Field.Root>
          <Field.Label fontSize="xs">Agent name</Field.Label>
          <Input size="sm" value={agent} onChange={(event) => setAgent(event.target.value)} />
        </Field.Root>

        <Field.Root>
          <Field.Label fontSize="xs">Task or repo</Field.Label>
          <Input
            size="sm"
            value={taskRef}
            onChange={(event) => setTaskRef(event.target.value)}
            placeholder="optional"
          />
        </Field.Root>
      </SimpleGrid>

      <Field.Root>
        <Field.Label fontSize="xs">Instruction</Field.Label>
        <Textarea
          size="sm"
          rows={compact ? 2 : 3}
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder="Always use pnpm in this repo, never npm."
        />
      </Field.Root>

      {!compact && (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap="3">
          <Field.Root>
            <Field.Label fontSize="xs">Agent did</Field.Label>
            <Textarea
              size="sm"
              rows={2}
              value={original}
              onChange={(event) => setOriginal(event.target.value)}
              placeholder="optional"
            />
          </Field.Root>
          <Field.Root>
            <Field.Label fontSize="xs">Should have done</Field.Label>
            <Textarea
              size="sm"
              rows={2}
              value={corrected}
              onChange={(event) => setCorrected(event.target.value)}
              placeholder="optional"
            />
          </Field.Root>
        </SimpleGrid>
      )}

      <HStack gap="3" alignItems="flex-end" flexWrap="wrap">
        <Field.Root flex="1" minWidth="200px">
          <Field.Label fontSize="xs">Tags</Field.Label>
          <Input
            size="sm"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="comma separated"
          />
        </Field.Root>
        <Button colorPalette="teal" size="sm" loading={pending} onClick={submit}>
          Record correction
        </Button>
        {message && (
          <Badge colorPalette={failed ? "red" : "teal"} variant="subtle" fontSize="xs">
            {message}
          </Badge>
        )}
      </HStack>

      {failed && message && (
        <Text fontSize="xs" color="red.solid">
          {message}
        </Text>
      )}
    </Stack>
  );
}
