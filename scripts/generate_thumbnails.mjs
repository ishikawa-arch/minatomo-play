#!/usr/bin/env node
/**
 * 各ゲームのサムネイルを Playwright (chromium) で撮影する。
 *
 * Usage:
 *   node scripts/generate_thumbnails.mjs <game_id> [<game_id> ...]
 *   node scripts/generate_thumbnails.mjs --all   # 全 112本（catalog から読む）
 *
 * 出力: thumbnails/{game_id}.png (800x600)
 *
 * 失敗 3本以上で exit 2（バッチ運用時の早期停止）
 */
import { chromium } from 'playwright'
import { mkdir, readFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
// 既定は本番 GitHub Pages。ローカル変更を撮影する時は環境変数で上書き:
//   BASE_URL=http://localhost:8765/ node scripts/generate_thumbnails.mjs ...
const BASE = process.env.BASE_URL || 'https://ishikawa-arch.github.io/minatomo-play/'
const OUT_DIR = path.join(ROOT, 'thumbnails')
const VIEWPORT = { width: 800, height: 600 }
const POST_LOAD_WAIT_MS = 3000
const NAV_TIMEOUT_MS = 30_000
const FAIL_LIMIT = 3

async function resolveIds(args) {
  if (args.includes('--all')) {
    const catalog = JSON.parse(
      await readFile(path.join(ROOT, 'games-catalog.json'), 'utf8'),
    )
    return catalog.games.map((g) => g.id)
  }
  return args.filter((a) => !a.startsWith('--'))
}

async function main() {
  const args = process.argv.slice(2)
  const ids = await resolveIds(args)
  if (ids.length === 0) {
    console.error('Usage: node scripts/generate_thumbnails.mjs <id> [id ...] | --all')
    process.exit(1)
  }

  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: VIEWPORT })
  const page = await context.newPage()

  const results = []
  for (const id of ids) {
    const url = `${BASE}${id}.html`
    const out = path.join(OUT_DIR, `${id}.png`)
    process.stdout.write(`[${id}] ${url} ... `)
    const t0 = Date.now()
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT_MS })
      await delay(POST_LOAD_WAIT_MS)
      await page.screenshot({ path: out, fullPage: false, type: 'png' })
      const ms = Date.now() - t0
      process.stdout.write(`OK (${ms}ms) -> ${path.relative(ROOT, out)}\n`)
      results.push({ id, ok: true })
    } catch (e) {
      process.stdout.write(`FAIL: ${e.message.split('\n')[0]}\n`)
      results.push({ id, ok: false, err: e.message })
      if (results.filter((r) => !r.ok).length >= FAIL_LIMIT) {
        process.stdout.write(`\n失敗 ${FAIL_LIMIT} 件に達したため早期停止。\n`)
        break
      }
    }
  }

  await browser.close()

  const ok = results.filter((r) => r.ok).length
  const fail = results.length - ok
  console.log()
  console.log(`=== サマリ ===`)
  console.log(`  成功: ${ok}/${results.length}`)
  console.log(`  失敗: ${fail}`)
  if (fail >= FAIL_LIMIT) process.exit(2)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
