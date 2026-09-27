import { expect, test, type Page } from '@playwright/test'
import jaJP from '../../locales/ja-JP.json'
import { seedFolders } from './seed-folders'

const SETTINGS = '/listview/settings'

// The service worker is blocked so that `page.route()` sees the sign-in check
// the launch screen makes.
test.use({ serviceWorkers: 'block' })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('setupComplete', 'true')
  })
  await page.route('**/auth/user*', (route) =>
    route.fulfill({ status: 200, body: '{}' }),
  )
})

async function openSettings(page: Page) {
  await page.goto(SETTINGS)
  await page.addStyleTag({
    content: 'nextjs-portal { display: none !important; }',
  })
  await expect(page.getByTestId('startup-page-select')).toBeVisible()
}

async function choose(page: Page, option: string) {
  await page.getByTestId('startup-page-select').click()
  await page.getByRole('option', { name: option, exact: true }).click()
  await expect(page.getByTestId('startup-page-select')).toContainText(option)
}

test.describe('choosing the screen the app opens on', () => {
  test('opens every world when nothing has been chosen', async ({ page }) => {
    await page.goto('/start')

    await page.waitForURL('**/listview/folders/special/all')
  })

  for (const [option, path] of [
    [
      jaJP['general:unclassified-worlds'],
      '/listview/folders/special/unclassified',
    ],
    [jaJP['find-page:recently-visited'], '/listview/recently-visited'],
    [jaJP['general:search-worlds'], '/listview/search'],
    [jaJP['settings-page:startup-page-folders'], '/listview/folders'],
  ] as const) {
    test(`opens ${path} once "${option}" is chosen`, async ({ page }) => {
      await openSettings(page)
      await choose(page, option)

      await page.goto('/start')

      await page.waitForURL(`**${path}`)
    })
  }

  test('opens a folder chosen by name', async ({ page }) => {
    await page.goto('/listview/folders/special/all')
    await seedFolders(page, ['Chill'])
    await openSettings(page)
    await choose(page, 'Chill')

    await page.goto('/start')

    await page.waitForURL('**/listview/folders/userFolder?folderName=Chill')
  })

  test('follows the folder when it is renamed', async ({ page }) => {
    await page.goto('/listview/folders/special/all')
    await seedFolders(page, ['Chill'])
    await openSettings(page)
    await choose(page, 'Chill')

    await page.goto('/listview/folders')
    await page.addStyleTag({
      content: 'nextjs-portal { display: none !important; }',
    })
    await page
      .getByRole('button', {
        name: jaJP['folders-page:menu'].replace('{0}', 'Chill'),
      })
      .click()
    await page
      .getByRole('menuitem', { name: jaJP['app-sidebar:rename'] })
      .click()
    await page.getByLabel(jaJP['folders-page:new-name']).fill('Relax')
    await page.getByRole('button', { name: jaJP['general:save'] }).click()
    await expect(
      page.getByRole('button', {
        name: jaJP['folders-page:open'].replace('{0}', 'Relax'),
      }),
    ).toBeVisible()

    await page.goto('/start')

    await page.waitForURL('**/listview/folders/userFolder?folderName=Relax')
  })

  test('opens every world when the chosen folder is gone', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('startupPage', JSON.stringify('folder:Gone'))
    })
    await openSettings(page)
    await expect(page.getByTestId('startup-page-select')).toContainText('Gone')

    await page.goto('/start')

    await page.waitForURL('**/listview/folders/special/all')
  })
})
