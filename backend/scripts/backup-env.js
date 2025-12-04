#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const envPath = path.join(process.cwd(), '.env')
if (!fs.existsSync(envPath)) {
  console.log('No backend/.env file detected, nothing to back up')
  process.exit(0)
}
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupPath = path.join(process.cwd(), `.env.bak.${timestamp}`)
fs.copyFileSync(envPath, backupPath)
console.log('Backed up .env to', backupPath)
