import { Badge, Box, Card, HStack, Heading, Stack, Table, Text } from "@chakra-ui/react";
import { CodeBlock } from "@/components/CodeBlock";
import { CopyButton } from "@/components/CopyButton";

export const dynamic = "force-dynamic";

const ENDPOINT = "https://tastelock.vercel.app/api/mcp";

export default function ConnectPage() {
  const claudeHttp = JSON.stringify(
    {
      mcpServers: {
        tastelock: {
          type: "http",
          url: ENDPOINT,
          headers: { Authorization: "Bearer TASTELOCK_API_TOKEN" },
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
  -H "Authorization: Bearer $TASTELOCK_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`;

  return (
    <Stack gap="8">
      <Stack gap="2">
        <Heading size="xl">Connect</Heading>
        <Text fontSize="sm" color="fg.muted">
          The MCP server runs two ways: hosted over HTTP for anything that can make a request, or locally over stdio
          for agents that prefer a local process.
        </Text>
      </Stack>

      <Card.Root variant="outline">
        <Card.Header>
          <HStack justify="space-between" flexWrap="wrap" gap="3">
            <Heading size="sm">Hosted endpoint</Heading>
            <CopyButton value={ENDPOINT} label="Copy URL" />
          </HStack>
        </Card.Header>
        <Card.Body gap="4">
          <Stack gap="1">
            <Text fontSize="sm" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
              {ENDPOINT}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              POST only, stateless, JSON responses. Requires the token from this project's <b>.env</b>, also stored as
              a Vercel secret.
            </Text>
          </Stack>
          <CodeBlock>{curlCheck}</CodeBlock>
          <Text fontSize="xs" color="fg.muted">
            Without the token the endpoint answers 401 and nothing is written.
          </Text>
        </Card.Body>
      </Card.Root>

      <Stack gap="4">
        <Heading size="md">Coding agents</Heading>
        <Table.Root size="sm" variant="line">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Client</Table.ColumnHeader>
              <Table.ColumnHeader>Transport</Table.ColumnHeader>
              <Table.ColumnHeader>Where it goes</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Claude Code</Table.Cell>
              <Table.Cell>HTTP</Table.Cell>
              <Table.Cell color="fg.muted">.mcp.json in a project, or ~/.claude.json</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Claude Code</Table.Cell>
              <Table.Cell>stdio</Table.Cell>
              <Table.Cell color="fg.muted">Same files, with a local command</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Codex</Table.Cell>
              <Table.Cell>stdio</Table.Cell>
              <Table.Cell color="fg.muted">~/.codex/config.toml</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Any other MCP client</Table.Cell>
              <Table.Cell>HTTP</Table.Cell>
              <Table.Cell color="fg.muted">The URL above plus the bearer header</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </Stack>

      <Stack gap="3">
        <HStack gap="2">
          <Heading size="sm">Claude Code, hosted</Heading>
          <Badge colorPalette="teal" variant="subtle" fontSize="xs">
            no repo needed
          </Badge>
        </HStack>
        <CodeBlock>{claudeHttp}</CodeBlock>
        <Text fontSize="xs" color="fg.muted">
          Replace TASTELOCK_API_TOKEN with the value from .env.
        </Text>
      </Stack>

      <Stack gap="3">
        <Heading size="sm">Claude Code, local stdio</Heading>
        <CodeBlock>{stdio}</CodeBlock>
      </Stack>

      <Stack gap="3">
        <Heading size="sm">Codex, local stdio</Heading>
        <CodeBlock>{codexStdio}</CodeBlock>
      </Stack>

      <Card.Root variant="outline">
        <Card.Header>
          <HStack gap="2">
            <Heading size="sm">Slack</Heading>
            <Badge colorPalette="gray" variant="subtle" fontSize="xs">
              not built
            </Badge>
          </HStack>
        </Card.Header>
        <Card.Body>
          <Text fontSize="sm" color="fg.muted">
            There is no Slack integration in this codebase, and I am not going to list a config for one that does not
            exist. The tools are reachable over HTTP with a token, so a Slack app could call the same endpoint with a
            slash command or a workflow step. Say the word and I will build it.
          </Text>
        </Card.Body>
      </Card.Root>

      <Box>
        <Text fontSize="xs" color="fg.muted">
          The tools themselves are listed in the README, and every write goes through the same validation gate: an
          agent can propose, only a person activates.
        </Text>
      </Box>
    </Stack>
  );
}
