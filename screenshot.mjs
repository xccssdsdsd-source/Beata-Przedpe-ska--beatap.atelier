import { mkdirSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
]
const executablePath = chromePaths.find(p => existsSync(p))
if (!executablePath) throw new Error('Chrome not found')

const url = process.argv[2] || 'http://localhost:3000'
const width = Number(process.argv[3] || 1440)
const height = Number(process.argv[4] || 900)

const outDir = new URL('./temporary screenshots/', import.meta.url)
mkdirSync(outDir, { recursive: true })
const existing = readdirSync(outDir).filter(f => /^screenshot-\d+\.png$/.test(f))
const next = existing.reduce((max, f) => Math.max(max, Number(f.match(/\d+/)[0])), 0) + 1
const target = fileURLToPath(new URL(`screenshot-${next}.png`, outDir))

const browser = await puppeteer.launch({ executablePath, headless: 'shell', args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await browser.newPage()
await page.setViewport({ width, height, deviceScaleFactor: 1 })
await page.goto(url, { waitUntil: 'networkidle0' })
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await new Promise(resolve => setTimeout(resolve, 1200))
await page.evaluate(() => window.scrollTo(0, 0))
await new Promise(resolve => setTimeout(resolve, 1200))
await page.screenshot({ path: target, fullPage: true })
await browser.close()

console.log(target)
