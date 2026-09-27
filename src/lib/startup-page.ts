/**
 * The screen `/start` opens once it knows the user is signed in. A user folder
 * is stored by name with this prefix, beside the fixed screens, so the whole
 * choice is one string -- the shape every other synced setting has.
 */
export type StartupPage =
  | 'all'
  | 'unclassified'
  | 'recently-visited'
  | 'search'
  | 'folders'
  | `folder:${string}`

export const DEFAULT_STARTUP_PAGE: StartupPage = 'all'

export const fixedStartupPages = [
  'all',
  'unclassified',
  'recently-visited',
  'search',
  'folders',
] as const satisfies StartupPage[]

const FOLDER_PREFIX = 'folder:'

export function folderStartupPage(folderName: string): StartupPage {
  return `${FOLDER_PREFIX}${folderName}`
}

/** The folder a startup page names, or `null` for one of the fixed screens. */
export function startupFolderName(page: StartupPage): string | null {
  return page.startsWith(FOLDER_PREFIX)
    ? page.slice(FOLDER_PREFIX.length)
    : null
}

/**
 * Anything stored that is not a startup page -- a value from a newer build, or
 * a hand-edited one -- reads as the default rather than as a broken launch.
 */
export function normalizeStartupPage(value: unknown): StartupPage {
  if (typeof value !== 'string') {
    return DEFAULT_STARTUP_PAGE
  }
  if (fixedStartupPages.some((page) => page === value)) {
    return value as StartupPage
  }
  if (value.startsWith(FOLDER_PREFIX) && value.length > FOLDER_PREFIX.length) {
    return value as StartupPage
  }
  return DEFAULT_STARTUP_PAGE
}

/**
 * Where to go for `page`. A folder that no longer exists -- deleted, or renamed
 * on another device -- falls back to every world rather than to an empty page
 * titled with a name nobody has any more.
 */
export function startupPagePath(
  page: StartupPage,
  existingFolderNames: string[],
): string {
  const folderName = startupFolderName(page)
  if (folderName !== null) {
    return existingFolderNames.includes(folderName)
      ? `/listview/folders/userFolder?folderName=${encodeURIComponent(folderName)}`
      : startupPagePath(DEFAULT_STARTUP_PAGE, existingFolderNames)
  }
  switch (page) {
    case 'unclassified':
      return '/listview/folders/special/unclassified'
    case 'recently-visited':
      return '/listview/recently-visited'
    case 'search':
      return '/listview/search'
    case 'folders':
      return '/listview/folders'
    default:
      return '/listview/folders/special/all'
  }
}
