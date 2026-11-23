#!/usr/bin/env node
/**
 * 把 Quartz 的 content 同步到 Hexo 的 source.
 *
 * 规则:
 * - 六个内容目录镜像到 source/_posts/<目录>, draft 目录直接镜像到 source/_drafts.
 * - categories 取目录 index.md 的 title, 去掉开头的单字母排序前缀.
 * - tags/title/date 以 Quartz 为准, date 只保留日期.
 * - _assets 复制到 Hexo 的 source/assets, 正文里的图片路径改写为 ../../assets/.
 * - links.md 转成 Hexo 的 source/links/index.md.
 * - 默认镜像删除: Hexo 中不再由 Quartz 生成的文章会被删掉.
 *
 * 用法:
 *   node scripts/sync-to-hexo.mjs --dry-run
 *   node scripts/sync-to-hexo.mjs
 *   node scripts/sync-to-hexo.mjs --hexo ../hexo
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parse as parseYaml } from "yaml"

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const QUARTZ_ROOT = path.resolve(SCRIPT_DIR, "..")
const CONTENT_DIR = path.join(QUARTZ_ROOT, "content")

const ASSET_PREFIX = "/assets/"

function printHelp() {
  console.log(`用法: node scripts/sync-to-hexo.mjs [选项]

选项:
  --dry-run       只打印计划, 不写入或删除任何文件
  --hexo <路径>   指定 Hexo 项目根目录 (默认 ../hexo, 也可用环境变量 HEXO_ROOT)
  --keep-stale    不删除 Hexo 中多出来的文章
  --verbose       输出更多细节
  -h, --help      显示帮助`)
}

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    keepStale: false,
    verbose: false,
    hexoRoot: null,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--dry-run") opts.dryRun = true
    else if (arg === "--keep-stale") opts.keepStale = true
    else if (arg === "--verbose") opts.verbose = true
    else if (arg === "--hexo") opts.hexoRoot = argv[++i]
    else if (arg.startsWith("--hexo=")) opts.hexoRoot = arg.slice("--hexo=".length)
    else if (arg === "-h" || arg === "--help") {
      printHelp()
      process.exit(0)
    } else {
      console.error(`未知参数: ${arg}`)
      printHelp()
      process.exit(2)
    }
  }

  return opts
}

const opts = parseArgs(process.argv.slice(2))
const HEXO_ROOT = path.resolve(
  opts.hexoRoot ?? process.env.HEXO_ROOT ?? path.join(QUARTZ_ROOT, "..", "hexo"),
)
const HEXO_SOURCE = path.join(HEXO_ROOT, "source")
const POSTS_DIR = path.join(HEXO_SOURCE, "_posts")
const DRAFTS_DIR = path.join(HEXO_SOURCE, "_drafts")
const ASSETS_DIR = path.join(HEXO_SOURCE, "assets")
const LINKS_PAGE = path.join(HEXO_SOURCE, "links", "index.md")

const report = {
  posts: { created: 0, updated: 0, unchanged: 0 },
  drafts: { created: 0, updated: 0, unchanged: 0 },
  assets: { created: 0, updated: 0, unchanged: 0 },
  pages: { created: 0, updated: 0, unchanged: 0 },
  deleted: [],
  missingMore: [],
  missingTitle: [],
  missingDate: [],
  warnings: [],
  errors: [],
}

function toPosix(value) {
  return value.split(path.sep).join("/")
}

function relFromQuartz(file) {
  return toPosix(path.relative(CONTENT_DIR, file))
}

function relFromHexo(file) {
  return toPosix(path.relative(HEXO_ROOT, file))
}

function walkFiles(dir) {
  const files = []
  if (!fs.existsSync(dir)) return files

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walkFiles(full))
    else if (entry.isFile()) files.push(full)
  }

  return files
}

function walkDirs(dir) {
  const dirs = []
  if (!fs.existsSync(dir)) return dirs

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const full = path.join(dir, entry.name)
    dirs.push(full, ...walkDirs(full))
  }

  return dirs
}

function readQuartzConfig() {
  const configPath = path.join(QUARTZ_ROOT, "quartz.config.yaml")
  if (!fs.existsSync(configPath)) return {}

  try {
    return parseYaml(fs.readFileSync(configPath, "utf8")) ?? {}
  } catch (error) {
    report.warnings.push(`无法解析 quartz.config.yaml: ${error.message}`)
    return {}
  }
}

function splitFrontmatter(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")
  const lines = raw.split(/\r?\n/)

  let start = 0
  while (start < lines.length && lines[start].trim() === "") start++

  if (lines[start]?.trim() !== "---") {
    return { data: {}, body: lines.slice(start).join("\n"), hasFrontmatter: false }
  }

  let end = -1
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      end = i
      break
    }
  }

  if (end === -1) {
    return { data: {}, body: lines.slice(start).join("\n"), hasFrontmatter: false }
  }

  let data = {}
  try {
    data = parseYaml(lines.slice(start + 1, end).join("\n")) ?? {}
    if (typeof data !== "object" || Array.isArray(data)) data = {}
  } catch (error) {
    throw new Error(`frontmatter 解析失败: ${error.message}`)
  }

  const body = lines
    .slice(end + 1)
    .join("\n")
    .replace(/^\n+/, "")
  return { data, body, hasFrontmatter: true }
}

function stripCategoryPrefix(title) {
  const stripped = String(title)
    .replace(/^[A-Za-z]{1,3}[.\s、-]+/, "")
    .trim()
  return stripped || String(title).trim()
}

function formatDate(value, file) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, "0")
    const d = String(value.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const matched = String(value ?? "").match(/(\d{4})-(\d{2})-(\d{2})/)
  if (matched) return `${matched[1]}-${matched[2]}-${matched[3]}`

  const mtime = fs.statSync(file).mtime
  const y = mtime.getFullYear()
  const m = String(mtime.getMonth() + 1).padStart(2, "0")
  const d = String(mtime.getDate()).padStart(2, "0")
  report.missingDate.push(relFromQuartz(file))
  return `${y}-${m}-${d}`
}

function yamlScalar(value) {
  const text = String(value)
  if (text === "") return '""'

  const unsafe =
    /^[\s\-?:,[\]{}#&*!|>'"%@`]/.test(text) ||
    /:\s|#\s|\s$/.test(text) ||
    /^(true|false|null|~|yes|no|on|off)$/i.test(text) ||
    /^-?\d+(\.\d+)?$/.test(text)

  return unsafe ? JSON.stringify(text) : text
}

function buildFrontmatter({ title, date, categories = [], tags = [] }) {
  const lines = ["---", `title: ${yamlScalar(title)}`]
  if (date) lines.push(`date: ${date}`)

  if (categories.length > 0) {
    lines.push("categories:")
    for (const category of categories) lines.push(`  - ${yamlScalar(category)}`)
  }

  if (tags.length > 0) {
    lines.push("tags:")
    for (const tag of tags) lines.push(`  - ${yamlScalar(tag)}`)
  }

  lines.push("---", "")
  return `${lines.join("\n")}\n`
}

function splitLinkSuffix(target) {
  const index = target.search(/[?#]/)
  if (index === -1) return [target, ""]
  return [target.slice(0, index), target.slice(index)]
}

function publicUrlForMarkdownFile(file) {
  const rel = path.relative(CONTENT_DIR, file)
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null

  const parts = rel.split(path.sep)
  if (parts.some((part) => part.startsWith("."))) return null

  if (parts.length === 1) {
    if (parts[0] === "index.md") return "/"
    if (parts[0] === "links.md") return "/links/"
    return null
  }

  if (parts[0] === "draft") return null
  if (parts.length === 2 && parts[1] === "index.md") return null
  if (parts[parts.length - 1] === "index.md") return null

  const folder = parts.slice(0, -1).join("/")
  const slug = path.basename(parts[parts.length - 1], ".md")
  return `/${folder}/${slug}/`
}

function resolveInternalLink(target, fromFile) {
  if (!target || target.startsWith("#")) return null
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(target) || target.startsWith("//")) return null

  let [pathPart, suffix] = splitLinkSuffix(target)
  if (!pathPart) return null

  try {
    pathPart = decodeURI(pathPart)
  } catch {
    return null
  }

  const candidates = [path.resolve(CONTENT_DIR, pathPart)]
  const relativeCandidate = path.resolve(path.dirname(fromFile), pathPart)
  if (relativeCandidate !== candidates[0]) candidates.push(relativeCandidate)

  for (const base of candidates) {
    const probes = base.endsWith(".md") ? [base] : [`${base}.md`, path.join(base, "index.md"), base]

    for (const probe of probes) {
      if (!fs.existsSync(probe) || !fs.statSync(probe).isFile()) continue
      if (!probe.endsWith(".md")) continue

      const url = publicUrlForMarkdownFile(probe)
      if (url) return `${url}${suffix}`
    }
  }

  return null
}

function rewriteLine(line, fromFile, assetPrefix) {
  let result = line
    .replace(/(\]\()_assets\//g, `$1${assetPrefix}`)
    .replace(/(src=["'])_assets\//g, `$1${assetPrefix}`)

  result = result.replace(
    /(!?)\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g,
    (match, bang, text, target, title = "") => {
      if (bang) return match

      const resolved = resolveInternalLink(target, fromFile)
      if (!resolved) return match

      return `[${text}](${resolved}${title})`
    },
  )

  return result
}

function rewriteMarkdownBody(body, fromFile, assetPrefix) {
  const lines = body.split("\n")
  let inFence = false
  let fenceChar = ""

  for (let i = 0; i < lines.length; i++) {
    const fence = lines[i].match(/^\s*(`{3,}|~{3,})/)

    if (fence) {
      if (!inFence) {
        inFence = true
        fenceChar = fence[1][0]
      } else if (fence[1][0] === fenceChar) {
        inFence = false
        fenceChar = ""
      }
      continue
    }

    if (inFence) continue
    lines[i] = rewriteLine(lines[i], fromFile, assetPrefix)
  }

  return lines.join("\n")
}

function normalizeBody(body, fromFile, assetPrefix) {
  const withoutBom = body.replace(/^\uFEFF/, "")
  const withStandardMore = withoutBom.replace(/<!--\s*more\s*-->/gi, "<!--more-->")
  const rewritten = rewriteMarkdownBody(withStandardMore, fromFile, assetPrefix)
  const trimmed = rewritten.replace(/\s*$/, "")
  return trimmed ? `${trimmed}\n` : ""
}

function morePlacementWarning(body) {
  const index = body.indexOf("<!--more-->")
  if (index === -1) return null
  if (body.slice(0, index).trim() === "") return "位于正文开头"

  let inFence = false
  let fenceChar = ""
  for (const line of body.slice(0, index).split("\n")) {
    const fence = line.match(/^\s*(`{3,}|~{3,})/)
    if (!fence) continue

    if (!inFence) {
      inFence = true
      fenceChar = fence[1][0]
    } else if (fence[1][0] === fenceChar) {
      inFence = false
      fenceChar = ""
    }
  }

  return inFence ? "位于代码块内" : null
}

function writeGeneratedFile(target, content) {
  const exists = fs.existsSync(target)
  const previous = exists ? fs.readFileSync(target, "utf8") : null
  if (previous === content) return "unchanged"

  if (!opts.dryRun) {
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content, "utf8")
  }

  return exists ? "updated" : "created"
}

function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) removeEmptyDirs(path.join(dir, entry.name))
  }

  if (fs.readdirSync(dir).length === 0 && dir !== POSTS_DIR && dir !== DRAFTS_DIR) {
    if (!opts.dryRun) fs.rmdirSync(dir)
  }
}

function deleteStaleMarkdown(dir, generatedSet) {
  if (!fs.existsSync(dir)) return

  for (const file of walkFiles(dir)) {
    if (!file.endsWith(".md")) continue
    if (generatedSet.has(path.resolve(file))) continue

    if (!opts.dryRun) fs.rmSync(file)
    report.deleted.push(relFromHexo(file))
  }

  if (!opts.dryRun) removeEmptyDirs(dir)
}

function copyAssets() {
  const contentDirs = walkDirs(CONTENT_DIR)
  const assetsDirs = contentDirs.filter((dir) => path.basename(dir) === "_assets")
  const generatedAssets = new Set()
  const seen = new Map()

  for (const assetsDir of assetsDirs) {
    for (const source of walkFiles(assetsDir)) {
      const relative = path.relative(assetsDir, source)
      const target = path.join(ASSETS_DIR, relative)
      const normalized = path.resolve(target)

      if (seen.has(normalized) && seen.get(normalized) !== source) {
        report.warnings.push(
          `资源重名: ${toPosix(relative)} 同时来自 ${relFromQuartz(seen.get(normalized))} 和 ${relFromQuartz(source)}`,
        )
      }
      seen.set(normalized, source)
      generatedAssets.add(normalized)

      const old = fs.existsSync(target) ? fs.readFileSync(target) : null
      const content = fs.readFileSync(source)

      if (old && old.equals(content)) {
        report.assets.unchanged++
        continue
      }

      if (!opts.dryRun) {
        fs.mkdirSync(path.dirname(target), { recursive: true })
        fs.writeFileSync(target, content)
      }

      if (old) report.assets.updated++
      else report.assets.created++
    }
  }

  return generatedAssets
}

function cleanOrphanAssets(generatedAssets) {
  if (!fs.existsSync(ASSETS_DIR)) return

  const protectedName = /^(favicon|apple-touch-icon|web-app-manifest-|kers-)/i

  for (const file of walkFiles(ASSETS_DIR)) {
    const normalized = path.resolve(file)
    if (generatedAssets.has(normalized)) continue
    if (protectedName.test(path.basename(file))) continue

    if (!opts.dryRun) fs.rmSync(file)
    report.deleted.push(relFromHexo(file))
  }

  if (!opts.dryRun) {
    for (const dir of walkDirs(ASSETS_DIR).sort((a, b) => b.length - a.length)) {
      if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir)
    }
  }
}

function buildLinksPage() {
  const source = path.join(CONTENT_DIR, "links.md")
  if (!fs.existsSync(source)) return null

  const { data, body } = splitFrontmatter(source)
  const title = typeof data.title === "string" && data.title.trim() ? data.title.trim() : "Links"
  const frontmatter = buildFrontmatter({ title, date: null })
  return `${frontmatter}${normalizeBody(body, source, ASSET_PREFIX)}`
}

function main() {
  if (!fs.existsSync(path.join(HEXO_ROOT, "_config.yml"))) {
    console.error(`找不到 Hexo 项目: ${HEXO_ROOT}`)
    process.exit(1)
  }

  const quartzConfig = readQuartzConfig()
  const ignorePatterns = quartzConfig?.configuration?.ignorePatterns ?? []
  const ignored = new Set([".obsidian", "_assets", ...ignorePatterns])

  const contentFolders = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !ignored.has(name) && !name.startsWith("."))
    .sort()

  const categories = new Map()
  for (const folder of contentFolders) {
    const indexPath = path.join(CONTENT_DIR, folder, "index.md")
    if (!fs.existsSync(indexPath)) {
      categories.set(folder, folder)
      continue
    }

    try {
      const { data } = splitFrontmatter(indexPath)
      const title = typeof data.title === "string" && data.title.trim() ? data.title.trim() : folder
      categories.set(folder, stripCategoryPrefix(title))
    } catch (error) {
      report.warnings.push(`读取 ${folder}/index.md 失败: ${error.message}`)
      categories.set(folder, folder)
    }
  }

  const generatedPosts = new Set()
  const generatedDrafts = new Set()

  for (const folder of contentFolders) {
    const folderDir = path.join(CONTENT_DIR, folder)
    const isDraftFolder = folder === "draft"

    for (const file of walkFiles(folderDir)) {
      if (!file.endsWith(".md")) continue

      const relative = path.relative(CONTENT_DIR, file)
      const parts = relative.split(path.sep)
      if (parts.some((part) => part === "_assets" || part.startsWith("."))) continue
      if (path.basename(file) === "index.md") continue

      const targetBase = isDraftFolder ? DRAFTS_DIR : POSTS_DIR
      const targetParts = isDraftFolder ? parts.slice(1) : parts
      const target = path.join(targetBase, ...targetParts)
      if (isDraftFolder) generatedDrafts.add(path.resolve(target))
      else generatedPosts.add(path.resolve(target))

      let parsed
      try {
        parsed = splitFrontmatter(file)
      } catch (error) {
        report.errors.push(`${relFromQuartz(file)}: ${error.message}`)
        continue
      }

      const { data, body } = parsed

      let title = typeof data.title === "string" ? data.title.trim() : ""
      if (!title) {
        title = path.basename(file, ".md")
        report.missingTitle.push(relFromQuartz(file))
        report.warnings.push(`${relFromQuartz(file)} 缺少 title, 使用文件名: ${title}`)
      }

      let tags = data.tags ?? data.tag
      if (typeof tags === "string") tags = tags.split(",").map((tag) => tag.trim())
      if (!Array.isArray(tags)) tags = []
      tags = [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))]

      const date = formatDate(data.date, file)
      const normalizedBody = normalizeBody(body, file, ASSET_PREFIX)

      if (!isDraftFolder && !normalizedBody.includes("<!--more-->")) {
        report.missingMore.push(relFromQuartz(file))
      }

      if (!isDraftFolder) {
        const placementWarning = morePlacementWarning(normalizedBody)
        if (placementWarning) {
          report.warnings.push(
            `${relFromQuartz(file)} 的 <!--more--> ${placementWarning}, Hexo 摘要可能为空`,
          )
        }
      }

      if (!isDraftFolder && normalizedBody.trim() === "") {
        report.warnings.push(`${relFromQuartz(file)} 正文为空`)
      }

      const frontmatter = buildFrontmatter({
        title,
        date,
        categories: [categories.get(folder) ?? folder],
        tags,
      })

      const status = writeGeneratedFile(target, `${frontmatter}${normalizedBody}`)
      if (isDraftFolder) report.drafts[status]++
      else report.posts[status]++
    }
  }

  const linksContent = buildLinksPage()
  if (linksContent !== null) {
    const status = writeGeneratedFile(LINKS_PAGE, linksContent)
    report.pages[status]++
  } else if (!opts.keepStale && fs.existsSync(LINKS_PAGE)) {
    if (!opts.dryRun) {
      fs.rmSync(LINKS_PAGE)
      removeEmptyDirs(path.dirname(LINKS_PAGE))
    }
    report.deleted.push(relFromHexo(LINKS_PAGE))
  }

  const generatedAssets = copyAssets()
  cleanOrphanAssets(generatedAssets)

  if (!opts.keepStale) {
    deleteStaleMarkdown(POSTS_DIR, generatedPosts)
    deleteStaleMarkdown(DRAFTS_DIR, generatedDrafts)
  }

  printReport()
}

function formatCounts(counts) {
  return `新建 ${counts.created}, 更新 ${counts.updated}, 不变 ${counts.unchanged}`
}

function printReport() {
  const mode = opts.dryRun ? "dry-run (未写入)" : "已写入"
  console.log(`Hexo 目标: ${HEXO_ROOT}`)
  console.log(`模式: ${mode}`)
  console.log("")
  console.log(`文章: ${formatCounts(report.posts)}`)
  console.log(`草稿: ${formatCounts(report.drafts)}`)
  console.log(`页面: ${formatCounts(report.pages)}`)
  console.log(`图片: ${formatCounts(report.assets)}`)

  if (report.deleted.length > 0) {
    console.log("")
    console.log(`删除 ${report.deleted.length} 个文件:`)
    for (const file of report.deleted.slice(0, 40)) console.log(`  - ${file}`)
    if (report.deleted.length > 40) console.log(`  ... 还有 ${report.deleted.length - 40} 个`)
  }

  if (report.missingMore.length > 0) {
    console.log("")
    console.log(`缺少 <!--more--> 的文章 (${report.missingMore.length}):`)
    for (const file of report.missingMore) console.log(`  - ${file}`)
  }

  if (report.missingTitle.length > 0) {
    console.log("")
    console.log(`缺少 title 的文章 (${report.missingTitle.length}):`)
    for (const file of report.missingTitle) console.log(`  - ${file}`)
  }

  if (report.missingDate.length > 0) {
    console.log("")
    console.log(`缺少 date 的文章 (${report.missingDate.length}, 已用修改时间补):`)
    for (const file of report.missingDate) console.log(`  - ${file}`)
  }

  const warnings = [...new Set(report.warnings)]
  if (warnings.length > 0 && (opts.verbose || warnings.length <= 20)) {
    console.log("")
    console.log(`警告 (${warnings.length}):`)
    for (const warning of warnings) console.log(`  - ${warning}`)
  } else if (warnings.length > 0) {
    console.log("")
    console.log(`警告: ${warnings.length} 条, 使用 --verbose 查看`)
  }

  if (report.errors.length > 0) {
    console.log("")
    console.log(`错误 (${report.errors.length}):`)
    for (const error of report.errors) console.log(`  - ${error}`)
  }

  console.log("")
  console.log(opts.dryRun ? "未修改任何文件." : "同步完成.")
  if (report.errors.length > 0) process.exitCode = 1
}

main()
