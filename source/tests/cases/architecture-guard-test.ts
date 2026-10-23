/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Architecture guard tests                                                     ║
║ Verify the closed standard-library boundary across reference forms.          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Verify the closed standard-library boundary across module reference forms
*/

import { checkCoreStdBoundary } from '@devops/guards/guard-architecture.ts'
import { assertEquals, assertStringIncludes } from '@std/assert'

const ROOT = Deno.cwd().replaceAll('\\', '/')
const IMPORT_KEYWORD = 'import'
const FILE = `${ROOT}/source/core/std/example.ts`

const references = (specifier: string): string[] => [
  `import { value } from '${specifier}'`,
  `import type { Value } from '${specifier}'`,
  `import value from '${specifier}'`,
  `import value, { other } from '${specifier}'`,
  `${IMPORT_KEYWORD} * as values from '${specifier}'`,
  `import type * as values from '${specifier}'`,
  `import value, * as values from '${specifier}'`,
  `export { value } from '${specifier}'`,
  `export type { Value } from '${specifier}'`,
  `export * from '${specifier}'`,
  `export type * from '${specifier}'`,
  `export * as values from '${specifier}'`,
  `import '${specifier}'`,
  `const module = import('${specifier}')`
]

Deno.test('closed std accepts internal relative references in every supported form', () => {
  for (const specifier of ['./adt.ts', './nested/../adt.ts', '../std/adt.ts']) {
    for (const source of references(specifier)) {
      assertEquals(checkCoreStdBoundary(FILE, source), [], source)
    }
  }
  assertEquals(
    checkCoreStdBoundary(`${ROOT}/source/core/std/nested/example.ts`, 'import \'../adt.ts\''),
    []
  )
})

Deno.test('closed std rejects aliases, external dependencies, and resolved relative escapes', () => {
  const forbidden = [
    '@core/std',
    '@core/stdx',
    '@core/cli/preferences.ts',
    '@front/api/api.ts',
    '@std/assert',
    'npm:example',
    'https://example.com/module.ts',
    '../cli/preferences.ts',
    './nested/../../cli/preferences.ts',
    '../std-other/module.ts',
    './%2e%2e/cli/preferences.ts',
    `${ROOT}/source/core/std/adt.ts`
  ]
  for (const specifier of forbidden) {
    for (const source of references(specifier)) {
      const violations = checkCoreStdBoundary(FILE, source)
      assertEquals(violations.length, 1, source)
      assertStringIncludes(violations[0], specifier)
    }
  }
})

Deno.test('closed std skips commented examples and retains violation line numbers', () => {
  const source = [
    '// import \'@core/cli/preferences.ts\'',
    '/*',
    'export * from \'@front/api/api.ts\'',
    '*/',
    'import \'./adt.ts\'',
    'import \'@core/stdx\''
  ].join('\n')
  const violations = checkCoreStdBoundary(FILE, source)
  assertEquals(violations.length, 1)
  assertStringIncludes(violations[0], 'source/core/std/example.ts:6')
})

Deno.test('closed std leaves other namespaces to existing architecture rules', () => {
  assertEquals(checkCoreStdBoundary(`${ROOT}/source/core/cli/example.ts`, 'import \'@core/stdx\''), [])
  assertEquals(
    checkCoreStdBoundary(`${ROOT}/source/core/std-other/example.ts`, 'import \'@std/assert\''),
    []
  )
})

Deno.test('closed std ignores module-reference text inside strings', () => {
  const source = `const example = "import '@core/stdx'"`
  assertEquals(checkCoreStdBoundary(FILE, source), [])
})
