#!/bin/bash
set -e
if [ -f .env ]; then
  echo ".env already exists; not copying .env.example to .env."
  exit 0
fi
cp .env.example .env
echo "Copied .env.example to .env"
