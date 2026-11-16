import {
  Badge,
  Box,
  Card,
  Heading,
  HStack,
  List,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { DemoPanel } from "@/components/DemoPanel";
import { servConfigured } from "@/env";
import { verifyGraph } from "@/graph/client";
import { exportBundle, listCorrections, listRules, stats } from "@/services/tastelock";

export const dynamic = "force-dynamic";

function CodeBlock({ children }: { children: string }) {
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
      margin="0"
      color="fg"
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
    >
      {children}
    </Box>
  );
}

export default async function Home() {
  const hosted = Boolean(process.env.VERCEL);
  const repoRoot = hosted ? "/path/to/tastelock" : process.cwd();
  const graph = await verifyGraph();

  const [tally, validatedRules, corrections, bundle] = graph.ok
    ? await Promise.all([
        stats(),
        listRules({ status: "validated" }),
        listCorrections({ limit: 8 }),
        exportBundle({}),
      ])
    : [null, [], [], null];

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        tastelock: {
          command: "npx",
          args: ["tsx", `${repoRoot}/src/mcp/server.ts`],
        },
      },
    },
    null,
    2,
  );

  const codexConfig = `[mcp_servers.tastelock]
command = "npx"
args = ["tsx", "${repoRoot}/src/mcp/server.ts"]`;

  const steps = [
    { title: "1 · Connect", body: "Point any MCP-capable agent at the TasteLock server — one config entry." },
    { title: "2 · Read first", body: "Before working, the agent calls get_learned_context and applies your rules." },
    { title: "3 · Get corrected", body: "When you correct it, the correction and its evidence go into HydraDB." },
    { title: "4 · Distil", body: "SERV reads recent corrections and proposes candidate rules, skipping duplicates." },
    { title: "5 · Validate", body: "You approve a candidate and it becomes active for every agent. Nothing self-activates." },
  ];

  return (
    <Stack gap={{ base: "10", md: "14" }}>
      <Stack gap="5">
        <HStack gap="2" flexWrap="wrap">
          <Badge colorPalette="teal" variant="subtle">
            HydraDB graph
          </Badge>
          <Badge colorPalette="purple" variant="subtle">
            SERV reasoning
          </Badge>
          <Badge colorPalette="blue" variant="subtle">
            MCP over stdio
          </Badge>
        </HStack>
        <Heading size={{ base: "2xl", md: "3xl" }} letterSpacing="tight" maxWidth="820px">
          Your agents stop repeating mistakes.
        </Heading>
        <Text fontSize={{ base: "md", md: "lg" }} color="fg.muted" maxWidth="760px">
          TasteLock is an MCP server. When you correct an agent — Claude Code, Codex, Cursor, anything that speaks MCP
          — the correction is written into a HydraDB graph. SERV distils those corrections into candidate rules, you
          validate them, and from then on every agent reads the same rules before it starts work.
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 2, lg: 4 }} gap="4">
        {[
          { label: "Corrections stored", value: String(tally?.corrections ?? 0) },
          { label: "Validated rules", value: String(tally?.rules.validated ?? 0) },
          { label: "Candidates awaiting review", value: String(tally?.rules.candidates ?? 0) },
          {
            label: "Graph / SERV",
            value: graph.ok ? (servConfigured() ? "ready" : "graph only") : "offline",
            tone: graph.ok ? undefined : "red.solid",
          },
        ].map((stat) => (
          <Card.Root key={stat.label} variant="subtle">
            <Card.Body gap="1">
              <Text fontSize="xs" color="fg.muted">
                {stat.label}
              </Text>
              <Heading size="lg" color={stat.tone}>
                {stat.value}
              </Heading>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>

      {!graph.ok && (
        <Card.Root variant="subtle" colorPalette="red">
          <Card.Body>
            <Text fontSize="sm" color="fg">
              {graph.detail}
            </Text>
          </Card.Body>
        </Card.Root>
      )}

      <Stack gap="5">
        <Heading size="lg">How it works</Heading>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
          {steps.map((step) => (
            <Card.Root key={step.title} variant="subtle" minWidth="0">
              <Card.Body gap="2">
                <Text fontSize="sm" fontWeight="semibold">
                  {step.title}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {step.body}
                </Text>
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>
      </Stack>

      <Stack gap="5">
        <Heading size="lg">Watch it work</Heading>
        <Text fontSize="sm" color="fg.muted" maxWidth="760px">
          Record a correction the way an agent would, then run the learning pass to see SERV turn it into a candidate
          rule. Every write goes straight into the graph.
        </Text>
        <DemoPanel />
      </Stack>

      <Stack gap="5">
        <Heading size="lg">Connect an agent</Heading>
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
          <Stack gap="2" minWidth="0">
            <Text fontSize="sm" fontWeight="semibold">
              Claude Code
            </Text>
            <Text fontSize="xs" color="fg.muted">
              Add to .mcp.json in your project, or ~/.claude.json for every project.
            </Text>
            <CodeBlock>{claudeConfig}</CodeBlock>
          </Stack>
          <Stack gap="2" minWidth="0">
            <Text fontSize="sm" fontWeight="semibold">
              Codex
            </Text>
            <Text fontSize="xs" color="fg.muted">
              Add to ~/.codex/config.toml.
            </Text>
            <CodeBlock>{codexConfig}</CodeBlock>
          </Stack>
        </SimpleGrid>
        <Text fontSize="xs" color="fg.muted">
          {hosted
            ? "Replace /path/to/tastelock with the directory where you cloned the repo. The server reads HydraDB and SERV settings from that directory's .env, so it works from any working directory."
            : `The server reads HydraDB and SERV settings from ${repoRoot}/.env, so it works no matter which directory the agent launches it from.`}
        </Text>
      </Stack>

      <Stack gap="5">
        <Heading size="lg">Tools the agent gets</Heading>
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
          <Stack gap="2">
            <Text fontSize="sm" fontWeight="semibold">
              Read
            </Text>
            <List.Root fontSize="sm" color="fg.muted" gap="1">
              <List.Item>get_learned_context — the rules to follow before working</List.Item>
              <List.Item>list_rules — validated, candidate and retired rules</List.Item>
              <List.Item>list_corrections / search_corrections — the evidence trail</List.Item>
              <List.Item>export_tastelock — portable bundle for other or cloud agents</List.Item>
            </List.Root>
          </Stack>
          <Stack gap="2">
            <Text fontSize="sm" fontWeight="semibold">
              Write
            </Text>
            <List.Root fontSize="sm" color="fg.muted" gap="1">
              <List.Item>record_correction — what it did, what you wanted, the instruction</List.Item>
              <List.Item>record_feedback — a plain preference in your own words</List.Item>
              <List.Item>run_learning_pass — distil corrections into candidates</List.Item>
              <List.Item>decide_rule — validate or retire, on your say-so only</List.Item>
            </List.Root>
          </Stack>
        </SimpleGrid>
      </Stack>

      <Stack gap="5">
        <Heading size="lg">Active rules</Heading>
        {validatedRules.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            No validated rules yet. Record a correction above and run the learning pass.
          </Text>
        ) : (
          <Box overflowX="auto">
            <Table.Root size="sm" variant="line" minWidth="640px">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Rule</Table.ColumnHeader>
                  <Table.ColumnHeader>Scope</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Confidence</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Support</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {validatedRules.map((rule) => (
                  <Table.Row key={rule.id}>
                    <Table.Cell>{rule.text}</Table.Cell>
                    <Table.Cell color="fg.muted">{rule.scope}</Table.Cell>
                    <Table.Cell textAlign="end">{rule.confidence.toFixed(2)}</Table.Cell>
                    <Table.Cell textAlign="end">{rule.support}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Stack>

      <Stack gap="5">
        <Heading size="lg">Latest corrections</Heading>
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

      <Stack gap="5">
        <Heading size="lg">Export to any agent</Heading>
        <Text fontSize="sm" color="fg.muted" maxWidth="760px">
          export_tastelock returns this markdown. Drop it into a repository as tastelock.md, hand it to a cloud agent,
          or let another MCP client read the same graph.
        </Text>
        <CodeBlock>{bundle?.markdown ?? "HydraDB is offline — start it with pnpm db:up."}</CodeBlock>
      </Stack>
    </Stack>
  );
}
