/**
 * Namespace-local helpers for control primitive semantics.
 */

import { onCleanup } from '@solid-js'

/** Semantic control state values allowed by the design language. */
export type AppControlState = 'error' | 'disabled' | 'loading'

/** Props used to derive semantic control state. */
export type AppControlStateProps = {
  error?: boolean
  loading?: boolean
  disabled?: boolean
}

/** Derive the semantic control state from runtime control props. */
export const controlState = (
  props: AppControlStateProps
): AppControlState | undefined => {
  if (props.loading) return 'loading'
  if (props.error) return 'error'
  if (props.disabled) return 'disabled'
  return undefined
}

/** Mirror primitive selection attributes into the normalized data-active marker. */
export const bindActiveAttribute = (
  element: Element,
  attributes: readonly string[]
): void => {
  const sync = () => {
    const active = attributes.some(attribute => {
      const value = element.getAttribute(attribute)
      return value !== null && value !== 'false'
    })
    if (active) element.setAttribute('data-active', '')
    else element.removeAttribute('data-active')
  }

  sync()
  const observer = new MutationObserver(sync)
  observer.observe(element, { attributes: true, attributeFilter: [...attributes] })
  onCleanup(() => observer.disconnect())
}
