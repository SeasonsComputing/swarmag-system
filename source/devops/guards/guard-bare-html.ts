import type { StringDictionary } from '@core/std'
import { walk } from '@std/walk'
import { guardFail, guardPass } from '@devops/guards/guard-utils.ts'

const ROOT = Deno.cwd().replaceAll('\\', '/')
const UX_DIR = `${ROOT}/source/ux`
const SKIP_DIRS = [
  'source/ux/common/components/ui',
  'source/ux/app-style-guide'
]

const BARE_HTML_REGEX =
  /<(button|input|textarea|select|ul|ol|li|table|thead|tbody|tfoot|tr|td|th|fieldset|legend)[\s/>]/g
const COMMENT_LINE_REGEX = /^\s*\/\//

const REPLACEMENTS: StringDictionary = {
  'button': 'UiButton',
  'input': 'UiInput',
  'textarea': 'UiTextArea',
  'select': 'UiSingleSelect',
  'ul': 'UiList',
  'ol': 'UiList',
  'li': 'UiListItem',
  'table': 'UiTable',
  'thead': 'UiTableHeader',
  'tbody': 'UiTableBody',
  'tfoot': 'UiTableBody',
  'tr': 'UiTableRow',
  'td': 'UiTableCell',
  'th': 'UiTableCell',
  'fieldset': 'UiFieldset',
  'legend': 'UiFieldset'
}

const shouldSkip = (filePath: string): boolean => {
  const normalized = filePath.replaceAll('\\', '/')
  return SKIP_DIRS.some(dir => normalized.includes(dir))
}

const isCommentLine = (line: string): boolean => {
  const trimmed = line.trim()
  return COMMENT_LINE_REGEX.test(trimmed) || trimmed.includes('{/*')
}

const main = async () => {
  const violations: string[] = []

  for await (
    const entry of walk(UX_DIR, {
      includeDirs: false,
      exts: ['.tsx'],
      skip: [/[/\\]dist[/\\]?/, /[/\\]node_modules[/\\]?/]
    })
  ) {
    const file = entry.path.replaceAll('\\', '/')

    if (shouldSkip(file)) continue

    const relative = file.replace(`${ROOT}/`, '')
    const source = await Deno.readTextFile(file)
    const lines = source.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (isCommentLine(line)) continue

      BARE_HTML_REGEX.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = BARE_HTML_REGEX.exec(line)) !== null) {
        const element = match[1]
        const replacement = REPLACEMENTS[element]
        violations.push(
          `${relative}:${i + 1} — bare ${element} — use ${replacement}`
        )
      }
    }
  }

  if (violations.length > 0) guardFail('Bare HTML', violations)

  guardPass('Bare HTML')
}

await main()
