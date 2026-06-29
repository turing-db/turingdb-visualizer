# API-contract integration tests

These tests exercise the real functions in `src/api/api.ts` against a **live
TuringDB**, asserting on actual returned data. They are the regression net for
the endpoint→Cypher migration: run the suite, change `api.ts`, re-run, and a
green result means the observable behavior is unchanged.

This is distinct from the Playwright suite in `tests/*.spec.ts`, which mocks
every `/api/*` route and tests UI behavior — it never touches a real backend
and so cannot catch a wrong-data regression in the API layer.

## Running

```bash
npm run test:api          # one-shot
npm run test:api:watch    # watch mode
```

No backend needs to be running, and there's nothing to install or pin: the
harness runs the DB via `uvx turingdb@latest`, so `uv` fetches the **latest**
published `turingdb` at test time into its own cache. The only host requirement
is `uv`. (To test against a specific published version, set `TURINGDB_SPEC`,
e.g. `TURINGDB_SPEC=turingdb==1.34.0 npm run test:api`.)

### Testing against a local (unreleased) turingdb build

When a migration depends on a server feature that isn't published yet (e.g. a
new Cypher statement), point the harness at a locally built binary:

```bash
TURINGDB_BIN=/abs/path/to/turingdb npm run test:api
```

`TURINGDB_BIN` takes precedence over `uvx`/`TURINGDB_SPEC`. A failure on
`uvx turingdb@latest` that passes under `TURINGDB_BIN` is the signal that the
change is blocked on a turingdb release.

## How it works

- `global-setup.ts` — boots `turingdb` (via `uvx turingdb@latest`, daemonized)
  on a throwaway temp dir on port `6699`, waits for readiness, then imports the
  fixture via `LOAD JSONL 'fixture.jsonl' AS vis_test`. Returns a teardown that
  stops the server and removes the temp dir.
- `fixture.jsonl` — the deterministic fixture graph (`vis_test`: 4 nodes,
  3 edges) in Neo4j APOC JSONL format. Edit this file to change the seed data.
- `setup-fetch.ts` — shims `fetch` so the relative `/api/*` URLs in `api.ts`
  resolve to the test server, reproducing the Vite/Express dev proxy's
  `/api`-strip.
- `config.ts` — shared port / base URL / graph name.

## Adding tests

Import the function under test from `@/api/api`, call it with `graph: TEST_GRAPH`,
and assert on the result. Node IDs are auto-assigned, so discover them by a
known property (see `nodeIdByName` in `api.test.ts`) rather than hard-coding.
