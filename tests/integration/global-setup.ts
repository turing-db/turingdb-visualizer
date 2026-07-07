// Vitest globalSetup: boot a real TuringDB on a throwaway data dir, import the
// fixture graph from a JSONL file, then hand back a teardown that stops the
// server and deletes the dir.
//
// Choosing the turingdb binary (in priority order):
//   1. TURINGDB_BIN=/path/to/turingdb — run that binary directly. Use this to
//      test against a *local, unreleased* server build (e.g. a migration that
//      relies on a Cypher statement not yet published to PyPI).
//   2. otherwise `uvx <TURINGDB_SPEC>` — uv fetches the binary at test time;
//      TURINGDB_SPEC defaults to `turingdb@latest` (latest published, no lock).
// Either way the only host requirement is uv (or the local binary).
//
// We run the server with `-demon` (daemonized): in the foreground it shuts
// down as soon as its stdin hits EOF, which happens immediately under a
// non-interactive spawn. The daemon is stopped on teardown with
// `turingdb stop -turing-dir <dir>` (the same dir is required to find it).
import { spawn } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { API_BASE, TEST_GRAPH, TEST_PORT } from './config'

const here = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE = 'fixture.jsonl'
// A local binary path takes precedence; otherwise `uvx <spec>` runs the CLI
// from an ephemeral, always-latest env.
const TURINGDB_BIN = process.env.TURINGDB_BIN
const TURINGDB_SPEC = process.env.TURINGDB_SPEC ?? 'turingdb@latest'

/** Run a child process to completion, rejecting on a non-zero exit. */
function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: here, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    child.stdout?.on('data', (d) => (out += d))
    child.stderr?.on('data', (d) => (out += d))
    child.on('error', reject)
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`\`${cmd} ${args.join(' ')}\` exited ${code}\n${out}`)),
    )
  })
}

/** Invoke the turingdb CLI — the local binary if TURINGDB_BIN is set, else uvx. */
function turingdb(args: string[]): Promise<void> {
  return TURINGDB_BIN ? run(TURINGDB_BIN, args) : run('uvx', [TURINGDB_SPEC, ...args])
}

/** Resolve once the server answers an HTTP request (any response = up). */
async function waitForServer(timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      await fetch(`${API_BASE}/query?graph=`, { method: 'POST', body: 'LIST GRAPH' })
      return
    } catch {
      await new Promise((r) => setTimeout(r, 300))
    }
  }
  throw new Error(`TuringDB did not start on ${API_BASE} within ${timeoutMs}ms`)
}

/**
 * Import the fixture graph from JSONL. `LOAD JSONL ... AS <graph>` is graphless
 * (sent with an empty graph param) and loads the new graph into memory in one
 * shot — no change/commit workflow needed.
 */
async function loadFixture(): Promise<void> {
  const res = await fetch(`${API_BASE}/query?graph=`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: `LOAD JSONL '${FIXTURE}' AS ${TEST_GRAPH}`,
  })
  const json = (await res.json()) as { error?: string; error_details?: string }
  if (json.error) {
    throw new Error(`LOAD JSONL failed: ${json.error} ${json.error_details ?? ''}`)
  }
}

export default async function setup() {
  const dataDir = mkdtempSync(path.join(tmpdir(), 'turingdb-it-'))

  const stop = async () => {
    await turingdb(['stop', '-turing-dir', dataDir]).catch(() => {})
    rmSync(dataDir, { recursive: true, force: true })
  }

  try {
    // LOAD JSONL reads from the server's <turing-dir>/data subdirectory.
    mkdirSync(path.join(dataDir, 'data'), { recursive: true })
    copyFileSync(path.join(here, FIXTURE), path.join(dataDir, 'data', FIXTURE))

    await turingdb([
      'start',
      '-turing-dir',
      dataDir,
      '-p',
      String(TEST_PORT),
      '-i',
      '127.0.0.1',
      '-demon',
    ])
    await waitForServer()
    await loadFixture()
  } catch (err) {
    await stop()
    throw err
  }

  return stop
}
