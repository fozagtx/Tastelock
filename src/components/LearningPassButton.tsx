"use client";

import { Button, HStack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserApi, errorText } from "@/lib/browserApi";

export function LearningPassButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function run() {
    setPending(true);
    setMessage(null);
    setFailed(false);
    try {
      const result = await browserApi.post<{
        result: { evaluatedCorrections: number; candidates: unknown[]; skippedDuplicates: number; summary: string };
      }>("/api/learning-pass", { author: "ui" });
      setMessage(
        `${result.result.candidates.length} candidate(s), ${result.result.skippedDuplicates} duplicate(s) skipped, from ${result.result.evaluatedCorrections} correction(s).`,
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
    <HStack gap="3" flexWrap="wrap">
      <Button colorPalette="purple" size="sm" loading={pending} onClick={run}>
        Run learning pass
      </Button>
      {message && (
        <Text fontSize="xs" color={failed ? "red.solid" : "teal.solid"}>
          {message}
        </Text>
      )}
    </HStack>
  );
}
