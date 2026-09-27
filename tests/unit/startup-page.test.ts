import { describe, expect, it } from 'vitest'
import {
  folderStartupPage,
  normalizeStartupPage,
  startupPagePath,
} from '@/lib/startup-page'

describe('startupPagePath', () => {
  it.each([
    ['all', '/listview/folders/special/all'],
    ['unclassified', '/listview/folders/special/unclassified'],
    ['recently-visited', '/listview/recently-visited'],
    ['search', '/listview/search'],
    ['folders', '/listview/folders'],
  ] as const)('sends %s to %s', (page, path) => {
    expect(startupPagePath(page, [])).toBe(path)
  })

  it('opens a folder that exists, by its encoded name', () => {
    expect(startupPagePath(folderStartupPage('今度 行く'), ['今度 行く'])).toBe(
      '/listview/folders/userFolder?folderName=%E4%BB%8A%E5%BA%A6%20%E8%A1%8C%E3%81%8F',
    )
  })

  it('falls back to every world when the folder is gone', () => {
    expect(startupPagePath(folderStartupPage('Gone'), ['Chill'])).toBe(
      '/listview/folders/special/all',
    )
  })
})

describe('normalizeStartupPage', () => {
  it('keeps what it recognises', () => {
    expect(normalizeStartupPage('search')).toBe('search')
    expect(normalizeStartupPage('folder:Chill')).toBe('folder:Chill')
  })

  it.each([undefined, 42, 'nowhere', 'folder:'])(
    'reads %s as the default',
    (value) => {
      expect(normalizeStartupPage(value)).toBe('all')
    },
  )
})
