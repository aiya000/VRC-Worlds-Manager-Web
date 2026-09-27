import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DeviceOnlySettingToggle } from '@/components/device-only-setting-toggle'
import { useLocalization } from '@/hooks/use-localization'
import { commands } from '@/lib/commands'
import { subscribeToPreferencesChanged } from '@/lib/services/preferences-changed'
import {
  DEFAULT_STARTUP_PAGE,
  folderStartupPage,
  normalizeStartupPage,
  startupFolderName,
  type StartupPage,
} from '@/lib/startup-page'
import { useFolders } from '@/app/listview/hook/use-folders'

const fixedPageLabelKeys = {
  all: 'general:all-worlds',
  unclassified: 'general:unclassified-worlds',
  'recently-visited': 'find-page:recently-visited',
  search: 'general:search-worlds',
  folders: 'settings-page:startup-page-folders',
} as const

interface StartupPageSectionProps {
  isDeviceOnly: boolean
  onDeviceOnlyChange: (deviceOnly: boolean) => void
}

export function StartupPageSection({
  isDeviceOnly,
  onDeviceOnlyChange,
}: StartupPageSectionProps) {
  const { t } = useLocalization()
  const { folders } = useFolders()
  const [startupPage, setStartupPage] =
    useState<StartupPage>(DEFAULT_STARTUP_PAGE)

  // Read again when a sync or a restore replaces the stored choice.
  useEffect(() => {
    const load = async () => {
      const result = await commands.getStartupPage()
      if (result.status === 'ok') {
        setStartupPage(result.data)
      }
    }
    load()
    return subscribeToPreferencesChanged(() => {
      load()
    })
  }, [])

  const handleChange = async (value: string) => {
    const page = normalizeStartupPage(value)
    const result = await commands.setStartupPage(page)
    if (result.status === 'ok') {
      setStartupPage(page)
    } else {
      toast(t('general:error-title'), { description: result.error })
    }
  }

  const folderNames = folders.map((folder) => folder.name)
  const chosenFolder = startupFolderName(startupPage)
  const chosenFolderIsMissing =
    chosenFolder !== null && !folderNames.includes(chosenFolder)

  return (
    <Card className="flex flex-col gap-3 p-4 rounded-lg border">
      <div className="flex w-full flex-row items-center justify-between gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label className="text-base font-medium">
            {t('settings-page:startup-page-title')}
          </Label>
          <div className="text-sm text-muted-foreground">
            {t('settings-page:startup-page-description')}
          </div>
        </div>
        <Select value={startupPage} onValueChange={handleChange}>
          <SelectTrigger
            data-testid="startup-page-select"
            className="w-[180px] shrink-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(fixedPageLabelKeys).map(([page, labelKey]) => (
              <SelectItem key={page} value={page}>
                {t(labelKey)}
              </SelectItem>
            ))}
            {(folderNames.length > 0 || chosenFolderIsMissing) && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>{t('general:folders')}</SelectLabel>
                  {folderNames.map((name) => (
                    <SelectItem key={name} value={folderStartupPage(name)}>
                      {name}
                    </SelectItem>
                  ))}
                  {chosenFolderIsMissing && (
                    <SelectItem value={startupPage}>
                      {t(
                        'settings-page:startup-page-missing-folder',
                        chosenFolder,
                      )}
                    </SelectItem>
                  )}
                </SelectGroup>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
      <DeviceOnlySettingToggle
        settingKey="startupPage"
        label={t('settings-page:device-only-label')}
        description={t('settings-page:device-only-description')}
        checked={isDeviceOnly}
        onCheckedChange={onDeviceOnlyChange}
      />
    </Card>
  )
}
