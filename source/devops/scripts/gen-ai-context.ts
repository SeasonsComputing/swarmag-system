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
  outFile?: string
  outPath?: string
  maxFiles: number
  maxLinesPerFile: number
  maxTotalLines: number
  maxLinesPerFileSet: boolean
  maxTotalLinesSet: boolean
  showHelp: boolean
}

const ROOT = Deno.cwd().replaceAll('\\', '/')
const BRIEF_DIR = `${ROOT}/build/briefs`
const INVENTORY_TOPIC = 'inventory'

const topicsSlug = (topics: string[]): string =>
  [...topics]
    .sort((a, b) => a.localeCompare(b))
    .map(topic => topic.trim().toLowerCase())
    .filter(topic => topic.length > 0)
    .join('-')

const defaultOutPath = (topics: string[]): string => `${BRIEF_DIR}/ai-context-${topicsSlug(topics)}.md`
const toOutPathFromFile = (fileName: string): string => {
  const trimmed = fileName.trim()
  if (trimmed.length === 0) throw new Error('--file requires a non-empty file name')
  if (trimmed.includes('/') || trimmed.includes('\\')) {
    throw new Error('--file must be a file name, not a path')
  }
  const stem = trimmed.endsWith('.md') ? trimmed.slice(0, -3) : trimmed
  if (stem.length === 0) throw new Error('--file requires a non-empty file name')
  return `${BRIEF_DIR}/${stem}.md`
}

const TOPIC_RULES: TopicRule[] = [
  {
    topic: 'architecture',
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
    patterns: [
      /^source\/domain\/schema\/schema\.sql$/,
      /^documentation\/domain-data-dictionary\.md$/,
      /^documentation\/domain-model\.md$/
    ]
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
  },
  {
    topic: INVENTORY_TOPIC,
    patterns: []
  }
]

const parseArgs = (): ContextArgs => {
  const topics: string[] = []
  let outFile: string | undefined
  let outPath: string | undefined
  let maxFiles = 120
  let maxLinesPerFile = 440
  let maxTotalLines = 4000
  let maxLinesPerFileSet = false
  let maxTotalLinesSet = false
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
    if (arg === '--file' && Deno.args[i + 1]) {
      const candidate = Deno.args[i + 1].trim()
      if (candidate.length > 0) outFile = candidate
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
      if (Number.isInteger(parsed) && parsed > 20) {
        maxLinesPerFile = parsed
        maxLinesPerFileSet = true
      }
      i++
      continue
    }
    if (arg === '--max-total-lines' && Deno.args[i + 1]) {
      const parsed = Number.parseInt(Deno.args[i + 1], 10)
      if (Number.isInteger(parsed) && parsed > 200) {
        maxTotalLines = parsed
        maxTotalLinesSet = true
      }
      i++
      continue
    }
  }

  return {
    topics,
    outFile,
    outPath,
    maxFiles,
    maxLinesPerFile,
    maxTotalLines,
    maxLinesPerFileSet,
    maxTotalLinesSet,
    showHelp
  }
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
    throw new Error(
      `at least one --topic is required: ${TOPIC_RULES.map(rule => rule.topic).join(', ')}`
    )
  }
  const valid = new Set(TOPIC_RULES.map(rule => rule.topic))
  const unknown = topics.filter(topic => !valid.has(topic))
  if (unknown.length > 0) {
    throw new Error(`unknown topics: ${unknown.join(', ')}; valid: ${[...valid].join(', ')}`)
  }
}

const selectFiles = (allFiles: string[], topics: string[], maxFiles: number): string[] => {
  const active = TOPIC_RULES.filter(rule =>
    topics.includes(rule.topic) && rule.topic !== INVENTORY_TOPIC
  )
  const selected: string[] = []
  for (const path of allFiles) {
    const include = active.some(rule => rule.patterns.some(pattern => pattern.test(path)))
    if (include) selected.push(path)
  }
  return selected.slice(0, maxFiles)
}

type TreeNode = {
  kind: 'dir' | 'file'
  children: Map<string, TreeNode>
}

const isGitignoreFile = (path: string): boolean => path.split('/').at(-1) === '.gitignore'

const renderRepoTree = (allFiles: string[]): string[] => {
  const root: TreeNode = { kind: 'dir', children: new Map() }
  const paths = allFiles.filter(path => !isGitignoreFile(path)).sort((a, b) => a.localeCompare(b))

  for (const path of paths) {
    const parts = path.split('/').filter(part => part.length > 0)
    if (parts.length === 0) continue

    let cursor = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      const existing = cursor.children.get(part)
      if (!existing) {
        const node: TreeNode = { kind: isFile ? 'file' : 'dir', children: new Map() }
        cursor.children.set(part, node)
        cursor = node
        continue
      }
      cursor = existing
    }
  }

  const lines: string[] = ['.']

  const walk = (node: TreeNode, prefix: string): void => {
    const entries = [...node.children.entries()].sort((a, b) => {
      if (a[1].kind !== b[1].kind) return a[1].kind === 'dir' ? -1 : 1
      return a[0].localeCompare(b[0])
    })
    for (let i = 0; i < entries.length; i++) {
      const [name, child] = entries[i]
      const isLast = i === entries.length - 1
      lines.push(`${prefix}${isLast ? '└── ' : '├── '}${name}`)
      if (child.kind === 'dir') walk(child, `${prefix}${isLast ? '    ' : '│   '}`)
    }
  }

  walk(root, '')
  return lines
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
    '  --file <name>              Output file name in build/briefs (without .md; .md auto-appended)',
    '  --out <path>               Output markdown path (default: build/briefs/ai-context-<topics>.md)',
    '  --max-files <number>       Max files included (default: 120)',
    '  --max-lines-per-file <n>   Max lines per file (default: 440)',
    '  --max-total-lines <n>      Max total lines across all files (default: 4000)',
    '  -h, --help                 Show this help',
    '',
    'Topics:',
    topicList,
    '',
    'Examples:',
    '  deno task gen:ai-context -- --topic architecture --topic devops',
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

  if (args.maxLinesPerFileSet && !args.maxTotalLinesSet) {
    args.maxTotalLines = Math.max(args.maxTotalLines, args.maxFiles * args.maxLinesPerFile)
  }

  await Deno.mkdir(BRIEF_DIR, { recursive: true })
  const outPath = args.outPath
    ?? (args.outFile ? toOutPathFromFile(args.outFile) : defaultOutPath(args.topics))

  const allFiles = await collectFiles()
  const includeInventory = args.topics.includes(INVENTORY_TOPIC)
  const selectedFiles = selectFiles(allFiles, args.topics, args.maxFiles)
  if (selectedFiles.length === 0 && !includeInventory) {
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
  if (includeInventory) {
    lines.push('## Repository Inventory')
    lines.push('')
    lines.push('- scope: entire repository tree excluding `.gitignore` files')
    lines.push('')
    lines.push('```text')
    lines.push(...renderRepoTree(allFiles))
    lines.push('```')
    lines.push('')
  }
  if (selectedFiles.length > 0) {
    lines.push('## File Index')
    lines.push('')
    for (const path of selectedFiles) lines.push(`- ${path}`)
    lines.push('')
    lines.push('## File Contents')
    lines.push('')
  }

  let totalContentLines = 0
  let includedFileCount = 0
  const croppedFiles: string[] = []

  for (const path of selectedFiles) {
    const source = await readText(path)
    const sourceLines = source.split('\n')
    if (sourceLines.length === 0) continue

    const remaining = args.maxTotalLines - totalContentLines
    if (remaining <= 0) break

    const keep = Math.min(sourceLines.length, args.maxLinesPerFile, remaining)
    const truncated = keep < sourceLines.length
    if (truncated) croppedFiles.push(`${path} (${keep}/${sourceLines.length})`)

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

  if (includedFileCount === 0 && !includeInventory) {
    throw new Error('line budgets prevented including any file content; increase limits')
  }

  const payload = lines.join('\n')
  await Deno.writeTextFile(outPath, payload)
  const summary = [
    'AI Context Generated',
    `  output: ${outPath}`,
    `  topics: ${args.topics.join(', ')}`,
    `  inventory: ${includeInventory ? 'enabled' : 'disabled'}`,
    `  files: ${includedFileCount}`,
    `  content_lines: ${totalContentLines}`,
    `  cropped_files: ${croppedFiles.length}`
  ]
  if (croppedFiles.length > 0) {
    summary.push('  cropped_file_list:')
    summary.push(...croppedFiles.map(file => `    - ${file}`))
  }
  console.log(summary.join('\n'))
}

await main()
