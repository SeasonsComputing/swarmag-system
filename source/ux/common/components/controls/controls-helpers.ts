/**
 * Namespace-local helpers for control primitive semantics.
 */

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
