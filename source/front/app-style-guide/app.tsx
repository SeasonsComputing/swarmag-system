/**
 * swarmAg style guide application entrypoint.
 */

import { onMount } from '@solid-js'
import { render } from '@solid-js/web'
import { StyleGuide } from './style-guide.tsx'

const App = () => {
  onMount(() => document.body.style.opacity = '1')
  return <StyleGuide />
}

render(() => <App />, document.getElementById('root')!)
