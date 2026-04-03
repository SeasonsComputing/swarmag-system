/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ AI context generator                                                        ║
║ Produces topic-scoped code context packets for reasoning-model prompts.     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Generate build/briefs/ai-context.md using explicit architecture topic groups.
The output is deterministic, bounded by line budgets, and fail-fast by policy.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(script entry point — no exported symbols)
*/

type TopicRule = {
  topic: string
  patterns: RegExp[]
}

type ContextArgs = {
  topics: string[]
  outPath?: string
  maxFiles: number
  maxLinesPerFile: number
  maxTotalLines: number
  showHelp: boolean
}

const ROOT = Deno.cwd().replaceAll('\\', '/')
const BRIEF_DIR = `${ROOT}/build/briefs`

const topicsSlug = (topics: string[]): string =>
  [...topics]
    .sort((a, b) => a.localeCompare(b))
    .map(topic => topic.trim().toLowerCase())
    .filter(topic => topic.length > 0)
    .join('-')

const defaultOutPath = (topics: string[]): string => `${BRIEF_DIR}/ai-context-${topicsSlug(topics)}.md`

const TOPIC_RULES: TopicRule[] = [
  {
    topic: 'concept',
    patterns: [/^AGENTS\.md$/, /^CONSTITUTION\.md$/, /^documentation\/.*\.md$/]
  },
  {
    topic: 'domain-abstractions',
    patterns: [/^source\/domain\/abstractions\/.*\.ts$/]
  },
  {
    topic: 'domain-archetypes',
    patterns: [
      /^source\/domain\/(protocols|adapters|validators)\/.*\.ts$/,
      /^documentation\/domain-archetypes\.md$/,
      /^documentation\/genesis-domain-sdk\.md$/
    ]
  },
  {
    topic: 'domain-schema',
    patterns: [/^source\/domain\/schema\/schema\.sql$/, /^documentation\/domain-data-dictionary\.md$/, /^documentation\/domain-model\.md$/]
  },
  {
    topic: 'core',
    patterns: [/^source\/core\/.*\.ts$/, /^documentation\/architecture-core\.md$/]
  },
  {
    topic: 'ux-shared',
    patterns: [
      /^source\/ux\/ai\/.*\.(ts|tsx|js|json|md)$/,
      /^source\/ux\/common\/.*\.(ts|tsx)$/,
      /^source\/ux\/config\/.*\.(ts|env\.example)$/,
      /^documentation\/architecture-ux\.md$/
    ]
  },
  {
    topic: 'ux-app-admin',
    patterns: [/^source\/ux\/app-admin\/.*\.(ts|tsx|js|html|webmanifest)$/]
  },
  {
    topic: 'ux-app-ops',
    patterns: [/^source\/ux\/app-ops\/.*\.(ts|tsx|js|html|webmanifest)$/]
  },
  {
    topic: 'ux-app-customer',
    patterns: [/^source\/ux\/app-customer\/.*\.(ts|tsx|js|html|webmanifest)$/]
  },
  {
    topic: 'devops',
    patterns: [/^source\/devops\/.*\.(ts|sh|txt)$/, /^AGENTS\.md$/, /^documentation\/style-guide\.md$/]
  },
  {
    topic: 'test',
    patterns: [/^source\/tests\/.*\.ts$/]
  }
]

const parseArgs = (): ContextArgs => {
  const topics: string[] = []
  let outPath: string | undefined
  let maxFiles = 120
  let maxLinesPerFile = 220
  let maxTotalLines = 4000
  let showHelp = false

  for (let i = 0; i < Deno.args.length; i++) {
    const arg = Deno.args[i]
    if (arg === '--help' || arg === '-h') {
      showHelp = true
      continue
    }
    if (arg === '--topic' && Deno.args[i + 1]) {
      topics.push(Deno.args[i + 1].trim().toLowerCase())
      i++
      continue
    }
    if (arg === '--out' && Deno.args[i + 1]) {
      const candidate = Deno.args[i + 1].trim()
      if (candidate.length > 0) outPath = candidate.startsWith('/') ? candidate : `${ROOT}/${candidate}`
      i++
      continue
    }
    if (arg === '--max-files' && Deno.args[i + 1]) {
      const parsed = Number.parseInt(Deno.args[i + 1], 10)
      if (Number.isInteger(parsed) && parsed > 0) maxFiles = parsed
      i++
      continue
    }
    if (arg === '--max-lines-per-file' && Deno.args[i + 1]) {
      const parsed = Number.parseInt(Deno.args[i + 1], 10)
      if (Number.isInteger(parsed) && parsed > 20) maxLinesPerFile = parsed
      i++
      continue
    }
    if (arg === '--max-total-lines' && Deno.args[i + 1]) {
      const parsed = Number.parseInt(Deno.args[i + 1], 10)
      if (Number.isInteger(parsed) && parsed > 200) maxTotalLines = parsed
      i++
      continue
    }
  }

  return { topics, outPath, maxFiles, maxLinesPerFile, maxTotalLines, showHelp }
}

const run = async (cmd: string[]): Promise<string> => {
  const command = new Deno.Command(cmd[0], { args: cmd.slice(1), stdout: 'piped', stderr: 'piped' })
  const output = await command.output()
  if (!output.success) return ''
  return new TextDecoder().decode(output.stdout).trim()
}

const collectFiles = async (): Promise<string[]> => {
  const listed = await run(['git', 'ls-files', '--cached', '--others', '--exclude-standard'])
  if (listed.length === 0) {
    throw new Error('git ls-files returned no output; aborting by explicit project policy')
  }
  return listed
    .split('\n')
    .map(path => path.trim())
    .filter(path => path.length > 0)
    .sort()
}

const validateTopics = (topics: string[]): void => {
  if (topics.length === 0) {
    throw new Error(`at least one --topic is required: ${TOPIC_RULES.map(rule => rule.topic).join(', ')}`)
  }
  const valid = new Set(TOPIC_RULES.map(rule => rule.topic))
  const unknown = topics.filter(topic => !valid.has(topic))
  if (unknown.length > 0) {
    throw new Error(`unknown topics: ${unknown.join(', ')}; valid: ${[...valid].join(', ')}`)
  }
}

const selectFiles = (allFiles: string[], topics: string[], maxFiles: number): string[] => {
  const active = TOPIC_RULES.filter(rule => topics.includes(rule.topic))
  const selected: string[] = []
  for (const path of allFiles) {
    const include = active.some(rule => rule.patterns.some(pattern => pattern.test(path)))
    if (include) selected.push(path)
  }
  return selected.slice(0, maxFiles)
}

const readText = async (relativePath: string): Promise<string> => {
  const full = `${ROOT}/${relativePath}`
  return await Deno.readTextFile(full)
}

const detectFence = (path: string): string => {
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'ts'
  if (path.endsWith('.js')) return 'js'
  if (path.endsWith('.sql')) return 'sql'
  if (path.endsWith('.md')) return 'md'
  if (path.endsWith('.html')) return 'html'
  if (path.endsWith('.webmanifest')) return 'json'
  return 'text'
}

const printHelp = (): void => {
  const topicList = TOPIC_RULES.map(rule => `  - ${rule.topic}`).join('\n')
  const lines = [
    'AI Context Generator',
    '',
    'Usage:',
    '  deno run --allow-read --allow-write --allow-run source/devops/scripts/gen-ai-context.ts [options]',
    '',
    'Options:',
    '  --topic <name>             Add topic filter (repeatable, required unless --help)',
    '  --out <path>               Output markdown path (default: build/briefs/ai-context-<topics>.md)',
    '  --max-files <number>       Max files included (default: 120)',
    '  --max-lines-per-file <n>   Max lines per file (default: 220)',
    '  --max-total-lines <n>      Max total lines across all files (default: 4000)',
    '  -h, --help                 Show this help',
    '',
    'Topics:',
    topicList,
    '',
    'Examples:',
    '  deno task gen:ai-context -- --topic concept --topic devops',
    '  deno task gen:ai-context -- --topic domain-archetypes --out build/briefs/archetypes.md'
  ]
  console.log(lines.join('\n'))
}

const main = async (): Promise<void> => {
  const args = parseArgs()
  if (args.showHelp) {
    printHelp()
    return
  }
  validateTopics(args.topics)

  await Deno.mkdir(BRIEF_DIR, { recursive: true })
  const outPath = args.outPath ?? defaultOutPath(args.topics)

  const allFiles = await collectFiles()
  const selectedFiles = selectFiles(allFiles, args.topics, args.maxFiles)
  if (selectedFiles.length === 0) {
    throw new Error('no files matched provided topics')
  }

  const branch = await run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])
  const commit = await run(['git', 'rev-parse', '--short', 'HEAD'])

  const lines: string[] = []
  lines.push('# AI Context Packet')
  lines.push('')
  lines.push(`- generated_at_utc: ${new Date().toISOString()}`)
  lines.push(`- repo_root: ${ROOT}`)
  lines.push(`- branch: ${branch || 'unknown'}`)
  lines.push(`- commit: ${commit || 'unknown'}`)
  lines.push(`- topics: ${args.topics.join(', ')}`)
  lines.push(`- max_files: ${args.maxFiles}`)
  lines.push(`- max_lines_per_file: ${args.maxLinesPerFile}`)
  lines.push(`- max_total_lines: ${args.maxTotalLines}`)
  lines.push('')
  lines.push('## File Index')
  lines.push('')
  for (const path of selectedFiles) lines.push(`- ${path}`)
  lines.push('')
  lines.push('## File Contents')
  lines.push('')

  let totalContentLines = 0
  let includedFileCount = 0

  for (const path of selectedFiles) {
    const source = await readText(path)
    const sourceLines = source.split('\n')
    if (sourceLines.length === 0) continue

    const remaining = args.maxTotalLines - totalContentLines
    if (remaining <= 0) break

    const keep = Math.min(sourceLines.length, args.maxLinesPerFile, remaining)
    const truncated = keep < sourceLines.length

    lines.push(`### ${path}`)
    lines.push('')
    lines.push(`- lines_in_file: ${sourceLines.length}`)
    lines.push(`- lines_included: ${keep}`)
    lines.push(`- truncated: ${truncated ? 'yes' : 'no'}`)
    lines.push('')
    lines.push(`\`\`\`${detectFence(path)}`)
    lines.push(...sourceLines.slice(0, keep))
    if (truncated) lines.push('... [truncated]')
    lines.push('\`\`\`')
    lines.push('')

    totalContentLines += keep
    includedFileCount += 1
  }

  if (includedFileCount === 0) {
    throw new Error('line budgets prevented including any file content; increase limits')
  }

  const payload = lines.join('\n')
  await Deno.writeTextFile(outPath, payload)
  const summary = [
    'AI Context Generated',
    `  output: ${outPath}`,
    `  topics: ${args.topics.join(', ')}`,
    `  files: ${includedFileCount}`,
    `  content_lines: ${totalContentLines}`
  ]
  console.log(summary.join('\n'))
}

await main()
