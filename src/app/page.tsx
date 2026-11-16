import { Box, HStack, SimpleGrid, Stack, Table, Text } from "@chakra-ui/react";
import { CorrectionForm } from "@/components/CorrectionForm";
import { LearningPassButton } from "@/components/LearningPassButton";
import { RuleActions } from "@/components/RuleActions";
import { EmptyState, PageHeader, Panel, StatCard, StatusBadge, Td, Th } from "@/components/layout";
import { verifyGraph } from "@/graph/client";
import { listCorrections, listRules, stats } from "@/services/tastelock";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const graph = await verifyGraph();

  const [tally, candidates, corrections] = graph.ok
    ? await Promise.all([stats(), listRules({ status: "candidate" }), listCorrections({ limit: 6 })])
    : [null, [], []];

  return (
    <Stack gap="6">
      <PageHeader
        title="Overview"
        description="Corrections become rules. Nothing activates until a person validates it."
        action={
          <HStack gap="2">
            <StatusBadge tone={graph.ok ? "teal" : "red"}>{graph.ok ? "graph connected" : "graph offline"}</StatusBadge>
            <LearningPassButton />
          </HStack>
        }
      />

      <SimpleGrid columns={{ base: 2, lg: 4 }} gap="4">
        <StatCard label="Corrections" value={String(tally?.corrections ?? 0)} accent="blue.solid" />
        <StatCard label="Validated rules" value={String(tally?.rules.validated ?? 0)} accent="teal.solid" />
        <StatCard label="Candidates" value={String(tally?.rules.candidates ?? 0)} accent="orange.solid" />
        <StatCard label="Retired" value={String(tally?.rules.retired ?? 0)} accent="gray.400" />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6" alignItems="start">
        <Panel title="Add a correction" description="What an agent got wrong, and what you wanted.">
          <CorrectionForm compact />
        </Panel>

        <Panel
          title="Candidates awaiting review"
          description="Proposed by the learning pass. Validate to activate for every agent."
        >
          {candidates.length === 0 ? (
            <EmptyState
              title="No candidates"
              description="Record a few corrections, then run the learning pass to get proposals."
            />
          ) : (
            <Stack gap="3">
              {candidates.map((rule) => (
                <Box key={rule.id} borderWidth="1px" borderColor="border.muted" borderRadius="md" padding="3">
                  <Text fontSize="sm" marginBottom="2">
                    {rule.text}
                  </Text>
                  <HStack justify="space-between" gap="3" flexWrap="wrap">
                    <HStack gap="3">
                      <StatusBadge tone="orange">{rule.scope}</StatusBadge>
                      <Text fontSize="xs" color="fg.muted">
                        confidence {rule.confidence.toFixed(2)}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        support {rule.support}
                      </Text>
                    </HStack>
                    <RuleActions ruleId={rule.id} status={rule.status} />
                  </HStack>
                </Box>
              ))}
            </Stack>
          )}
        </Panel>
      </SimpleGrid>

      <Panel title="Recent corrections" padded={false}>
        {corrections.length === 0 ? (
          <Box paddingX="5" paddingBottom="2">
            <EmptyState title="Nothing recorded yet" description="Corrections appear here as soon as an agent records one." />
          </Box>
        ) : (
          <Box overflowX="auto" paddingX="5" paddingY="2">
            <Table.Root size="sm" variant="line" minWidth="720px">
              <Table.Header>
                <Table.Row>
                  <Th>Instruction</Th>
                  <Th>Scope</Th>
                  <Th>Agent</Th>
                  <Th align="end">Recorded</Th>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {corrections.map((correction) => (
                  <Table.Row key={correction.id} _hover={{ background: "bg.subtle" }}>
                    <Td wrap>{correction.instruction ?? correction.corrected ?? correction.original ?? correction.id}</Td>
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
    </Stack>
  );
}
