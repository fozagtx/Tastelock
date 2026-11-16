"use client";

import { Button, HStack, Text } from "@chakra-ui/react";
import { useState } from "react";

export function TokenReveal({ token }: { token: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  const masked = token.length > 14 ? `${token.slice(0, 8)}${"•".repeat(16)}${token.slice(-4)}` : "•".repeat(token.length);

  async function copy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <HStack gap="2" flexWrap="wrap" width="100%">
      <Text
        fontSize="xs"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        background="bg.subtle"
        borderWidth="1px"
        borderColor="border.muted"
        borderRadius="sm"
        paddingX="2"
        paddingY="1"
        flex="1"
        minWidth="240px"
        overflowX="auto"
        whiteSpace="nowrap"
      >
        {shown ? token : masked}
      </Text>
      <Button size="xs" variant="outline" onClick={() => setShown((value) => !value)}>
        {shown ? "Hide" : "Reveal"}
      </Button>
      <Button size="xs" variant="outline" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </Button>
    </HStack>
  );
}
