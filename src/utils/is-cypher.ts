// Keyword prefixes that mark an input as intended-Cypher rather than a free-text
// search. Anything starting with one of these (after stripping whitespace and
// comment lines) is routed to the Cypher engine; everything else is treated as
// a search term against the default name-like property.
const CYPHER_STARTERS = [
  'MATCH',
  'OPTIONAL',
  'RETURN',
  'WITH',
  'CREATE',
  'MERGE',
  'DELETE',
  'SET',
  'REMOVE',
  'UNWIND',
  'CALL',
  'LOAD',
  'USING',
]

const STARTER_RE = new RegExp(`^(?:${CYPHER_STARTERS.join('|')})\\b`, 'i')

export function isCypherQuery(input: string): boolean {
  const trimmed = input.trim()
  if (!trimmed) return false
  return STARTER_RE.test(trimmed)
}
