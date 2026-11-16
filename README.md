# TasteLock

An MCP server that turns your corrections into rules for coding agents.

You correct Claude Code once. Codex, Cursor, and any other MCP client read the
same rule. Corrections are stored in a [HydraDB](https://hydradb.com) graph.
[SERV](https://docs.openserv.ai/what-is-serv) reasoning groups them into candidate
rules. A rule becomes active only when a person validates it.

## How it works

1. Connect the TasteLock server to an MCP-capable agent.
2. The agent calls `get_learned_context` before it starts work and applies the validated rules.
3. When you correct the agent, it calls `record_correction` and the correction, with its evidence, is written to HydraDB.
4. `run_learning_pass` reads recent corrections and has SERV propose candidate rules. Duplicates are skipped.
5. You validate a candidate with `decide_rule`. Only then does it apply to every agent.

## Requirements

- Node.js 20 or later
- Docker, for the local HydraDB graph-node
- A SERV account: https://console.openserv.ai/signup

## Setup

```bash
pnpm install
pnpm db:up                     # starts the HydraDB graph-node, Bolt on :7687
cp .env.example .env           # fill in SERV_BASE_URL, SERV_API_KEY, SERV_MODEL
pnpm dev                       # dashboard on http://localhost:3000
```

HydraDB stores the graph in `.hydradb/`, so it survives restarts. Stop it with
`pnpm db:down`.

## Connect an agent

### Claude Code

Add this to `.mcp.json` in your project, or to `~/.claude.json` for every project:

```json
{
  "mcpServers": {
    "tastelock": {
      "command": "npx",
      "args": ["tsx", "/path/to/tastelock/src/mcp/server.ts"]
    }
  }
}
```

### Codex

Add this to `~/.codex/config.toml`:

```toml
[mcp_servers.tastelock]
command = "npx"
args = ["tsx", "/path/to/tastelock/src/mcp/server.ts"]
```

The server reads its HydraDB and SERV settings from this repository's `.env`, so
the working directory of the client does not matter.

## Tools

| Tool | Kind | Purpose |
|---|---|---|
| `get_learned_context` | read | Validated rules that apply to a task |
| `list_rules` | read | Rules by status: validated, candidate, retired |
| `list_corrections` | read | The evidence trail, newest first |
| `search_corrections` | read | Search instructions, before and after output, tags |
| `export_tastelock` | read | JSON and markdown bundle for another agent |
| `record_correction` | write | What the agent did, what you wanted, the instruction |
| `record_feedback` | write | A preference stated in your own words |
| `run_learning_pass` | write | Distil corrections into candidate rules with SERV |
| `decide_rule` | write | Validate or retire a rule, on a person's decision |

## Graph model

Nodes: `Correction`, `LearnedRule`, `Agent`, `Reviewer`, `TaskRef`, `Tag`,
`AuditEvent`.

A rule keeps its sources:
`(LearnedRule)-[:DERIVED_FROM]->(Correction)-[:RECORDED_BY]->(Agent)`, with
`VALIDATED_BY`, `SUPERSEDES`, `APPLIES_TO` and `TAGGED_WITH` for the rest. Any
rule can be traced back to the corrections that produced it.

## Export

```bash
curl localhost:3000/api/export | jq -r .bundle.markdown > tastelock.md
```

Use the file as `tastelock.md` in a repository, or give it to a cloud agent.

## Layout

```
src/contracts/     zod schemas and types shared by the server, API and UI
src/graph/         HydraDB driver and Cypher repositories
src/providers/     SERV reasoning provider, schema forced distillation
src/services/      recording, learning, validation and export use cases
src/mcp/server.ts  the MCP stdio server
src/app/           Next.js dashboard: overview, corrections, rules, export
```

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Next.js landing page |
| `pnpm mcp` | Run the MCP server on stdio |
| `pnpm db:up` | Start the local HydraDB graph-node |
| `pnpm db:down` | Stop the local HydraDB graph-node |
| `pnpm typecheck` | TypeScript check |
| `pnpm build` | Production build |

## Dashboard

`pnpm dev` serves four views against the same graph the agents write to:

| View | Purpose |
|---|---|
| Overview | Counts, add a correction, run the learning pass, review candidates |
| Corrections | Every recorded correction, with search |
| Rules | Candidates, validated and retired rules, with validate and retire actions |
| Export | The markdown bundle for other agents, with a copy button |

A rule only becomes active when you press Validate. The dashboard never activates a rule on its own.

## Notes

- HydraDB runs next to your agents. It is not a hosted service. Point `HYDRADB_URI`
  at a reachable endpoint to read the same graph from a hosted dashboard. The code
  is plain Bolt and Cypher, so it runs against HydraDB, Neo4j Aura, or any
  compatible server.
- There are no mocks in this codebase. Every run talks to a real HydraDB and a
  real SERV. If either is unavailable, the request fails with the reason.
