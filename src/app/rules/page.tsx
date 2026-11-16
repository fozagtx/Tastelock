import { Badge, Box, Button, HStack, Heading, Link, Stack, Table, Text } from "@chakra-ui/react";
import { RuleActions } from "@/components/RuleActions";
import type { LearnedRuleStatus } from "@/contracts";
import { listRules } from "@/services/tastelock";

export const dynamic = "force-dynamic";

const FILTERS: { value: string; label: string }[] = [
  { value: "candidate", label: "Candidates" },
  { value: "validated", label: "Validated" },
  { value: "retired", label: "Retired" },
  { value: "all", label: "All" },
];

const TONE: Record<LearnedRuleStatus, "teal" | "orange" | "gray"> = {
  validated: "teal",
  candidate: "orange",
  retired: "gray",
};

export default async function RulesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = status && FILTERS.some((filter) => filter.value === status) ? status : "candidate";
  const rules = await listRules(active === "all" ? {} : { status: active as LearnedRuleStatus });

  return (
    <Stack gap="8">
      <Stack gap="2">
        <Heading size="xl">Rules</Heading>
        <Text fontSize="sm" color="fg.muted">
          Validated rules are read by every connected agent. Candidates wait for your decision.
        </Text>
      </Stack>

      <HStack gap="2" flexWrap="wrap">
        {FILTERS.map((filter) => (
          <Button
            key={filter.value}
            asChild
            size="sm"
            variant={active === filter.value ? "solid" : "outline"}
            colorPalette={active === filter.value ? "teal" : "gray"}
          >
            <Link href={`/rules?status=${filter.value}`}>{filter.label}</Link>
          </Button>
        ))}
      </HStack>

      {rules.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          No {active === "all" ? "" : active} rules.
        </Text>
      ) : (
        <Box overflowX="auto">
          <Table.Root size="sm" variant="line" minWidth="900px">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Rule</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Scope</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Confidence</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Support</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Evidence</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Decision</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rules.map((rule) => (
                <Table.Row key={rule.id}>
                  <Table.Cell>{rule.text}</Table.Cell>
                  <Table.Cell>
                    <Badge colorPalette={TONE[rule.status]} variant="subtle">
                      {rule.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell color="fg.muted">{rule.scope}</Table.Cell>
                  <Table.Cell textAlign="end">{rule.confidence.toFixed(2)}</Table.Cell>
                  <Table.Cell textAlign="end">{rule.support}</Table.Cell>
                  <Table.Cell textAlign="end" color="fg.muted">
                    {rule.derivedFrom.length} correction(s)
                  </Table.Cell>
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
  );
}
