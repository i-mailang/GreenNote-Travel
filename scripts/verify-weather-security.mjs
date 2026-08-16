import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd(); const failures = []
const listed = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean)
for (const file of listed) {
  if (!/\.(?:ts|tsx|js|mjs|json|md|txt|example)$/i.test(file)) continue
  const text = readFileSync(join(root, file), 'utf8')
  if (/BAIDU_WEATHER_AK\s*=\s*[A-Za-z0-9_-]{12,}/.test(text)) failures.push(`${file}: possible real AK assignment`)
  if (/https?:\/\/[^\s"']*[?&]ak=[^\s"'&]+/i.test(text)) failures.push(`${file}: complete weather request URL`)
}
function walk(dir) { if (!statSync(dir).isDirectory()) return [dir]; return readdirSync(dir).flatMap((name) => walk(join(dir, name))) }
if (statSync(join(root, 'dist'), { throwIfNoEntry: false })) for (const file of walk(join(root, 'dist')).filter((item) => statSync(item).isFile())) {
  const text = /\.(?:js|css|html|json|webmanifest)$/i.test(file) ? readFileSync(file, 'utf8') : ''
  if (/BAIDU_WEATHER_AK|api\.map\.baidu\.com\/weather/i.test(text)) failures.push(`${relative(root, file)}: backend weather secret or endpoint leaked into browser build`)
}
if (failures.length) throw new Error(failures.join('\n'))
console.log(`Weather security audit passed for ${listed.length} repository files; browser build contains no AK marker or Baidu weather endpoint.`)
