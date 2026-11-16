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
    { title: "1. Connect", body: "Add the server to any MCP agent's config." },
    { title: "2. Read", body: "The agent calls get_learned_context before it starts work." },
    { title: "3. Correct", body: "You correct the agent. It records the correction with evidence." },
    { title: "4. Distil", body: "SERV reads recent corrections and proposes candidate rules." },
    { title: "5. Validate", body: "You approve a rule. It becomes active for every connected agent." },
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
            MCP stdio
          </Badge>
        </HStack>
        <Heading size={{ base: "2xl", md: "3xl" }} letterSpacing="tight" maxWidth="820px">
          Corrections become rules your agents follow.
        </Heading>
        <Text fontSize={{ base: "md", md: "lg" }} color="fg.muted" maxWidth="760px">
          TasteLock runs as an MCP server. An agent records your correction into a HydraDB graph. SERV groups repeated
          corrections into candidate rules. You validate a rule once, and every connected agent reads it before
          starting work.
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 2, lg: 4 }} gap="4">
        {[
          { label: "Corrections stored", value: String(tally?.corrections ?? 0) },
          { label: "Validated rules", value: String(tally?.rules.validated ?? 0) },
          { label: "Candidates awaiting review", value: String(tally?.rules.candidates ?? 0) },
          { label: "Retired rules", value: String(tally?.rules.retired ?? 0) },
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
        <Heading size="lg">Try it</Heading>
        <Text fontSize="sm" color="fg.muted" maxWidth="760px">
          Record a correction, then run the learning pass. Both write to the graph.
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
            ? "Replace /path/to/tastelock with the directory where you cloned the repo. The server reads its HydraDB and SERV settings from that directory's .env."
            : `The server reads its HydraDB and SERV settings from ${repoRoot}/.env, so it works from any directory.`}
        </Text>
      </Stack>

      <Stack gap="5">
        <Heading size="lg">Tools</Heading>
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
          <Stack gap="2">
            <Text fontSize="sm" fontWeight="semibold">
              Read
            </Text>
            <List.Root fontSize="sm" color="fg.muted" gap="1">
              <List.Item>get_learned_context: rules that apply to a task</List.Item>
              <List.Item>list_rules: validated, candidate and retired rules</List.Item>
              <List.Item>list_corrections, search_corrections: the evidence trail</List.Item>
              <List.Item>export_tastelock: markdown bundle for another agent</List.Item>
            </List.Root>
          </Stack>
          <Stack gap="2">
            <Text fontSize="sm" fontWeight="semibold">
              Write
            </Text>
            <List.Root fontSize="sm" color="fg.muted" gap="1">
              <List.Item>record_correction: what the agent did and what you wanted</List.Item>
              <List.Item>record_feedback: a preference in your own words</List.Item>
              <List.Item>run_learning_pass: distil corrections into candidates</List.Item>
              <List.Item>decide_rule: validate or retire, on your decision only</List.Item>
            </List.Root>
          </Stack>
        </SimpleGrid>
      </Stack>

      <Stack gap="5">
        <Heading size="lg">Active rules</Heading>
        {validatedRules.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            No validated rules yet.
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
        <Heading size="lg">Recent corrections</Heading>
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
        <Heading size="lg">Export</Heading>
        <Text fontSize="sm" color="fg.muted" maxWidth="760px">
          export_tastelock returns this markdown. Use it as tastelock.md in a repository, or hand it to a cloud agent.
        </Text>
        <CodeBlock>{bundle?.markdown ?? "# No validated rules yet."}</CodeBlock>
      </Stack>
    </Stack>
  );
}
