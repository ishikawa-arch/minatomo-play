#!/usr/bin/env node
/**
 * 各ゲームのサムネイルを Playwright (chromium) で撮影する。
 *
 * 撮影方針:
 *   - TOP画面の「はじめる」相当ボタンを検出してクリックし、プレイ画面まで進める
 *   - クリック後さらに 2.5 秒待機してから 800x600 でスクリーンショット
 *   - 撮影画面に「同じ選択肢の重複」が見つかった場合は最大5回までリトライ
 *     （クイズ系のランダム生成バグで同一選択肢が並ぶ問題への保険）
 *
 * Usage:
 *   node scripts/generate_thumbnails.mjs <game_id> [<game_id> ...]
 *   node scripts/generate_thumbnails.mjs --all
 *   BASE_URL=http://localhost:8765/ node scripts/generate_thumbnails.mjs --all
 *
 * 出力: thumbnails/{game_id}.png (800x600)
 *
 * ボタン検出ロジック（優先順位）:
 *   1. text="はじめる"
 *   2. text="スタート"
 *   3. text="Start"
 *   4. text="かんたん"   （難易度カードを持つゲーム向け。最初の選択肢を選ぶ）
 *   5. 上記すべて見つからない場合 → クリックせず撮影
 *
 * 重複検出ヒューリスティック:
 *   撮影画面のボタンテキストを収集し、完全一致の重複があればリトライ。
 *   ただし「お財布」のように同種コインボタンが多数並ぶ画面で誤検出しないよう、
 *   ボタン総数が 6 個以下のときだけ重複検出を行う（典型的な選択肢画面の上限）。
 */
import { chromium } from 'playwright'
import { mkdir, readFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BASE = process.env.BASE_URL || 'https://ishikawa-arch.github.io/minatomo-play/'
const OUT_DIR = path.join(ROOT, 'thumbnails')
const VIEWPORT = { width: 800, height: 600 }
const PRE_CLICK_WAIT_MS = 2000
const POST_CLICK_WAIT_MS = 2500
const POST_LOAD_WAIT_MS_NO_CLICK = 3000
const NAV_TIMEOUT_MS = 30_000
const FAIL_LIMIT = 5
const MAX_RETRIES = 5
const DUPE_CHECK_BUTTON_LIMIT = 6

async function clickStartButton(page) {
  const candidates = ['はじめる', 'スタート', 'Start', 'かんたん']
  for (const label of candidates) {
    const btn = page.locator(`button:has-text("${label}")`)
    if ((await btn.count()) > 0) {
      try {
        await btn.first().click({ timeout: 2000 })
        return label
      } catch {
        // 次の候補へ
      }
    }
  }
  return null
}

/**
 * 画面に「同じテキストの選択肢ボタン」が複数ある場合のみ
 * 重複情報を返す。ない場合 / そもそも検査対象外の場合は null。
 */
function findDuplicateChoices(buttonTexts) {
  // 空文字を除き、空白を正規化
  const normalized = buttonTexts
    .map((t) => t.replace(/\s+/g, ' ').trim())
    .filter((t) => t.length > 0)

  // ボタンが多い画面（例: お財布の硬貨群）は対象外
  if (normalized.length === 0 || normalized.length > DUPE_CHECK_BUTTON_LIMIT) {
    return null
  }

  const counts = new Map()
  for (const t of normalized) counts.set(t, (counts.get(t) ?? 0) + 1)
  const dupes = [...counts.entries()].filter(([, c]) => c > 1)
  return dupes.length > 0 ? dupes.map(([t, c]) => `"${t}"×${c}`) : null
}

/**
 * 1 試行で 1 ゲームを撮影する。撮影成功時は重複情報も返す。
 */
async function captureOnce(context, id) {
  const url = `${BASE}${id}.html`
  const out = path.join(OUT_DIR, `${id}.png`)
  const page = await context.newPage()
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT_MS })
    await delay(PRE_CLICK_WAIT_MS)
    const clicked = await clickStartButton(page)
    await delay(clicked ? POST_CLICK_WAIT_MS : POST_LOAD_WAIT_MS_NO_CLICK)
    await page.screenshot({ path: out, fullPage: false, type: 'png' })
    const buttonTexts = await page
      .locator('button')
      .allTextContents()
      .catch(() => [])
    const dupes = findDuplicateChoices(buttonTexts)
    return { ok: true, clicked, dupes }
  } finally {
    await page.close().catch(() => {})
  }
}

async function captureWithRetry(context, id) {
  let last = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const r = await captureOnce(context, id)
      last = { ...r, attempt }
      if (!r.dupes) {
        return { id, ok: true, clicked: r.clicked, attempts: attempt }
      }
      process.stdout.write(
        `  ${id}: 重複検出 ${r.dupes.join(', ')} → retry ${attempt}/${MAX_RETRIES}\n`,
      )
    } catch (e) {
      const msg = e.message.split('\n')[0]
      process.stdout.write(`  ${id}: error attempt ${attempt}: ${msg}\n`)
      if (attempt === MAX_RETRIES) {
        return { id, ok: false, err: msg }
      }
    }
  }
  return {
    id,
    ok: true,
    clicked: last?.clicked,
    attempts: MAX_RETRIES,
    dupesAccepted: last?.dupes ?? [],
  }
}

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
    console.error('Usage: node scripts/generate_thumbnails_v2.mjs <id> [id ...] | --all')
    process.exit(1)
  }

  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: VIEWPORT })

  const results = []
  for (const id of ids) {
    process.stdout.write(`[${id}]\n`)
    const t0 = Date.now()
    const r = await captureWithRetry(context, id)
    const ms = Date.now() - t0
    if (r.ok) {
      const tag = r.dupesAccepted ? `⚠️ accepted dup ${r.dupesAccepted.join(',')}` : ''
      process.stdout.write(
        `  OK (${ms}ms, attempt ${r.attempts}, btn=${r.clicked ?? '-'}) ${tag}\n`,
      )
    } else {
      process.stdout.write(`  FAIL (${ms}ms): ${r.err}\n`)
    }
    results.push(r)
    if (results.filter((x) => !x.ok).length >= FAIL_LIMIT) {
      process.stdout.write(`\n失敗 ${FAIL_LIMIT} 件に達したため早期停止。\n`)
      break
    }
  }

  await browser.close()

  const ok = results.filter((r) => r.ok).length
  const fail = results.length - ok
  const retried = results.filter((r) => r.ok && (r.attempts ?? 1) > 1)
  const acceptedDupes = results.filter((r) => r.ok && r.dupesAccepted)
  const noClick = results.filter((r) => r.ok && !r.clicked)

  console.log()
  console.log('=== サマリ ===')
  console.log(`  処理: ${results.length} / 成功 ${ok} / 失敗 ${fail}`)
  console.log(`  リトライ発生: ${retried.length} 本`)
  for (const r of retried) {
    console.log(`    - ${r.id} (attempts=${r.attempts}${r.dupesAccepted ? ', accepted dup' : ''})`)
  }
  console.log(`  リトライ後も重複が残った: ${acceptedDupes.length} 本`)
  for (const r of acceptedDupes) {
    console.log(`    - ${r.id}: ${r.dupesAccepted.join(', ')}`)
  }
  console.log(`  ボタン未検出（TOP画面のまま撮影）: ${noClick.length} 本`)
  for (const r of noClick) console.log(`    - ${r.id}`)

  if (fail >= FAIL_LIMIT) process.exit(2)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
