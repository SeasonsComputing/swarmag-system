/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel probe                                                                  ║
║ Temporary on-device layout readout for responsive diagnosis.                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Reads live layout measurements on devices without remote debugging and presents
them as selectable text for copy-out. Temporary diagnostic scaffolding: delete
this file, its stylesheet, and the mount in panel-container.tsx when the
responsive work closes.

Reports raw measurements only. Container-query thresholds are deliberately not
evaluated here, because matchMedia would test the viewport rather than the
container and the two differ by the dialog's own padding.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelProbe  Floating action that opens a measurement readout.
*/

import { UiActionButton, UiDialog, UiTextArea } from '@front/ux/ui'
import { createSignal } from '@solid-js'

import './panel-probe.css'

/** Elements measured on every run, in report order. */
const PROBE_TARGETS = [
  '[data-ui=\'dialog\']',
  '[data-shell-panel=\'container\']',
  '[data-shell-panel=\'index\']',
  '[data-shell-panel=\'subject\']',
  '[data-shell-panel=\'accessory\']',
  '[data-ui=\'collection-cursor\']',
  '[data-ui=\'collection-cursor-readout\']'
] as const

/** Root custom properties read on every run. */
const PROBE_TOKENS = [
  '--sa-base-size',
  '--sa-rhythm-gutter',
  '--sa-rhythm-pad',
  '--sa-rhythm-gap',
  '--sa-rhythm-gap-tight'
] as const

/** Real media conditions in the stylesheets, reported as matched or not. */
const PROBE_MEDIA = ['(max-width: 380px)', '(max-width: 480px)'] as const

/** Report column at which measured values begin. */
const LABEL_WIDTH = 38

/** Rounds a measured length to one decimal place. */
const round = (value: number): string => Math.round(value * 10) / 10 + ''

/** Formats one element's border-box and content-box inline sizes. */
const measure = (selector: string): string => {
  const element = document.querySelector(selector)
  const label = selector.padEnd(LABEL_WIDTH)
  if (!element) return `${label}—`
  const border = round(element.getBoundingClientRect().width)
  return `${label}border ${border}   content ${element.clientWidth}`
}

/*
Custom properties do not compute to a used value at the root — they substitute
at point of use, so reading them off documentElement returns the clamp() source
text. Assigning each to a real longhand on a throwaway element and reading the
computed longhand back is what forces resolution to pixels.
*/
const resolveTokens = (): string[] => {
  const probe = document.createElement('div')
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  document.body.appendChild(probe)
  const lines = PROBE_TOKENS.map(token => {
    probe.style.width = `var(${token})`
    return token.padEnd(LABEL_WIDTH) + getComputedStyle(probe).width
  })
  probe.remove()
  return lines
}

/*
The cursor's own width is what it was allocated, not what it needs. Its parent
carries the interior that stands between the subject track and the navbar, so
the parent's content box is the honest available measure.
*/
const measureCursorParent = (): string => {
  const parent = document.querySelector('[data-ui=\'collection-cursor\']')?.parentElement
  const label = 'cursor parent'.padEnd(LABEL_WIDTH)
  if (!parent) return `${label}—`
  const style = getComputedStyle(parent)
  const padding = `${style.paddingInlineStart} / ${style.paddingInlineEnd}`
  return `${label}content ${parent.clientWidth}   padding ${padding}`
}

/** Reports the container's used column gap — a term in the collapse sum. */
const measureGap = (): string => {
  const container = document.querySelector('[data-shell-panel=\'container\']')
  const label = 'container column-gap'.padEnd(LABEL_WIDTH)
  return container ? label + getComputedStyle(container).columnGap : `${label}—`
}

/** Names an element by its design-system dataset hook, else by tag. */
const identify = (element: Element): string => {
  const data = (element as HTMLElement).dataset
  return data.ui ?? data.shellPanel ?? data.shell ?? data.widget ?? data.app
    ?? element.tagName.toLowerCase()
}

/*
Reports only the OUTERMOST offenders — an element that crosses the container's
edge while its parent does not. Every descendant of an overflowing box also
overflows, so listing all of them buries the one that actually escaped.
*/
const findOverflow = (): string => {
  const container = document.querySelector('[data-shell-panel=\'container\']')
  if (!container) return '  —'
  const edge = container.getBoundingClientRect().right
  const rows = Array.from(container.querySelectorAll('*'))
    .filter(element => {
      if (element.getBoundingClientRect().right <= edge + 1) return false
      const parent = element.parentElement
      return !parent || parent === container || parent.getBoundingClientRect().right <= edge + 1
    })
    .slice(0, 10)
    .map(element => {
      const rect = element.getBoundingClientRect()
      const name = `  ${identify(element)}`.padEnd(LABEL_WIDTH)
      return `${name}w ${round(rect.width)}   over ${round(rect.right - edge)}`
    })
  return rows.length === 0 ? '  (none)' : rows.join('\n')
}

/** Formats every rendered action-button label; a zero width means hidden. */
const measureLabels = (): string => {
  const labels = Array.from(document.querySelectorAll('[data-ui=\'action-button-label\']'))
  if (labels.length === 0) return '  (none rendered)'
  return labels
    .map(label => {
      const text = `  '${label.textContent}'`.padEnd(LABEL_WIDTH)
      return `${text}${round(label.getBoundingClientRect().width)}`
    })
    .join('\n')
}

/** Builds the full readout text. */
const buildReport = (): string => {
  const visual = globalThis.visualViewport
  return [
    `innerWidth x innerHeight`.padEnd(LABEL_WIDTH)
    + `${globalThis.innerWidth} x ${globalThis.innerHeight}`,
    `visualViewport`.padEnd(LABEL_WIDTH)
    + (visual ? `${round(visual.width)} x ${round(visual.height)}` : '—'),
    `devicePixelRatio`.padEnd(LABEL_WIDTH) + globalThis.devicePixelRatio,
    '',
    ...PROBE_TARGETS.map(measure),
    measureCursorParent(),
    measureGap(),
    '',
    'overflowing past container edge',
    findOverflow(),
    '',
    'action-button labels (0 = hidden)',
    measureLabels(),
    '',
    ...resolveTokens(),
    '',
    ...PROBE_MEDIA.map(query =>
      `@media ${query}`.padEnd(LABEL_WIDTH) + globalThis.matchMedia(query).matches
    )
  ].join('\n')
}

/** Floating action that opens a measurement readout. */
export const PanelProbe = () => {
  const [open, setOpen] = createSignal(false)
  const [report, setReport] = createSignal('')

  const run = (): void => {
    setReport(buildReport())
    setOpen(true)
  }

  return (
    <>
      <div data-shell='panel-probe'>
        <UiActionButton icon='ruler-square' label='Probe' density='dense' onClick={run} />
      </div>
      <UiDialog open={open()} onOpenChange={setOpen} size='panel' dismissible>
        <div data-shell='panel-probe-report'>
          <UiTextArea name='panel-probe-report' readOnly rows={20} value={report()} />
        </div>
      </UiDialog>
    </>
  )
}
