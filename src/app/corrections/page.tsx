import { Box, Button, Card, HStack, Heading, Input, Stack, Table, Text } from "@chakra-ui/react";
import { CorrectionForm } from "@/components/CorrectionForm";
import { listCorrections } from "@/services/tastelock";

export const dynamic = "force-dynamic";

export default async function CorrectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const corrections = query
    ? await listCorrections({ limit: 200 }).then((rows) =>
        rows.filter((row) =>
          [
            row.instruction ?? "",
            row.original ?? "",
            row.corrected ?? "",
            row.agent,
            row.scope,
            row.tags.join(" "),
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
      )
    : await listCorrections({ limit: 200 });

  return (
    <Stack gap="8">
      <Stack gap="2">
        <Heading size="xl">Corrections</Heading>
        <Text fontSize="sm" color="fg.muted">
          Every correction an agent recorded, newest first. This is the evidence rules are built from.
        </Text>
      </Stack>

      <Card.Root variant="outline">
        <Card.Header>
          <Heading size="sm">Record a correction</Heading>
        </Card.Header>
        <Card.Body>
          <CorrectionForm />
        </Card.Body>
      </Card.Root>

      <Stack gap="4">
        <HStack justify="space-between" flexWrap="wrap" gap="3">
          <Heading size="md">Recorded ({corrections.length})</Heading>
          <form action="/corrections" method="get">
            <HStack gap="2">
              <Input size="sm" name="q" defaultValue={query} placeholder="Search corrections" width="240px" />
              <Button size="sm" type="submit" variant="outline">
                Search
              </Button>
            </HStack>
          </form>
        </HStack>

        {corrections.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            {query ? "No corrections match that search." : "Nothing recorded yet."}
          </Text>
        ) : (
          <Box overflowX="auto">
            <Table.Root size="sm" variant="line" minWidth="900px">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Instruction</Table.ColumnHeader>
                  <Table.ColumnHeader>Agent did</Table.ColumnHeader>
                  <Table.ColumnHeader>Should have done</Table.ColumnHeader>
                  <Table.ColumnHeader>Scope</Table.ColumnHeader>
                  <Table.ColumnHeader>Agent</Table.ColumnHeader>
                  <Table.ColumnHeader>Recorded</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {corrections.map((correction) => (
                  <Table.Row key={correction.id}>
                    <Table.Cell>{correction.instruction ?? correction.id}</Table.Cell>
                    <Table.Cell color="fg.muted">{correction.original ?? ""}</Table.Cell>
                    <Table.Cell color="fg.muted">{correction.corrected ?? ""}</Table.Cell>
                    <Table.Cell color="fg.muted">{correction.scope}</Table.Cell>
                    <Table.Cell color="fg.muted">
                      {correction.agent} ({correction.agentKind})
                    </Table.Cell>
                    <Table.Cell color="fg.muted">{new Date(correction.createdAt).toLocaleString()}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Stack>
    </Stack>
  );
}
