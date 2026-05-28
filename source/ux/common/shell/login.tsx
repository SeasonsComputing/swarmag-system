/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Login                                                                        ║
║ Passwordless OTP authentication UI.                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Two-step login form. Step 1 collects email and sends an OTP via api.Auth.
Step 2 collects the code and verifies it. Auth state flows through
onAuthStateChange in the app shell — this component does not write to
sessionStore directly.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Login Passwordless OTP login component.
*/

import { createSignal, Show } from '@solid-js'
import { api } from '@ux/api'
import {
  AppAlert,
  AppButton,
  AppField,
  AppFormActions,
  AppInput,
  AppLayout
} from '@ux/common/components/controls'

import './login.css'
import logoArt from '@ux/common/assets/logos/swarmag-ops-logo-art.png'

/** OTP flow step discriminator. */
type LoginStep = 'email' | 'code'

/** Passwordless OTP login component. */
export const Login = () => {
  const [step, setStep] = createSignal<LoginStep>('email')
  const [email, setEmail] = createSignal('')
  const [code, setCode] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [pending, setPending] = createSignal(false)

  const submitEmail = async () => {
    setPending(true)
    setError(null)
    try {
      await api.Auth.sendOtp(email())
      setStep('code')
    } catch (_e) {
      setError('Could not send code. Please try again.')
    } finally {
      setPending(false)
    }
  }

  const submitCode = async () => {
    setPending(true)
    setError(null)
    try {
      await api.Auth.verifyOtp(email(), code())
    } catch (_e) {
      setError('Invalid or expired code. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div data-ui='login' data-theme='light'>
      <div data-ui='login-hero'>
        <img data-ui='login-logo' src={logoArt} alt='swarmAg' />
      </div>
      <div data-ui='login-form'>
        <Show when={step() === 'email'}>
          <p>Enter your email to receive a one-time sign-in code.</p>
          <AppField for='email' label='Email'>
            <AppInput
              name='email'
              type='email'
              autocomplete='email'
              value={email()}
              onInput={e => setEmail(e.currentTarget.value)}
              error={error() !== null}
              disabled={pending()}
              required
            />
          </AppField>
          <AppLayout variant='inline-fill'>
            <AppButton
              type='button'
              variant='primary'
              loading={pending()}
              onClick={() => void submitEmail()}
            >
              Send Code
            </AppButton>
          </AppLayout>
        </Show>
        <Show when={step() === 'code'}>
          <p>
            Enter the 6-digit code sent to <strong>{email()}</strong>.
          </p>
          <AppField for='code' label='Code'>
            <AppInput
              name='code'
              type='text'
              inputMode='numeric'
              autocomplete='one-time-code'
              value={code()}
              onInput={e => setCode(e.currentTarget.value)}
              error={error() !== null}
              disabled={pending()}
              required
            />
          </AppField>
          <AppFormActions>
            <AppButton type='button' variant='ghost' onClick={() => setStep('email')}>
              Back
            </AppButton>
            <AppButton
              type='button'
              variant='primary'
              loading={pending()}
              onClick={() => void submitCode()}
            >
              Sign In
            </AppButton>
          </AppFormActions>
        </Show>
        <Show when={!!error()}>
          <AppAlert variant='danger'>{error()}</AppAlert>
        </Show>
      </div>
    </div>
  )
}
