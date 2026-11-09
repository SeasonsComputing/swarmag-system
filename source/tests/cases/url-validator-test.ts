/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ URL validator tests                                                         ║
║ Verify absolute URLs, explicit schemes, and optional expectations.          ║
╚═════════════════════════════════════════════════════════════════════════════╝
*/

import { expectUrl, isUrl } from '@core/std'
import type { UrlScheme } from '@core/std'
import { assertEquals } from '@std/assert'

Deno.test('URL predicates require an absolute URL with an explicitly allowed scheme', () => {
  const urls: [UrlScheme, string][] = [
    ['http', 'http://example.com'],
    ['https', 'https://example.com/path?q=1#part'],
    ['mailto', 'mailto:person@example.com'],
    ['tel', 'tel:+15551234567'],
    ['ftp', 'ftp://example.com/file'],
    ['data', 'data:text/plain,hello'],
    ['blob', 'blob:https://example.com/identifier']
  ]
  for (const [scheme, url] of urls) {
    assertEquals(isUrl(url, [scheme]), true)
    assertEquals(isUrl(url, []), false)
    assertEquals(isUrl(url, scheme === 'https' ? ['http'] : ['https']), false)
  }
  assertEquals(isUrl('HTTPS://example.com', ['https']), true)
  for (const value of ['/relative', '//example.com', 'file.pdf', '', 'https://', 7, {}, null]) {
    assertEquals(isUrl(value, ['https']), false)
  }
})

Deno.test('URL expectations follow required and nullish-optional validator semantics', () => {
  assertEquals(expectUrl('https://example.com', 'Link', ['https']), null)
  for (const value of [null, undefined]) {
    assertEquals(expectUrl(value, 'Link', ['https'], true), null)
    assertEquals(typeof expectUrl(value, 'Link', ['https']), 'string')
  }
  for (const value of ['', '/relative', 'http://example.com', 7]) {
    assertEquals(
      expectUrl(value, 'Link', ['https'], true),
      'Link must be a valid URL with an allowed scheme'
    )
  }
})
