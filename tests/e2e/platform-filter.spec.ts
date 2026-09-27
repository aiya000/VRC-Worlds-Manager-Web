import { expect, test, type Page } from '@playwright/test'
import jaJP from '../../locales/ja-JP.json'
import { seedWorld } from './seed-world'

const LIST_VIEW = '/listview/folders/special/all'

const PC_WORLD = 'DesktopOnlyHall'
const CROSS_WORLD = 'CrossPlatformPlaza'
const UNKNOWN_WORLD = 'PlatformlessPlace'

test.use({ serviceWorkers: 'block' })

async function openTheFilters(page: Page) {
  await page.getByTestId('advanced-search-open').click()
  await expect(page.getByRole('dialog')).toContainText(
    jaJP['advanced-search:title'],
  )
}

async function toggle(page: Page, platform: string) {
  await page.locator(`#list-platform-${platform}`).click()
}

async function expectShown(page: Page, names: string[]) {
  for (const name of [PC_WORLD, CROSS_WORLD, UNKNOWN_WORLD]) {
    const world = page.getByText(name).first()
    if (names.includes(name)) {
      await expect(world).toBeVisible()
    } else {
      await expect(world).toBeHidden()
    }
  }
}

/**
 * The checkboxes ask for a world that supports all of what is ticked, which is
 * the opposite of how this kind of row usually reads, so each case here is one
 * the AND has to get right.
 */
test.describe('filtering the list by supported platform', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LIST_VIEW)
    await page.addStyleTag({
      content: 'nextjs-portal { display: none !important; }',
    })
    await seedWorld(page, {
      worldId: 'wrld_platform_pc',
      name: PC_WORLD,
      platform: ['standalonewindows'],
    })
    await seedWorld(page, {
      worldId: 'wrld_platform_cross',
      name: CROSS_WORLD,
      platform: ['standalonewindows', 'android'],
    })
    await seedWorld(page, {
      worldId: 'wrld_platform_unknown',
      name: UNKNOWN_WORLD,
      platform: [],
    })
    await page.reload()
    await page.addStyleTag({
      content: 'nextjs-portal { display: none !important; }',
    })
    await expectShown(page, [PC_WORLD, CROSS_WORLD, UNKNOWN_WORLD])
  })

  test('shows the checkboxes on the list itself', async ({ page }) => {
    await expect(page.getByTestId('list-platform-filter')).toBeVisible()
    await expect(page.getByTestId('list-platform-filter')).toContainText(
      jaJP['platform-filter:label'],
    )
  })

  test('shows everything while no box is ticked', async ({ page }) => {
    await expectShown(page, [PC_WORLD, CROSS_WORLD, UNKNOWN_WORLD])
  })

  test('keeps only the worlds that support the ticked platform', async ({
    page,
  }) => {
    await toggle(page, 'android')

    await expectShown(page, [CROSS_WORLD])
  })

  test('wants both when both are ticked, not either', async ({ page }) => {
    await toggle(page, 'android')
    await toggle(page, 'ios')

    await expectShown(page, [])
  })

  test('finds the world VRChat said nothing about under "unknown"', async ({
    page,
  }) => {
    await toggle(page, 'unknown')

    await expectShown(page, [UNKNOWN_WORLD])
  })

  test('brings everything back when the box is unticked again', async ({
    page,
  }) => {
    await toggle(page, 'android')
    await expectShown(page, [CROSS_WORLD])

    await toggle(page, 'android')

    await expectShown(page, [PC_WORLD, CROSS_WORLD, UNKNOWN_WORLD])
  })

  test('brings everything back through "clear all"', async ({ page }) => {
    await toggle(page, 'android')
    await expectShown(page, [CROSS_WORLD])

    await openTheFilters(page)
    await page.getByRole('button', { name: jaJP['general:clear-all'] }).click()
    await page.keyboard.press('Escape')

    await expectShown(page, [PC_WORLD, CROSS_WORLD, UNKNOWN_WORLD])
    await expect(page.locator('#list-platform-android')).not.toBeChecked()
  })

  test('explains the AND behind the "?" beside the label', async ({ page }) => {
    await page.getByTestId('list-platform-filter-help').click()

    await expect(
      page.getByTestId('list-platform-filter-explanation'),
    ).toContainText(jaJP['platform-filter:hint'])
  })
})

/**
 * On a phone the row would take two more lines above the grid, so it starts
 * folded behind a button beside the sort controls.
 */
test.describe('the platform row on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await page.goto(LIST_VIEW)
    await page.addStyleTag({
      content: 'nextjs-portal { display: none !important; }',
    })
    await expect(page.getByTestId('platform-filter-toggle')).toBeVisible()
  })

  test('starts folded', async ({ page }) => {
    await expect(page.getByTestId('list-platform-filter')).toBeHidden()
    await expect(page.getByTestId('platform-filter-toggle')).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  test('unfolds on a press, and folds again on the next', async ({ page }) => {
    const toggleButton = page.getByTestId('platform-filter-toggle')

    await toggleButton.click()
    await expect(page.getByTestId('list-platform-filter')).toBeVisible()
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

    await toggleButton.click()
    await expect(page.getByTestId('list-platform-filter')).toBeHidden()
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
  })

  test('marks the folded button while a box is ticked', async ({ page }) => {
    const toggleButton = page.getByTestId('platform-filter-toggle')
    await expect(page.getByTestId('platform-filter-active-dot')).toHaveCount(0)

    await toggleButton.click()
    await toggle(page, 'android')
    await toggleButton.click()

    await expect(page.getByTestId('platform-filter-active-dot')).toBeVisible()
  })
})

test.describe('the platform row on a VR overlay panel', () => {
  test.use({ viewport: { width: 720, height: 640 } })

  test('is always open, with nothing to unfold', async ({ page }) => {
    await page.goto(LIST_VIEW)

    await expect(page.getByTestId('list-platform-filter')).toBeVisible()
    await expect(page.getByTestId('platform-filter-toggle')).toBeHidden()
  })
})
