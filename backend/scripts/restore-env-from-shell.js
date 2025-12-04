#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const envFile = path.join(process.cwd(), '.env')
if (!fs.existsSync(envFile)) {
  console.error(
    '.env does not exist. Please run cp-env-if-missing.sh first or create a .env file'
  )
  process.exit(1)
}

const keys = [
  'REPLICATE_API_TOKEN',
  'OPENAI_API_KEY',
  'GUMROAD_PRODUCT_PERMALINK',
  'FAL_API_KEY',
]

let env = fs.readFileSync(envFile, 'utf8')
const linesToAppend = []
for (const k of keys) {
  if (process.env[k]) {
    // only add if not present
    if (!new RegExp(`^${k}=`, 'm').test(env)) {
      linesToAppend.push(`${k}=${process.env[k]}`)
    }
  }
}
if (linesToAppend.length) {
  fs.appendFileSync(envFile, '\n' + linesToAppend.join('\n') + '\n')
  console.log(
    'Added the following keys to .env:',
    linesToAppend.map((l) => l.split('=')[0]).join(', ')
  )
} else {
  console.log('No missing keys from the shell environment to add to .env')
}
