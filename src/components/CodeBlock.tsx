import { Box } from "@chakra-ui/react";

export function CodeBlock({ children, maxHeight }: { children: string; maxHeight?: string }) {
  return (
    <Box
      as="pre"
      background="bg.subtle"
      borderWidth="1px"
      borderColor="border.muted"
      borderRadius="md"
      padding="4"
      fontSize="xs"
      lineHeight="1.6"
      overflowX="auto"
      overflowY={maxHeight ? "auto" : undefined}
      maxHeight={maxHeight}
      margin="0"
      color="fg"
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
    >
      {children}
    </Box>
  );
}
