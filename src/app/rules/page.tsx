import { Box, Button, HStack, Link, Stack, Table } from "@chakra-ui/react";
import { RuleActions } from "@/components/RuleActions";
import { EmptyState, PageHeader, Panel, StatusBadge, Td, Th } from "@/components/layout";
import type { LearnedRuleStatus } from "@/contracts";
import { listRules } from "@/services/tastelock";

export const dynamic = "force-dynamic";

const FILTERS = [
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
    <Stack gap="6">
      <PageHeader
        title="Rules"
        description="Validated rules are read by every connected agent. Candidates wait for your decision."
        action={
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
        }
      />

      <Panel title={`${rules.length} ${active === "all" ? "" : active} rule(s)`} padded={false}>
        {rules.length === 0 ? (
          <Box paddingX="5" paddingBottom="2">
            <EmptyState
              title={`No ${active === "all" ? "" : active} rules`}
              description="Run the learning pass on the Overview page to generate candidates."
            />
          </Box>
        ) : (
          <Box overflowX="auto" paddingX="5" paddingY="2">
            <Table.Root size="sm" variant="line" minWidth="980px">
              <Table.Header>
                <Table.Row>
                  <Th>Rule</Th>
                  <Th>Status</Th>
                  <Th>Scope</Th>
                  <Th align="end">Confidence</Th>
                  <Th align="end">Support</Th>
                  <Th align="end">Evidence</Th>
                  <Th align="end">Decision</Th>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rules.map((rule) => (
                  <Table.Row key={rule.id} _hover={{ background: "bg.subtle" }}>
                    <Td wrap>{rule.text}</Td>
                    <Td>
                      <StatusBadge tone={TONE[rule.status]}>{rule.status}</StatusBadge>
                    </Td>
                    <Td muted>{rule.scope}</Td>
                    <Td align="end">{rule.confidence.toFixed(2)}</Td>
                    <Td align="end">{rule.support}</Td>
                    <Td align="end" muted>
                      {rule.derivedFrom.length}
                    </Td>
                    <Td>
                      <RuleActions ruleId={rule.id} status={rule.status} />
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
