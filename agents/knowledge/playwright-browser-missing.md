# Playwright says the browser executable does not exist

```
browserType.launch: Executable doesn't exist at .../chromium_headless_shell-<build>/...
```

On a machine of your own, this is the missing download that "Running E2E Tests" in `AGENTS.md`
covers: run `bunx playwright install chromium` once.

In a Claude Code cloud session the browsers are pre-installed under `/opt/pw-browsers` for another
Playwright version, and downloading is not the way out. Point a throwaway config at the Chromium
that is there instead, and pass it with `-c`:

```ts
// pw.local.config.ts -- never commit this
import base from './playwright.config'
import { defineConfig } from '@playwright/test'

export default defineConfig({
  ...base,
  use: {
    ...base.use,
    launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
  },
})
```

```sh
bunx playwright test -c pw.local.config.ts
```

Delete the file before committing: `bun run lint` checks its formatting too, and it is not part of
the repository.
