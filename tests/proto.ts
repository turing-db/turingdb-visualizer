// Test-side encoder for TuringDB's binary protocol, so the Playwright mocks can
// answer the app's `turingdb` client the way a server would. It covers the
// column kinds the app reads: integers, strings, booleans and lists of those.
//
// A response is [type u8][dataLen u32le][payload] packets: CHUNK_HEADER (the
// columns), CHUNK (the rows), END_CHUNK (the row count), END (exec time), or
// ERROR (status byte + message) followed by END.

const MESSAGE_CHUNK_HEADER = 0
const MESSAGE_CHUNK = 1
const MESSAGE_END_CHUNK = 2
const MESSAGE_END = 3
const MESSAGE_ERROR = 4

const TYPE_INT64 = 1
const TYPE_STRING = 3
const TYPE_BOOL = 4
const TYPE_LIST_VIEW = 6
const ENCODING_VECTOR = 0

const TAG_INT = 0
const TAG_BOOL = 3
const TAG_STRING = 4
const TAG_LIST_VIEW = 6

// Index = the status byte of an ERROR packet (base/QueryStatus.h).
const QUERY_STATUSES = [
  'OK',
  'GRAPH_NOT_FOUND',
  'PARSE_ERROR',
  'ANALYZE_ERROR',
  'PLAN_ERROR',
  'EXEC_ERROR',
  'COMMIT_NOT_FOUND',
  'COMMIT_NOT_LOADED',
  'CHANGE_NOT_FOUND',
] as const

export type QueryStatus = (typeof QUERY_STATUSES)[number]
export type Cell = number | string | boolean | Cell[]

const utf8 = new TextEncoder()

class Writer {
  private bytes: number[] = []

  u8(value: number) {
    this.bytes.push(value & 0xff)
  }

  u32(value: number) {
    const view = new DataView(new ArrayBuffer(4))
    view.setUint32(0, value, true)
    this.raw(new Uint8Array(view.buffer))
  }

  i64(value: number) {
    const view = new DataView(new ArrayBuffer(8))
    view.setBigInt64(0, BigInt(value), true)
    this.raw(new Uint8Array(view.buffer))
  }

  f32(value: number) {
    const view = new DataView(new ArrayBuffer(4))
    view.setFloat32(0, value, true)
    this.raw(new Uint8Array(view.buffer))
  }

  string(text: string) {
    const encoded = utf8.encode(text)
    this.u32(encoded.length)
    this.raw(encoded)
  }

  raw(bytes: Uint8Array) {
    for (const byte of bytes) this.bytes.push(byte)
  }

  packet(type: number): Uint8Array {
    const out = new Writer()
    out.u8(type)
    out.u32(this.bytes.length)
    out.raw(Uint8Array.from(this.bytes))
    return Uint8Array.from(out.bytes)
  }
}

function columnType(column: Cell[]): number {
  const first = column[0]
  if (typeof first === 'string') return TYPE_STRING
  if (typeof first === 'boolean') return TYPE_BOOL
  if (Array.isArray(first)) return TYPE_LIST_VIEW
  return TYPE_INT64
}

// The server's in-memory size of a list's elements, which the wire carries
// ahead of them: 16 per string or nested list, 8 per integer, 1 per boolean.
function listByteSize(list: Cell[]): number {
  return list.reduce<number>((size, cell) => {
    if (typeof cell === 'boolean') return size + 1
    if (typeof cell === 'number') return size + 8
    return size + 16
  }, 0)
}

function writeList(out: Writer, list: Cell[]) {
  out.u32(list.length)
  out.u32(listByteSize(list))
  for (const cell of list) {
    if (typeof cell === 'string') {
      out.u8(TAG_STRING)
      out.string(cell)
    } else if (typeof cell === 'boolean') {
      out.u8(TAG_BOOL)
      out.u8(cell ? 1 : 0)
    } else if (typeof cell === 'number') {
      out.u8(TAG_INT)
      out.i64(cell)
    } else {
      out.u8(TAG_LIST_VIEW)
      writeList(out, cell)
    }
  }
}

function writeColumn(out: Writer, type: number, column: Cell[]) {
  out.u32(column.length)
  for (const cell of column) {
    if (type === TYPE_STRING) out.string(cell as string)
    else if (type === TYPE_BOOL) out.u8(cell ? 1 : 0)
    else if (type === TYPE_LIST_VIEW) writeList(out, cell as Cell[])
    else out.i64(cell as number)
  }
}

function concat(packets: Uint8Array[]): Buffer {
  return Buffer.concat(packets)
}

function endPacket(): Uint8Array {
  const end = new Writer()
  end.f32(1)
  return end.packet(MESSAGE_END)
}

/**
 * A one-chunk response from its columns, each a list of row values: what the
 * client's queryData returns as `[columns]`. Every column must have the same
 * row count.
 */
export function protoRows(columns: Cell[][]): Buffer {
  const types = columns.map(columnType)

  const header = new Writer()
  header.u32(columns.length)
  columns.forEach((_, index) => {
    const name = utf8.encode(`col${index}`)
    header.u32(name.length)
    header.u32(types[index])
    header.u8(ENCODING_VECTOR)
    header.raw(name)
  })

  const chunk = new Writer()
  columns.forEach((column, index) => writeColumn(chunk, types[index], column))

  const footer = new Writer()
  footer.u32(columns[0]?.length ?? 0)

  return concat([
    header.packet(MESSAGE_CHUNK_HEADER),
    chunk.packet(MESSAGE_CHUNK),
    footer.packet(MESSAGE_END_CHUNK),
    endPacket(),
  ])
}

/** A failed query: the client rejects with this status and message. */
export function protoError(status: QueryStatus, message: string): Buffer {
  const error = new Writer()
  error.u8(QUERY_STATUSES.indexOf(status))
  error.raw(utf8.encode(message))
  return concat([error.packet(MESSAGE_ERROR), endPacket()])
}

/** The Cypher text out of a request body: [queryLen u32le][query][paramLen u32le][params]. */
export function decodeRequestQuery(body: Buffer | null): string {
  if (!body || body.length < 4) return ''
  const length = body.readUInt32LE(0)
  return body.subarray(4, 4 + length).toString('utf8')
}
