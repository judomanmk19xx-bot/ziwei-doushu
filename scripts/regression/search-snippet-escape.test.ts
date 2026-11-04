/**
 * F3: search snippet must never emit raw HTML.
 *
 * searchClassics() builds `snippet` strings rendered via dangerouslySetInnerHTML
 * (app/library/search/page.tsx). The only markup allowed in a snippet is the
 * <mark> wrapper around the match; every other character from the classic text
 * must be HTML-escaped by escapeHtml() (lib/classics/index.ts).
 *
 * This locks that invariant: for real queries, stripping the <mark> tags (and
 * the ellipsis marker) must leave no raw < > " ' characters behind. If someone
 * later drops the escapeHtml() call, this test fails.
 */
import assert from 'node:assert/strict';
import { searchClassics } from '../../lib/classics';

const STRIP_ALLOWED = /<\/?mark>|…/g;

for (const q of ['紫微', '七杀', '化忌', '命宫']) {
  const hits = searchClassics(q, 30);
  assert.ok(hits.length > 0, `expected hits for query ${q}`);
  for (const hit of hits) {
    const stripped = hit.snippet.replace(STRIP_ALLOWED, '');
    assert.ok(
      !/[<>"']/.test(stripped),
      `raw HTML in snippet for query ${JSON.stringify(q)}: ${hit.snippet.slice(0, 120)}`,
    );
    assert.ok(
      hit.snippet.includes('<mark>') && hit.snippet.includes('</mark>'),
      `match not wrapped in <mark> for query ${JSON.stringify(q)}`,
    );
  }
}

// A hostile-looking query must not produce raw HTML either: either it matches
// nothing, or its snippet is fully escaped.
const hostile = searchClassics('<img src=x onerror=alert(1)>', 30);
for (const hit of hostile) {
  assert.ok(
    !/[<>"']/.test(hit.snippet.replace(STRIP_ALLOWED, '')),
    `raw HTML in hostile-query snippet: ${hit.snippet.slice(0, 120)}`,
  );
}

console.log('[search-snippet-escape] snippet escape invariant holds');
