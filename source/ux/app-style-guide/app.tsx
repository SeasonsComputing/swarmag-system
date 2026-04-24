/**
 * swarmAg style guide application entrypoint.
 */

import { onMount } from '@solid-js'
import { render } from '@solid-js/web'
import '@ux/common/assets/css/tokens.css'
import '@ux/common/assets/css/base.css'
import '@ux/common/assets/css/controls.css'
import { StyleGuide } from './style-guide.tsx'
import './style-guide.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

const App = () => {
  onMount(() => {
    document.body.style.opacity = '1'
  })

  return <StyleGuide />
}

render(() => <App />, root)
