import { Button, HStack, Link, Stack, Text } from "@chakra-ui/react";
import { CodeBlock } from "@/components/CodeBlock";
import { CopyButton } from "@/components/CopyButton";
import { EmptyState, PageHeader, Panel } from "@/components/layout";
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
    <Stack gap="6">
      <PageHeader
        title="Export"
        description="The same rules, as markdown for any agent. Use it as tastelock.md in a repository, or hand it to a cloud agent."
        action={
          <HStack gap="2" flexWrap="wrap">
            <CopyButton value={bundle.markdown} label="Copy markdown" />
            <Button asChild size="xs" variant="outline">
              <Link href="/api/export" target="_blank">
                JSON endpoint
              </Link>
            </Button>
            <Button asChild size="xs" variant={withCandidates ? "solid" : "outline"} colorPalette="gray">
              <Link href={`/export?includeCandidates=${withCandidates ? "false" : "true"}`}>
                {withCandidates ? "Candidates included" : "Candidates excluded"}
              </Link>
            </Button>
          </HStack>
        }
      />

      <Panel
        title={`${bundle.rules.length} rule(s)`}
        description={`Generated ${new Date(bundle.generatedAt).toLocaleString()}`}
      >
        {bundle.rules.length === 0 ? (
          <EmptyState
            title="No validated rules yet"
            description="Validate a candidate on the Rules page and it appears in this bundle."
          />
        ) : (
          <CodeBlock maxHeight="560px">{bundle.markdown}</CodeBlock>
        )}
      </Panel>

      <Text fontSize="xs" color="fg.muted">
        The JSON endpoint returns the same bundle for scripts: <b>/api/export</b>
      </Text>
    </Stack>
  );
}
