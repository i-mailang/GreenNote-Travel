import { copyFile, writeFile } from 'node:fs/promises'

await copyFile('dist/index.html', 'dist/404.html')
await writeFile('dist/build-mode.json', `${JSON.stringify({ mode: 'local' }, null, 2)}\n`, 'utf8')
console.log('Prepared dist/404.html as the CloudBase SPA route fallback.')
