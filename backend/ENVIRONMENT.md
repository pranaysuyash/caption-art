# Environment Variables - Backend

This file documents the environment variables used by the backend and how to manage them safely.

Important: Never commit your `backend/.env` file to Git. This file is ignored by `.gitignore` and should contain sensitive API keys and secrets.

1. Copy `.env.example` to `.env` and fill in your private values.

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your secret tokens
```

2. To prevent accidental deletion or overwrite of your `.env` file, make a backup before running any setup operation (we provide a small helper script `backend/scripts/backup-env.js`).

3. During local development or testing prefer local env files:

- `backend/.env` - local dev env file (ignored by Git)
- `backend/.env.development` - alternative environment-specific file if you use it
- `backend/.env.test` - recommended for CI and test runs; tests should set safe fallback defaults and not overwrite real secrets.

4. If you use CI systems (GitHub Actions, etc) prefer storing secrets in CI and not in version control; pull them in during the environment setup.

5. Use `backend/scripts/ensure-env.js` to verify that the minimal set of env vars is present before running scripts or tests.

6. If you notice missing keys, DO NOT run any `cp` or `setup` scripts that may copy `.env.example` to `.env` unless you have a local backup.

If you would like, I can create a Gitignored secure store and a restore workflow that keeps a local encrypted `.env.backup.gpg` for quick restores.
