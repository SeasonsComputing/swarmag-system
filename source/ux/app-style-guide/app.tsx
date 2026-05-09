/**
 * swarmAg style guide application entrypoint.
 */

import { onMount } from '@solid-js'
import { render } from '@solid-js/web'
import { StyleGuide } from './style-guide.tsx'

import '@ux/common/assets/css/tokens.css'
import '@ux/common/assets/css/base.css'
import '@ux/common/assets/css/controls.css'
import '@ux/common/assets/css/forms.css'
import './style-guide.css'

const App = () => {
  onMount(() => document.body.style.opacity = '1')
  return <StyleGuide />
}

render(() => <App />, document.getElementById('root')!)
