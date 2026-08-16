import { readdir, readFile } from 'node:fs/promises'

const files = await readdir('public/demo')
if (!files.length || files.some((file) => !file.endsWith('.svg'))) throw new Error('Demo assets must be a non-empty set of original SVG files.')
for (const file of files) {
  const text = await readFile(`public/demo/${file}`, 'utf8')
  if (!text.includes('<svg') || /<image\b|(?:href|src)=["']https?:\/\//i.test(text)) throw new Error(`Unsafe or external Demo asset: ${file}`)
}
console.log(`Verified ${files.length} original Demo SVG assets.`)
