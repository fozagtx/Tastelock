"use client";

import { Button, HStack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LearnedRuleStatus } from "@/contracts";
import { browserApi, errorText } from "@/lib/browserApi";

export function RuleActions({ ruleId, status }: { ruleId: string; status: LearnedRuleStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState<"validated" | "retired" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(next: "validated" | "retired") {
    setPending(next);
    setError(null);
    try {
      await browserApi.patch(`/api/rules/${encodeURIComponent(ruleId)}`, { status: next, author: "ui" });
      router.refresh();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setPending(null);
    }
  }

  return (
    <HStack gap="2" justify="flex-end">
      {error && (
        <Text fontSize="xs" color="red.solid">
          {error}
        </Text>
      )}
      {status !== "validated" && (
        <Button
          size="xs"
          colorPalette="teal"
          loading={pending === "validated"}
          disabled={pending !== null}
          onClick={() => decide("validated")}
        >
          Validate
        </Button>
      )}
      {status !== "retired" && (
        <Button
          size="xs"
          variant="outline"
          loading={pending === "retired"}
          disabled={pending !== null}
          onClick={() => decide("retired")}
        >
          Retire
        </Button>
      )}
    </HStack>
  );
}
