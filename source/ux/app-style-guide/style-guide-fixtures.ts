/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ swarmAg style guide fixtures                                                 ║
║ Static fixture data for the living style guide application.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides fixture data used to render static style-guide examples.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
COLOR_SWATCHES          Design token swatches for color validation.
TEXT_TOKENS             Design token text colors.
COLOR_TOKENS            Design token colors.
BUTTON_VARIANTS         Button variant examples.
STATUSES                Service status options.
SERVICES                Service category options.
DEFAULT_SERVICES        Default multi-select service values.
ACCORDION_DEFAULT_VALUE Default open accordion value.
EQUIPMENT               Grouped equipment records for section-row table rendering.
*/

export const COLOR_SWATCHES = [
  {
    legend: 'Color',
    colors: [
      { label: 'primary', token: '--sa-color-primary', value: 'var(--sa-color-primary)' },
      { label: 'secondary', token: '--sa-color-secondary', value: 'var(--sa-color-secondary)' },
      { label: 'accent', token: '--sa-color-accent', value: 'var(--sa-color-accent)' }
    ]
  },
  {
    legend: 'State',
    colors: [
      { label: 'success', token: '--sa-state-success', value: 'var(--sa-state-success)' },
      { label: 'warning', token: '--sa-state-warning', value: 'var(--sa-state-warning)' },
      { label: 'danger', token: '--sa-state-danger', value: 'var(--sa-state-danger)' },
      { label: 'info', token: '--sa-state-info', value: 'var(--sa-state-info)' }
    ]
  }
] as const

export const COLOR_GRADIENTS = [
  { label: 'brand', token: '--sa-gradient-brand', value: 'var(--sa-gradient-brand)' },
  { label: 'brand-90', token: '--sa-gradient-brand-90', value: 'var(--sa-gradient-brand-90)' },
  {
    label: 'brand-inverse',
    token: '--sa-gradient-brand-inverse',
    value: 'var(--sa-gradient-brand-inverse)'
  },
  { label: 'card', token: '--sa-gradient-card', value: 'var(--sa-gradient-card)' },
  { label: 'hero', token: '--sa-gradient-hero', value: 'var(--sa-gradient-hero)' },
  { label: 'stripe', token: '--sa-gradient-stripe', value: 'var(--sa-gradient-stripe)' }
] as const

export const TEXT_TOKENS = [
  '--sa-text-primary',
  '--sa-text-secondary',
  '--sa-text-dim',
  '--sa-text-disabled',
  '--sa-text-placeholder',
  '--sa-text-h1',
  '--sa-text-h2',
  '--sa-text-h3',
  '--sa-text-h4',
  '--sa-text-h5'
] as const

export const BUTTON_VARIANTS = [
  { label: 'Ghost', variant: 'ghost' },
  { label: 'Primary', variant: 'primary' },
  { label: 'Secondary', variant: 'secondary' },
  { label: 'Danger', variant: 'danger' }
] as const

export const STATUSES = [
  { value: 'Scheduled' },
  { value: 'Ready' },
  { value: 'Blocked' },
  { value: 'Complete' }
] as const satisfies ReadonlyArray<{ value: string; label?: string }>

export const SERVICES = [
  { value: 'Aerial' },
  { value: 'Ground' },
  { value: 'Inspection' },
  { value: 'Followup' }
] as const satisfies ReadonlyArray<{ value: string; label?: string }>

export const DEFAULT_SERVICES = ['Aerial', 'Ground'] as const

export const ACCORDION_DEFAULT_VALUE = ['weather'] as const

export const EQUIPMENT = [
  {
    section: 'Ground Machinery',
    items: [
      {
        name: 'John Deere SkidSteer',
        application: 'Front-loaders & attachments for ground operations',
        price: '$145,000',
        cost: '$89/hr'
      },
      {
        name: 'Bobcat Toolcat',
        application: 'Utility vehicles & attachments for specialized tasks',
        price: '$52,000',
        cost: '$42/hr'
      }
    ]
  },
  {
    section: 'Aerial Drones',
    items: [
      {
        name: 'XAG P150',
        application: 'Industrial drones for heavy payloads',
        price: '$28,500',
        cost: '$18/hr'
      },
      {
        name: 'DJI T30',
        application: 'Agricultural drones for aerial applications',
        price: '$23,000',
        cost: '$15/hr'
      },
      {
        name: 'DJI P4',
        application: 'Multispectral drones for detailed terrain analysis',
        price: '$9,500',
        cost: '$8/hr'
      }
    ]
  }
] as const
