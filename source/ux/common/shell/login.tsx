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

import { createEffect, createSignal, Show } from '@solid-js'
import { useNavigate } from '@tanstack/solid-router'
import { api } from '@ux/api'
import {
  UiAlert,
  UiButton,
  UiCard,
  UiField,
  UiFormActions,
  UiInput,
  UiLayout
} from '@ux/common/components/ui'

import './login.css'
import logoArt from '@ux/common/assets/logos/swarmag-ops-logo-art.png'

/** OTP flow step discriminator. */
type LoginStep = 'email' | 'code'

/** Passwordless OTP login component. */
export const Login = () => {
  const navigate = useNavigate()
  const [step, setStep] = createSignal<LoginStep>('email')
  const [email, setEmail] = createSignal('')
  const [code, setCode] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [pending, setPending] = createSignal(false)

  createEffect(() => {
    const session = api.SessionState.store
    if (!session.isLoading && session.isAuthenticated) {
      void navigate({ to: '/dashboard', replace: true })
    }
  })

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
    <div data-ui='login'>
      <div data-ui='login-hero'>
        <img data-ui='login-logo' src={logoArt} alt='swarmAg' />
      </div>
      <div data-ui='login-form'>
        <Show when={step() === 'email'}>
          <p>Enter your email to receive a one-time sign-in code.</p>
          <UiField for='email' label='Email'>
            <UiInput
              name='email'
              type='email'
              autocomplete='email'
              value={email()}
              onInput={e => setEmail(e.currentTarget.value)}
              error={error() !== null}
              disabled={pending()}
              required
            />
          </UiField>
          <UiLayout variant='inline-fill'>
            <UiButton
              type='button'
              variant='primary'
              loading={pending()}
              onClick={() => void submitEmail()}
            >
              Send Code
            </UiButton>
          </UiLayout>
        </Show>
        <Show when={step() === 'code'}>
          <p>
            Enter the 6-digit code sent to <strong>{email()}</strong>.
          </p>
          <UiField for='code' label='Code'>
            <UiInput
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
          </UiField>
          <UiFormActions>
            <UiButton type='button' variant='ghost' onClick={() => setStep('email')}>
              Back
            </UiButton>
            <UiButton
              type='button'
              variant='primary'
              loading={pending()}
              onClick={() => void submitCode()}
            >
              Sign In
            </UiButton>
          </UiFormActions>
        </Show>
        <Show when={!!error()}>
          <UiCard>
            <UiAlert variant='danger'>{error()}</UiAlert>
          </UiCard>
        </Show>
      </div>
    </div>
  )
}
