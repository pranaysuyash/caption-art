#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const required = [
  'REPLICATE_API_TOKEN',
  'OPENAI_API_KEY',
  'GUMROAD_PRODUCT_PERMALINK',
]

const missing = required.filter(
  (k) => !process.env[k] && !fs.existsSync(path.join(process.cwd(), '.env'))
)
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing.join(', '))
  console.error(
    'Please add them to backend/.env or set them in the environment (CI / system).'
  )
  process.exit(1)
}
console.log('Environment check passed')
