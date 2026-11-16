# TasteLock

An MCP server that turns your corrections into rules every coding agent follows.

Correct Claude Code once — "we use pnpm here, not npm" — and Codex, Cursor and
your cloud agents get it too. Corrections live in a [HydraDB](https://hydradb.com)
graph; [SERV](https://docs.openserv.ai/what-is-serv) reasoning distils them into
candidate rules; a human validates before anything becomes active.

## The loop

1. **Connect** — point any MCP-capable agent at the TasteLock server (one config entry).
2. **Read first** — before working, the agent calls `get_learned_context` and applies your validated rules.
3. **Correct** — when you correct it, the agent calls `record_correction` and the correction, with evidence, goes into HydraDB.
4. **Distil** — `run_learning_pass` has SERV read recent corrections and propose candidate rules, skipping duplicates.
5. **Validate** — you approve a candidate and it becomes active for every agent. Nothing self-activates.

## Requirements

- Node.js 20+
- Docker (for the local HydraDB graph-node)
- A SERV account for reasoning — https://console.openserv.ai/signup

## Quickstart

```bash
pnpm install
pnpm db:up                     # starts HydraDB graph-node (Bolt on :7687)
cp .env.example .env           # fill in SERV_BASE_URL / SERV_API_KEY / SERV_MODEL
pnpm dev                       # landing page on http://localhost:3000
```

HydraDB is the source of truth. Stop it with `pnpm db:down`; the graph is kept in
`.hydradb/` and survives restarts.

## Connect an agent

### Claude Code

Add to `.mcp.json` in your project (or `~/.claude.json` for every project):

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

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.tastelock]
command = "npx"
args = ["tsx", "/path/to/tastelock/src/mcp/server.ts"]
```

The server reads HydraDB and SERV settings from this repository's `.env`, so it
works no matter which directory the agent launches it from.

## Tools

| Tool | Kind | What it does |
|---|---|---|
| `get_learned_context` | read | Validated rules for a task, plus a markdown block to apply |
| `list_rules` | read | Rules by status — `validated`, `candidate`, `retired` |
| `list_corrections` | read | The evidence trail, newest first |
| `search_corrections` | read | Search instructions, before/after output, tags |
| `export_tastelock` | read | Portable JSON + markdown bundle for another or cloud agent |
| `record_correction` | write | What the agent did, what you wanted, the instruction |
| `record_feedback` | write | A plain preference in your own words |
| `run_learning_pass` | write | Distil corrections into candidate rules with SERV |
| `decide_rule` | write | Validate or retire — on an explicit human decision only |

## Graph model

Everything is a node in HydraDB: `Correction`, `LearnedRule`, `Agent`,
`Reviewer`, `TaskRef`, `Tag`, `AuditEvent`.

A rule is never detached from its reasons:
`(LearnedRule)-[:DERIVED_FROM]->(Correction)-[:RECORDED_BY]->(Agent)`, with
`VALIDATED_BY`, `SUPERSEDES`, `APPLIES_TO` and `TAGGED_WITH` filling in the rest.
That is what makes "why does the agent believe this?" answerable.

## Export

```bash
curl localhost:3000/api/export | jq -r .bundle.markdown > tastelock.md
```

Drop that file in a repository, hand it to a cloud agent, or let another MCP
client read the same graph — the rules are portable.

## Layout

```
src/contracts/     zod schemas + types shared by the server, API and UI
src/graph/         HydraDB driver and Cypher repositories
src/providers/     SERV reasoning provider (schema-forced distillation)
src/services/      the TasteLock use cases — recording, learning, validation, export
src/mcp/server.ts  the MCP stdio server (the product)
src/app/           Next.js landing page: live stats, demo panel, agent config
```

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Next.js landing page |
| `pnpm mcp` | Run the MCP server on stdio |
| `pnpm db:up` / `pnpm db:down` | Start / stop the local HydraDB graph-node |
| `pnpm typecheck` | TypeScript check |
| `pnpm build` | Production build |

## Notes

- HydraDB runs next to your agents; it is not a hosted service. The Vercel
  deployment hosts the landing page only — point `HYDRADB_URI` at a reachable
  graph-node (with TLS) if you want a hosted instance to read the same store.
- There are no mocks in this codebase. The pipeline talks to a real HydraDB and
  real SERV; if either is unavailable, stages fail loudly with the reason.
