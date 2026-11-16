import { Button, HStack, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { CodeBlock } from "@/components/CodeBlock";
import { CopyButton } from "@/components/CopyButton";
import { exportBundle } from "@/services/tastelock";

export const dynamic = "force-dynamic";

export default async function ExportPage({
  searchParams,
}: {
  searchParams: Promise<{ includeCandidates?: string }>;
}) {
  const { includeCandidates } = await searchParams;
  const withCandidates = includeCandidates === "true";
  const bundle = await exportBundle({ includeCandidates: withCandidates });

  return (
    <Stack gap="8">
      <Stack gap="2">
        <Heading size="xl">Export</Heading>
        <Text fontSize="sm" color="fg.muted">
          {bundle.rules.length} rule(s) in this bundle. Use it as tastelock.md in a repository, or give it to a cloud
          agent.
        </Text>
      </Stack>

      <HStack gap="3" flexWrap="wrap">
        <CopyButton value={bundle.markdown} label="Copy markdown" />
        <Button asChild size="xs" variant="outline">
          <Link href="/api/export" target="_blank">
            Open JSON endpoint
          </Link>
        </Button>
        <Button asChild size="xs" variant={withCandidates ? "solid" : "outline"} colorPalette="gray">
          <Link href={`/export?includeCandidates=${withCandidates ? "false" : "true"}`}>
            {withCandidates ? "Include candidates: on" : "Include candidates: off"}
          </Link>
        </Button>
      </HStack>

      <CodeBlock maxHeight="520px">{bundle.markdown}</CodeBlock>

      <Text fontSize="xs" color="fg.muted">
        Generated {new Date(bundle.generatedAt).toLocaleString()}.
      </Text>
    </Stack>
  );
}
