/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ CSS guard regression tests                                                   ║
║ Checks formatting-independent selectors and existing declaration policies.   ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { auditCss } from '@devops/guards/guard-css.ts'
import { assert, assertEquals } from '@std/assert'

const WIDGET_PATH = 'source/ux/widgets/helm-widget.css'
const CSS_PATH = 'source/ux/ui/css/'
const ROOT = '[data-widget=\'helm-widget\']'
const LABEL_MODE = '[data-widget-label-mode=\'visible-no-icon\']'

// Captured with the repository's dprint configuration, including the frame and
// both separator pseudo-elements from the triggering Helm selectors.
const FORMATTED_HELM = `
[data-widget='helm-widget'] [data-widget-label-mode='visible-no-icon'] [data-ui='action-button-frame'] {
  display: none;
}
[data-widget='helm-widget']
  [data-widget-label-mode='visible-no-icon']
  [data-ui='action-button-label']::before,
[data-widget='helm-widget']
  [data-widget-label-mode='visible-no-icon']
  [data-ui='action-button-label']::after {
  content: none;
}
`.trimStart()

const policies = (content: string, filePath = WIDGET_PATH): string[] =>
  auditCss(content, filePath).map(violation => violation.split(' — ').slice(1).join(' — '))

Deno.test('CSS guard accepts original Helm selectors and their actual dprint output', () => {
  const compact = [
    `${ROOT} ${LABEL_MODE} [data-ui='action-button-frame'] { display: none; }`,
    `${ROOT} ${LABEL_MODE} [data-ui='action-button-label']::before,`,
    `${ROOT} ${LABEL_MODE} [data-ui='action-button-label']::after { content: none; }`
  ].join('\n')
  assertEquals(auditCss(compact, WIDGET_PATH), [])
  assertEquals(auditCss(FORMATTED_HELM, WIDGET_PATH), [])
})

Deno.test('CSS guard rejects the same namespace roots in single and multiline selectors', () => {
  for (const root of ['[data-ui=\'frame\']', '[data-app=\'ops\']', '.unowned']) {
    const tail = '[data-ui=\'action-button-label\']::after'
    assertEquals(policies(`${root} ${tail} { content: none; }`), [
      `selector not rooted at [data-widget — found: ${root} ${tail}`
    ])
    assertEquals(policies(`${root}\n  ${tail}\n{\n  content: none;\n}`), [
      `selector not rooted at [data-widget — found: ${root}\n  ${tail}`
    ])
  }
})

Deno.test('CSS guard checks invalid branches first, middle, and last in every list layout', () => {
  for (let index = 0; index < 3; index++) {
    const selectors = [ROOT, ROOT, ROOT]
    selectors[index] = '.unowned'
    for (const separator of [', ', ',\n']) {
      assertEquals(policies(`${selectors.join(separator)} { display: none; }`), [
        'selector not rooted at [data-widget — found: .unowned'
      ])
    }
  }
})

Deno.test('CSS guard reports the offending branch start after comments and wrapped ancestors', () => {
  const content = `/* { ignored } */
${ROOT},
/* a comment containing , { */
.unowned
  [data-ui='frame'] {
  display: none;
}`
  assertEquals(auditCss(content, WIDGET_PATH), [
    `${WIDGET_PATH}:4 — selector not rooted at [data-widget — found: .unowned\n  [data-ui='frame']`
  ])
})

Deno.test('CSS guard retains continuation-line attributes and identity value policies', () => {
  assertEquals(policies(`${ROOT}\n  [data-secret='x']\n  [data-ui='Bad_Value'] { display: none; }`), [
    'forbidden data attribute selector — found: data-secret',
    'data attribute value not kebab-case — data-ui=\'Bad_Value\''
  ])
  assertEquals(policies('[data-widget=\'Bad_Value\'] { display: none; }'), [
    'data attribute value not kebab-case — data-widget=\'Bad_Value\''
  ])
  assertEquals(policies(`${ROOT}\n [data-widget-mode='Bad_Value'] { display: none; }`), [
    'data attribute value not kebab-case — data-widget-mode=\'Bad_Value\''
  ])
})

Deno.test('CSS guard respects comments, strings, escapes, and functional selector commas', () => {
  const content = String.raw`/* { .unowned { , } */
[data-widget='helm-widget'][data-highlighted='a,{b};c']:is(.one, :not(.two, .three))
  .escaped\,comma\{brace {
  content: 'a}b{c;/* literal */';
  display: none;
}
${ROOT}/* inline { comment */:not([data-highlighted="escaped\"{,}"]) {
  content: "a\\b\"}";
}
${ROOT} { /* inline comment */ font-weight: 700; }`
  assertEquals(policies(content), ['font-weight numeric literal — 700;'])
})

Deno.test('CSS guard traverses media and container rules without auditing at-rule preludes', () => {
  const content = `@media (width > 20rem) {
  @container dashboard (width > 10rem) {
    ${ROOT},
    .unowned {
      font-size: 12px;
    }
  }
}`
  assertEquals(auditCss(content, WIDGET_PATH), [
    `${WIDGET_PATH}:4 — selector not rooted at [data-widget — found: .unowned`,
    `${WIDGET_PATH}:5 — font-size literal — 12px;`
  ])
})

Deno.test('CSS guard checks nested rule branches and keeps declarations with their own rule', () => {
  const content = `${ROOT} {
  content: 'commas, and braces {}';
  ${ROOT}, .unowned { display: none; }
}`
  assertEquals(policies(content), ['selector not rooted at [data-widget — found: .unowned'])
})

Deno.test('CSS guard retains the established shell and application namespaces', () => {
  assertEquals(auditCss('[data-shell=\'header\'] { display: none; }', 'source/ux/shell/header.css'), [])
  assertEquals(auditCss('[data-app=\'ops\'] { display: none; }', 'source/front/app-ops/index.css'), [])
})

Deno.test('CSS guard applies control and base selector checks to every branch', () => {
  for (const separator of [', ', ',\n']) {
    assertEquals(
      policies(`[data-ui='button']${separator}body { display: none; }`, `${CSS_PATH}ui.css`),
      [
        'selector not rooted at [data-ui — found: body'
      ]
    )
    assertEquals(
      policies(`body${separator}[data-ui='button'] { display: none; }`, `${CSS_PATH}base.css`),
      [
        'attribute selector in base.css — found: [data-ui=\'button\']'
      ]
    )
  }
})

Deno.test('CSS guard applies root and theme provider policies independently per branch', () => {
  for (const fileName of ['tokens.css', 'roles.css']) {
    const path = `${CSS_PATH}${fileName}`
    assertEquals(policies(':root,\n[data-theme] {}', path), [
      'forbidden theme selector — found: [data-theme]'
    ])
    assertEquals(policies(':root,\nbody {}', path), ['forbidden selector — found: body'])
    assertEquals(auditCss(':root,\n:root {}', path), [])
  }
  const path = `${CSS_PATH}themes.css`
  assertEquals(auditCss('[data-theme],\n[data-theme=\'dark\'] {}', path), [])
  assertEquals(policies('[data-theme=\'dark\'],\n:root,\nbody {}', path), [
    'forbidden root selector — found: :root',
    'forbidden selector — found: body'
  ])
})

Deno.test('CSS guard associates icon declarations with complete rules inside container rules', () => {
  const path = `${CSS_PATH}icons.css`
  assertEquals(
    auditCss(
      `@media (width > 20rem) {
  [data-ui-icon='one'] { --sa-icon: url('../icons/one.svg'); }
  [data-ui-icon='two'] {
    --sa-icon: url('../icons/two.svg');
  }
}`,
      path
    ),
    []
  )
  const violations = auditCss(
    `[data-ui-icon='one'],
.invalid {
  --sa-icon: url('../icons/wrong.svg');
  display: none;
}
[data-ui-icon='one'] {}
[data-ui-icon='two'] {}`,
    path
  )
  assertEquals(violations, [
    `${path}:2 — icon catalog selector must be [data-ui-icon='{name}'] — found: .invalid`,
    `${path}:3 — icon catalog name must match SVG asset — expected: --sa-icon: url('../icons/one.svg');`,
    `${path}:4 — icon catalog declares non --sa-icon property — display`,
    `${path}:6 — duplicate icon catalog name — one`,
    `${path}:6 — icon catalog entry missing --sa-icon declaration — one`,
    `${path}:7 — icon catalog entry missing --sa-icon declaration — two`
  ])
})

Deno.test('CSS guard preserves every existing declaration value policy', () => {
  const declarations = [
    'color: var(--sa-lch-text);',
    'background: oklch(50% 0.1 30);',
    'font-family: serif;',
    'font-size: 12px;',
    'font-weight: 700;',
    'line-height: 12px;',
    'padding: 12px;',
    'margin: 12px;',
    'border-radius: 12px;',
    'box-shadow: 0 0 2px black;',
    'transition: all 1s;',
    'z-index: 2;',
    'backdrop-filter: blur(1px);',
    'border: 1px solid black;'
  ]
  const violations = policies(`${ROOT} {\n${declarations.join('\n')}\n}`)
  assertEquals(violations.length, declarations.length)
  for (
    const rule of [
      'lch token ref outside token layer',
      'raw oklch() value',
      'font-family literal',
      'font-size literal',
      'font-weight numeric literal',
      'line-height literal',
      'spacing literal',
      'border-radius literal',
      'raw box-shadow',
      'raw transition',
      'raw z-index number',
      'raw backdrop-filter',
      'raw border shorthand'
    ]
  ) assert(violations.some(violation => violation.startsWith(rule)), rule)
})

Deno.test('CSS guard preserves token declaration restrictions and value exemptions', () => {
  assertEquals(
    policies(`${ROOT} {
  --sa-p-old: 1;
  --sa-lch-local: 0 0 0;
  --sa-space-local: 1rem;
}`),
    [
      'legacy token prefix — --sa-p-old',
      'lch token declared outside roles.css/themes.css — --sa-lch-local',
      'immutable token redeclared outside tokens.css — --sa-space-local'
    ]
  )
  assertEquals(policies(':root { --sa-local: 1; color: red; }', `${CSS_PATH}tokens.css`), [
    'mutable token declared in tokens.css — --sa-local',
    'non-token declaration in token-only file — color: red;'
  ])
  assertEquals(
    auditCss(
      `${ROOT} {
  padding: var(--sa-space-small);
  width: 12px;
  height: 12px;
  gap: 12px;
  box-shadow: none;
  transition: inherit;
  backdrop-filter: unset;
  border: none;
}`,
      WIDGET_PATH
    ),
    []
  )
  assertEquals(
    auditCss('@font-face { font-family: \'Local\'; font-weight: 700; } body {}', `${CSS_PATH}base.css`),
    []
  )
})

Deno.test('CSS selector parsing preserves physical-line declaration value audit behavior', () => {
  const selector = `${ROOT}\n  [data-ui='layout']`
  const wrapped = `${selector} {
  padding-inline: clamp(
    var(--sa-rhythm-gutter),
    calc(-2.514rem + 12.793vw),
    calc(var(--sa-rhythm-gutter) * 3)
  );
}`
  assertEquals(auditCss(wrapped, WIDGET_PATH), [])
  assertEquals(
    policies(`${selector} {
  padding-inline: clamp(var(--sa-rhythm-gutter), calc(-2.514rem + 12.793vw), var(--sa-space-small));
}`),
    [
      'spacing literal — clamp(var(--sa-rhythm-gutter), calc(-2.514rem + 12.793vw),'
      + ' var(--sa-space-small));'
    ]
  )
})
