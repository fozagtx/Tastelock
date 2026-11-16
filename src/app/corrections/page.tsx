import { Box, Button, HStack, Input, Stack, Table, Text } from "@chakra-ui/react";
import { CorrectionForm } from "@/components/CorrectionForm";
import { EmptyState, PageHeader, Panel, Td, Th } from "@/components/layout";
import { listCorrections } from "@/services/tastelock";

export const dynamic = "force-dynamic";

export default async function CorrectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const all = await listCorrections({ limit: 200 });
  const corrections = query
    ? all.filter((row) =>
        [row.instruction ?? "", row.original ?? "", row.corrected ?? "", row.agent, row.scope, row.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : all;

  return (
    <Stack gap="6">
      <PageHeader
        title="Corrections"
        description="Every correction an agent recorded. This is the evidence rules are built from."
      />

      <Panel title="Record a correction" description="Available to you as well as to agents.">
        <CorrectionForm />
      </Panel>

      <Panel
        title={`Recorded (${corrections.length})`}
        description={query ? `Filtered by "${query}"` : undefined}
        action={
          <form action="/corrections" method="get">
            <HStack gap="2">
              <Input size="sm" name="q" defaultValue={query} placeholder="Search" width="200px" />
              <Button size="sm" type="submit" variant="outline">
                Search
              </Button>
            </HStack>
          </form>
        }
        padded={false}
      >
        {corrections.length === 0 ? (
          <Box paddingX="5" paddingBottom="2">
            <EmptyState
              title={query ? "No matches" : "Nothing recorded yet"}
              description={
                query
                  ? "Try a different word, or clear the search."
                  : "Record a correction above, or let an agent record one over MCP."
              }
            />
          </Box>
        ) : (
          <Box overflowX="auto" paddingX="5" paddingY="2">
            <Table.Root size="sm" variant="line" minWidth="960px">
              <Table.Header>
                <Table.Row>
                  <Th>Instruction</Th>
                  <Th>Agent did</Th>
                  <Th>Should have done</Th>
                  <Th>Scope</Th>
                  <Th>Agent</Th>
                  <Th align="end">Recorded</Th>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {corrections.map((correction) => (
                  <Table.Row key={correction.id} _hover={{ background: "bg.subtle" }}>
                    <Td wrap>{correction.instruction ?? correction.id}</Td>
                    <Td wrap muted>
                      {correction.original ?? ""}
                    </Td>
                    <Td wrap muted>
                      {correction.corrected ?? ""}
                    </Td>
                    <Td muted>{correction.scope}</Td>
                    <Td muted>{correction.agent}</Td>
                    <Td align="end" muted>
                      {new Date(correction.createdAt).toLocaleString()}
                    </Td>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Panel>

      <Text fontSize="xs" color="fg.muted">
        Showing up to 200 corrections, newest first.
      </Text>
    </Stack>
  );
}
