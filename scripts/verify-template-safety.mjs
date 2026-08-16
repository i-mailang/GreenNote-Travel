import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'

const root = process.cwd()
const self = relative(root, new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1')).replaceAll('\\', '/')
const excluded = new Set(['.git', 'node_modules', 'dist', '.cloudbase', 'test-results', 'playwright-report', 'output'])
const textExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.html', '.css', '.example', '.gitignore', '.yml', '.yaml', '.svg', '.txt'])
const files = []
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excluded.has(entry.name)) continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) await walk(path)
    else if ([...textExtensions].some((extension) => entry.name.endsWith(extension)) || entry.name === 'LICENSE') files.push(path)
  }
}
await walk(root)
const sources = []
for (const path of files) {
  const name = relative(root, path).replaceAll('\\', '/')
  if (name === self || name === 'scripts/verify-template-safety.mjs') continue
  sources.push({ name, text: await readFile(path, 'utf8') })
}
const all = sources.map(({ name, text }) => `\n--- ${name} ---\n${text}`).join('')
const forbidden = [
  ['old public product brand', /TripGuide/],
  ['old package identity', /tripguide-template/i],
  ['old storage namespace', /tripguide\.demo/i],
  ['old planned repository', /i-mailang\/TripGuide-Template/i],
  ['old branded cache name', /tripguide-demo-assets/i],
  ['old GreenNote-only package identity', /"name"\s*:\s*"greennote"/i],
  ['old GreenNote-only storage namespace', /greennote\.demo/i],
  ['old GreenNote-only planned repository', /i-mailang\/GreenNote(?!-Travel)/i],
  ['production CloudBase environment', /personal-test-d6g0e4b709cff060d/i],
  ['production hosting domain', /personal-test-[a-z0-9-]+\.tcloudbaseapp\.com/i],
  ['production Trip ID', /family-trip-2026/i],
  ['private location keyword', /(晋城|忻州|雁门关|大同|云冈|悬空寺|乌兰哈达|黄花沟|呼和浩特|响沙湾|达拉特旗)/],
  ['private source path', /D:[\\/]Projects[\\/]FamilyTrip/i],
  ['production storage namespace', /guanshan-shahai/i],
  ['fixed Day special case', /day-(7|8)/i],
  ['production data module', /productionTrip/i],
  ['private art path', /docs[\\/]art(?:\.zip|[\\/]|\b)/i],
]
for (const [label, pattern] of forbidden) if (pattern.test(all)) throw new Error(`Template safety failed: ${label} remains.`)
const publicBrandText = sources.map(({ text }) => text.replace(/shortName\s*:\s*'GreenNote'/g, '')).join('\n')
if (/GreenNote(?! Travel|-Travel)/.test(publicBrandText)) throw new Error('Template safety failed: a GreenNote-only public brand reference remains outside the allowed shortName.')
for (const required of ['GreenNote Travel', 'greennote-travel', 'greennote.travel.demo', 'i-mailang/GreenNote-Travel']) if (!all.includes(required)) throw new Error(`Template safety failed: required brand identity is missing: ${required}`)
const credentialValue = /(?:BAIDU_WEATHER_AK|API[_-]?KEY|ACCESS[_-]?TOKEN|AUTH[_-]?TOKEN|SECRET(?:_?ID|_?KEY)?)\s*[=:]\s*["']?[A-Za-z0-9/+_-]{12,}/i
if (credentialValue.test(all) || /AKID[A-Za-z0-9]{16,}/i.test(all)) throw new Error('Template safety failed: a credential-like value appears to be embedded.')
if (/VITE_BAIDU_WEATHER_AK\s*[=:]/i.test(all)) throw new Error('Template safety failed: a server secret is exposed through a Vite environment variable.')

const deploy = sources.filter(({ name }) => name === 'package.json' || name.startsWith('scripts/')).map(({ text }) => text).join('\n')
if (!deploy.includes('CLOUDBASE_ENV_ID') || !deploy.includes('Deployment blocked')) throw new Error('Template safety failed: deploy scripts do not enforce an explicit target environment.')
const cloudbaseExample = JSON.parse(await readFile('cloudbaserc.example.json', 'utf8'))
if (cloudbaseExample.envId !== '') throw new Error('Template safety failed: cloudbaserc.example.json contains a default deployment target.')

for (const path of ['src/data/productionTrip.json', 'src/data/productionTrip.test.ts', 'resource', 'docs/art', 'docs/art.zip', 'public/images', 'public/assets/trip', '.env', '.env.local']) {
  try { await stat(path); throw new Error(`Template safety failed: excluded path exists: ${path}`) } catch (error) { if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') continue; throw error }
}

try {
  const distFiles = []
  async function walkDist(directory) { for (const entry of await readdir(directory, { withFileTypes: true })) { const path = join(directory, entry.name); if (entry.isDirectory()) await walkDist(path); else distFiles.push(path) } }
  await walkDist('dist')
  const publicBuild = (await Promise.all(distFiles.filter((file) => /\.(js|html|json|css)$/.test(file)).map((file) => readFile(file, 'utf8')))).join('\n')
  if (/(BAIDU_WEATHER_AK|AKID[A-Za-z0-9]{16,}|Secret(?:Id|Key)["']?\s*[:=]\s*["'][A-Za-z0-9/+_-]{12,})/i.test(publicBuild)) throw new Error('Template safety failed: public build contains a server-side secret value.')
} catch (error) { if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error }

console.log(`Template safety passed across ${sources.length} source files.`)
