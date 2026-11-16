import { Alert, Badge, Box, HStack, Stack, Table, Text } from "@chakra-ui/react";
import { CodeBlock } from "@/components/CodeBlock";
import { CopyButton } from "@/components/CopyButton";
import { TokenReveal } from "@/components/TokenReveal";
import { PageHeader, Panel, StatusBadge, Td, Th } from "@/components/layout";
import { env } from "@/env";

export const dynamic = "force-dynamic";

const ENDPOINT = "https://tastelock.vercel.app/api/mcp";

export default function ConnectPage() {
  const token = env().TASTELOCK_API_TOKEN;

  const claudeHttp = JSON.stringify(
    {
      mcpServers: {
        tastelock: {
          type: "http",
          url: ENDPOINT,
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    },
    null,
    2,
  );

  const stdio = JSON.stringify(
    {
      mcpServers: {
        tastelock: {
          command: "npx",
          args: ["tsx", "/path/to/tastelock/src/mcp/server.ts"],
        },
      },
    },
    null,
    2,
  );

  const codexStdio = `[mcp_servers.tastelock]
command = "npx"
args = ["tsx", "/path/to/tastelock/src/mcp/server.ts"]`;

  const curlCheck = `curl -s -X POST ${ENDPOINT} \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`;

  return (
    <Stack gap="6">
      <PageHeader
        title="Connect"
        description="TasteLock runs two ways: hosted over HTTP for anything that can make a request, or locally over stdio for agents that prefer a local process."
      />

      <Panel
        title="Hosted endpoint"
        description="POST only, stateless, JSON responses."
        action={<CopyButton value={ENDPOINT} label="Copy URL" />}
      >
        <Stack gap="4">
          <Text fontSize="sm" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
            {ENDPOINT}
          </Text>
          <CodeBlock>{curlCheck}</CodeBlock>
        </Stack>
      </Panel>

      <Panel
        title="The token"
        description="This is just a password for the URL above. Without it, anyone who finds the link could write to your graph."
      >
        <Stack gap="3">
          <TokenReveal token={token} />
          <Alert.Root status="warning" size="sm">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description fontSize="xs">
                Because this page is not itself protected, revealing the token here shows it to anyone who opens this
                page. It is the same value in this project's .env and in Vercel. Ask me and I will gate the dashboard
                behind the token, or rotate it.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        </Stack>
      </Panel>

      <Panel title="Coding agents" padded={false}>
        <Box overflowX="auto" paddingX="5" paddingY="2">
          <Table.Root size="sm" variant="line" minWidth="720px">
            <Table.Header>
              <Table.Row>
                <Th>Client</Th>
                <Th>Transport</Th>
                <Th>Where it goes</Th>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row _hover={{ background: "bg.subtle" }}>
                <Td>Claude Code</Td>
                <Td>
                  <StatusBadge tone="teal">HTTP</StatusBadge>
                </Td>
                <Td muted>.mcp.json in a project, or ~/.claude.json</Td>
              </Table.Row>
              <Table.Row _hover={{ background: "bg.subtle" }}>
                <Td>Claude Code</Td>
                <Td>
                  <StatusBadge tone="gray">stdio</StatusBadge>
                </Td>
                <Td muted>Same files, with a local command</Td>
              </Table.Row>
              <Table.Row _hover={{ background: "bg.subtle" }}>
                <Td>Codex</Td>
                <Td>
                  <StatusBadge tone="gray">stdio</StatusBadge>
                </Td>
                <Td muted>~/.codex/config.toml</Td>
              </Table.Row>
              <Table.Row _hover={{ background: "bg.subtle" }}>
                <Td>Any other MCP client</Td>
                <Td>
                  <StatusBadge tone="teal">HTTP</StatusBadge>
                </Td>
                <Td muted>The URL above with a bearer header</Td>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Box>
      </Panel>

      <Panel title="Claude Code, hosted" description="No clone needed. Paste this into .mcp.json." action={<CopyButton value={claudeHttp} />}>
        <CodeBlock>{claudeHttp}</CodeBlock>
      </Panel>

      <Panel title="Claude Code, local stdio" description="Needs the repository present." action={<CopyButton value={stdio} />}>
        <CodeBlock>{stdio}</CodeBlock>
      </Panel>

      <Panel title="Codex, local stdio" description="Goes in ~/.codex/config.toml." action={<CopyButton value={codexStdio} />}>
        <CodeBlock>{codexStdio}</CodeBlock>
      </Panel>

      <Panel title="Slack" description="Not built. No config, because nothing exists to point at.">
        <Stack gap="2">
          <HStack gap="2">
            <Badge colorPalette="gray" variant="subtle" borderRadius="full">
              not built
            </Badge>
          </HStack>
          <Text fontSize="sm" color="fg.muted">
            The tools are reachable over HTTP with the token, so a Slack app could call the same endpoint from a slash
            command or a workflow step. Say the word and I will build it rather than describe it.
          </Text>
        </Stack>
      </Panel>
    </Stack>
  );
}
