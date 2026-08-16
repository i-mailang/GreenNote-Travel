import { spawnSync } from 'node:child_process'
import { readFile, rm, writeFile } from 'node:fs/promises'

const target = process.argv[2]
if (!['functions', 'hosting', 'all'].includes(target)) throw new Error('Usage: node scripts/deploy-cloud.mjs <functions|hosting|all>')
const envId = process.env.CLOUDBASE_ENV_ID?.trim()
if (!envId) throw new Error('Deployment blocked: set CLOUDBASE_ENV_ID explicitly. GreenNote Travel has no default CloudBase environment.')

const run = (command, args) => {
  const executable = process.platform === 'win32' ? `${command}.cmd` : command
  const result = spawnSync(executable, args, { stdio: 'inherit', shell: false, env: process.env })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status ?? 1}`)
}

const generatedConfig = 'cloudbaserc.json'
try {
  const template = JSON.parse(await readFile('cloudbaserc.example.json', 'utf8'))
  await writeFile(generatedConfig, `${JSON.stringify({ ...template, envId }, null, 2)}\n`, 'utf8')
  if (target === 'functions' || target === 'all') { run('npm', ['run', 'build:functions']); run('npx', ['tcb', 'fn', 'deploy', '--all', '-e', envId]) }
  if (target === 'hosting' || target === 'all') { run('npm', ['run', 'build:cloud']); run('npm', ['run', 'test:cloud-dist']); run('npx', ['tcb', 'hosting', 'deploy', 'dist', '-e', envId]) }
} finally {
  await rm(generatedConfig, { force: true })
}
