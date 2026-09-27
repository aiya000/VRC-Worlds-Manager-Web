import { HelpHint } from '@/components/help-hint'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useLocalization } from '@/hooks/use-localization'
import type { PlatformFilter } from '@/lib/platform-filter'

const labelKeys: Record<PlatformFilter, string> = {
  standalonewindows: 'platform-filter:pc',
  android: 'platform-filter:android',
  ios: 'platform-filter:ios',
  unknown: 'platform-filter:unknown',
}

interface PlatformFilterCheckboxesProps<T extends PlatformFilter> {
  options: T[]
  values: T[]
  onValuesChange: (values: T[]) => void
  /** Distinguishes the checkbox ids when two of these are on one page. */
  idPrefix: string
  /**
   * One row with the hint behind a "?", for a place where every line is taken
   * from the grid below it.
   */
  inline?: boolean
}

export function PlatformFilterCheckboxes<T extends PlatformFilter>({
  options,
  values,
  onValuesChange,
  idPrefix,
  inline = false,
}: PlatformFilterCheckboxesProps<T>) {
  const { t } = useLocalization()

  const toggle = (option: T, checked: boolean) => {
    if (checked) {
      onValuesChange([...values, option])
    } else {
      onValuesChange(values.filter((value) => value !== option))
    }
  }

  const checkboxes = options.map((option) => {
    const id = `${idPrefix}-platform-${option}`
    return (
      <div key={option} className="flex items-center gap-2">
        <Checkbox
          id={id}
          checked={values.includes(option)}
          onCheckedChange={(checked) => toggle(option, !!checked)}
        />
        <label htmlFor={id} className="text-sm cursor-pointer py-1">
          {t(labelKeys[option])}
        </label>
      </div>
    )
  })

  if (inline) {
    return (
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-2"
        data-testid={`${idPrefix}-platform-filter`}
      >
        <div className="flex items-center gap-2">
          <Label>{t('platform-filter:label')}</Label>
          <HelpHint
            label={t('platform-filter:label')}
            tooltip={t('platform-filter:hint')}
            title={t('platform-filter:help-title')}
            sections={[
              {
                title: t('platform-filter:help-what-title'),
                body: t('platform-filter:hint'),
              },
            ]}
            testId={`${idPrefix}-platform-filter`}
          />
        </div>
        {checkboxes}
      </div>
    )
  }

  return (
    <div className="space-y-2" data-testid={`${idPrefix}-platform-filter`}>
      <Label>{t('platform-filter:label')}</Label>
      <div className="flex flex-wrap gap-x-6 gap-y-3">{checkboxes}</div>
      <p className="text-xs text-muted-foreground">
        {t('platform-filter:hint')}
      </p>
    </div>
  )
}
