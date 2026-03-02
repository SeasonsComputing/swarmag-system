/**
 * Guard against invalid validator file layout in domain validators.
 */

const ROOT = Deno.cwd().replaceAll('\\', '/')
const VALIDATORS_DIR = `${ROOT}/source/domain/validators`

const VALIDATORS_SECTION_TITLE = 'VALIDATORS'
const SECTION_BLOCK_REGEX = /^\/\/ ─+\n\/\/ ([A-Z][A-Z ]*[A-Z])\n\/\/ ─+$/gm
const EXPORT_VALIDATOR_REGEX = /^export const validate[A-Za-z0-9_]*\s*=/gm

const lineNumber = (source: string, index: number): number =>
  source.slice(0, index).split('\n').length

const main = async () => {
  const violations: string[] = []

  for await (const entry of Deno.readDir(VALIDATORS_DIR)) {
    if (!entry.isFile || !entry.name.endsWith('-validator.ts')) continue

    const file = `${VALIDATORS_DIR}/${entry.name}`
    const relative = file.replace(`${ROOT}/`, '')
    const source = await Deno.readTextFile(file)
    const sections: Array<{ title: string; index: number }> = []
    let sectionMatch: RegExpExecArray | null
    while ((sectionMatch = SECTION_BLOCK_REGEX.exec(source)) !== null) {
      sections.push({ title: sectionMatch[1], index: sectionMatch.index })
    }

    if (sections.length < 2) {
      violations.push(`${relative} must contain validators and internals sections`)
      continue
    }

    const validatorsSectionIndex = sections.findIndex((s) => s.title === VALIDATORS_SECTION_TITLE)
    if (validatorsSectionIndex < 0) {
      violations.push(`${relative} is missing section "// ${VALIDATORS_SECTION_TITLE}"`)
      continue
    }

    if (validatorsSectionIndex !== 0) {
      const line = lineNumber(source, sections[validatorsSectionIndex].index)
      violations.push(`${relative}:${line} validators section must be the first section`)
    }

    const internalsStart = sections[validatorsSectionIndex + 1]?.index
    if (internalsStart === undefined) {
      violations.push(`${relative} must define an internals section below validators`)
      continue
    }

    let exportMatch: RegExpExecArray | null
    while ((exportMatch = EXPORT_VALIDATOR_REGEX.exec(source)) !== null) {
      if (exportMatch.index < sections[validatorsSectionIndex].index || exportMatch.index > internalsStart) {
        const line = lineNumber(source, exportMatch.index)
        violations.push(`${relative}:${line} validator export is outside the top validators section`)
      }
    }
  }

  if (violations.length > 0) {
    console.error('Validator layout guard failed:')
    for (const violation of violations) {
      console.error(`- ${violation}`)
    }
    Deno.exit(1)
  }

  console.log('✓ Validator layout guard passed')
}

await main()
