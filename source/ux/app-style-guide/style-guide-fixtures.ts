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
FIELDS                  Example field records for table rendering.
COLOR_SWATCHES          Design token swatches for color validation.
BUTTON_VARIANTS         Button variant examples.
STATUSES                Service status options.
SERVICES                Service category options.
DEFAULT_SERVICES        Default multi-select service values.
ACCORDION_DEFAULT_VALUE Default open accordion value.
*/

export const FIELDS = [
  {
    name: 'North Field',
    acres: 142,
    service: 'Aerial - Fixed Wing',
    status: 'Active',
    date: '2025-04-18'
  },
  {
    name: 'South Paddock',
    acres: 89,
    service: 'Ground - Sprayer',
    status: 'Scheduled',
    date: '2025-04-22'
  },
  {
    name: 'East Block',
    acres: 210,
    service: 'Aerial - Rotary',
    status: 'Pending',
    date: '2025-04-25'
  },
  {
    name: 'River Flat',
    acres: 63,
    service: 'Ground - Spreader',
    status: 'Blocked',
    date: '2025-04-30'
  },
  {
    name: 'West Ridge',
    acres: 175,
    service: 'Aerial - Fixed Wing',
    status: 'Active',
    date: '2025-05-02'
  }
] as const

export const COLOR_SWATCHES = [
  { label: 'primary', token: '--sa-color-primary', value: 'var(--sa-color-primary)' },
  { label: 'success', token: '--sa-color-success', value: 'var(--sa-color-success)' },
  { label: 'warning', token: '--sa-color-warning', value: 'var(--sa-color-warning)' },
  { label: 'danger', token: '--sa-color-danger', value: 'var(--sa-color-danger)' },
  { label: 'info', token: '--sa-color-info', value: 'var(--sa-color-info)' }
] as const

export const BUTTON_VARIANTS = [
  { label: 'Ghost', variant: 'ghost' },
  { label: 'Primary', variant: 'primary' },
  { label: 'Secondary', variant: 'secondary' },
  { label: 'Danger', variant: 'danger' }
] as const

export const STATUSES = ['Scheduled', 'Ready', 'Blocked', 'Complete'] as const

export const SERVICES = ['Aerial', 'Ground', 'Inspection', 'Followup'] as const

export const DEFAULT_SERVICES = ['Aerial', 'Ground'] as const

export const ACCORDION_DEFAULT_VALUE = ['weather'] as const
