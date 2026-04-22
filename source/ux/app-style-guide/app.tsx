/**
 * swarmAg style guide application entrypoint.
 */

import { render } from '@solid-js/web'
import '@ux/common/assets/css/tokens.css'
import '@ux/common/assets/css/controls.css'
import { StyleGuide } from './style-guide.tsx'
import './style-guide.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

render(() => <StyleGuide />, root)
