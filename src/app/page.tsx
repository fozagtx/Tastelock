import { Badge, Box, Card, HStack, Heading, SimpleGrid, Stack, Table, Text } from "@chakra-ui/react";
import { CorrectionForm } from "@/components/CorrectionForm";
import { LearningPassButton } from "@/components/LearningPassButton";
import { RuleActions } from "@/components/RuleActions";
import { verifyGraph } from "@/graph/client";
import { listCorrections, listRules, stats } from "@/services/tastelock";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const graph = await verifyGraph();

  const [tally, candidates, corrections] = graph.ok
    ? await Promise.all([stats(), listRules({ status: "candidate" }), listCorrections({ limit: 8 })])
    : [null, [], []];

  return (
    <Stack gap="8">
      <Stack gap="2">
        <Heading size="xl">Overview</Heading>
        <Text fontSize="sm" color="fg.muted">
          Corrections become rules. Nothing activates without validation.
        </Text>
        <HStack gap="2">
          <Badge colorPalette={graph.ok ? "teal" : "red"} variant="subtle">
            {graph.ok ? "graph connected" : "graph unavailable"}
          </Badge>
          {!graph.ok && (
            <Text fontSize="xs" color="fg.muted">
              {graph.detail}
            </Text>
          )}
        </HStack>
      </Stack>

      <SimpleGrid columns={{ base: 2, lg: 4 }} gap="4">
        {[
          { label: "Corrections", value: String(tally?.corrections ?? 0) },
          { label: "Validated rules", value: String(tally?.rules.validated ?? 0) },
          { label: "Candidates", value: String(tally?.rules.candidates ?? 0) },
          { label: "Retired", value: String(tally?.rules.retired ?? 0) },
        ].map((stat) => (
          <Card.Root key={stat.label} variant="subtle">
            <Card.Body gap="1">
              <Text fontSize="xs" color="fg.muted">
                {stat.label}
              </Text>
              <Heading size="lg">{stat.value}</Heading>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>

      <Card.Root variant="outline">
        <Card.Header>
          <Heading size="sm">Add a correction</Heading>
        </Card.Header>
        <Card.Body>
          <CorrectionForm compact />
        </Card.Body>
      </Card.Root>

      <Card.Root variant="outline">
        <Card.Header>
          <Heading size="sm">Learning pass</Heading>
        </Card.Header>
        <Card.Body gap="3">
          <Text fontSize="sm" color="fg.muted">
            Reads recent corrections and proposes candidate rules. Duplicates are skipped. Proposals stay inactive
            until you validate them below.
          </Text>
          <LearningPassButton />
        </Card.Body>
      </Card.Root>

      <Stack gap="4">
        <Heading size="md">Candidates awaiting review</Heading>
        {candidates.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            No candidates. Run the learning pass after recording some corrections.
          </Text>
        ) : (
          <Box overflowX="auto">
            <Table.Root size="sm" variant="line" minWidth="720px">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Rule</Table.ColumnHeader>
                  <Table.ColumnHeader>Scope</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Confidence</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Support</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Decision</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {candidates.map((rule) => (
                  <Table.Row key={rule.id}>
                    <Table.Cell>{rule.text}</Table.Cell>
                    <Table.Cell color="fg.muted">{rule.scope}</Table.Cell>
                    <Table.Cell textAlign="end">{rule.confidence.toFixed(2)}</Table.Cell>
                    <Table.Cell textAlign="end">{rule.support}</Table.Cell>
                    <Table.Cell>
                      <RuleActions ruleId={rule.id} status={rule.status} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Stack>

      <Stack gap="4">
        <Heading size="md">Recent corrections</Heading>
        {corrections.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            Nothing recorded yet.
          </Text>
        ) : (
          <Box overflowX="auto">
            <Table.Root size="sm" variant="line" minWidth="720px">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Instruction</Table.ColumnHeader>
                  <Table.ColumnHeader>Scope</Table.ColumnHeader>
                  <Table.ColumnHeader>Agent</Table.ColumnHeader>
                  <Table.ColumnHeader>Recorded</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {corrections.map((correction) => (
                  <Table.Row key={correction.id}>
                    <Table.Cell>
                      {correction.instruction ?? correction.corrected ?? correction.original ?? correction.id}
                    </Table.Cell>
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
