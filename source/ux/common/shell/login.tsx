/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Login                                                                        ║
║ Passwordless OTP authentication UI.                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Two-step login form:
  Step 1 collects email and sends an OTP via api.Auth.
  Step 2 collects the code and verifies it.

Auth state flows through onAuthStateChange in the app shell —
this component does not write to sessionStore directly.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Login Passwordless OTP login component.
*/

import { createEffect, createSignal, For, Show } from '@solid-js'
import { useNavigate } from '@tanstack/solid-router'
import { api } from '@ux/api'
import { UiAlert, UiButton, UiField, UiFormActions, UiInput, UiLayout } from '@ux/common/components/ui'
import { getShellMetadata, type ShellMetadata } from './shell-metadata.ts'

import './login.css'
import logoArt from '@ux/common/assets/logos/swarmag-ops-logo-art.png'

/** Passwordless OTP login component. */
export const Login = () => {
  const shell = getShellMetadata()
  return <LoginClient shell={shell} />
}

/** OTP flow step discriminator. */
type LoginStep = 'email' | 'code'

/** Login shell component props. */
type LoginClientProps = {
  shell: ShellMetadata
}

/** Login client component. */
const LoginClient = (props: LoginClientProps) => {
  const navigate = useNavigate()
  const [step, setStep] = createSignal<LoginStep>('email')
  const [email, setEmail] = createSignal('')
  const [code, setCode] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [pending, setPending] = createSignal(false)

  /** Redirects to the dashboard if the user is already authenticated. */
  createEffect(() => {
    const session = api.SessionState.store
    if (!session.isLoading && session.isAuthenticated) {
      void navigate({ to: '/dashboard', replace: true })
    }
  })

  /** Sends the OTP code to the user's email. */
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

  /** Verifies the OTP code and logs the user in if valid. */
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
      <div data-ui='login-layout'>
        <UiLayout gap='loose'>
          {/* Login hero block */}
          <div data-ui='login-hero'>
            <img data-ui='login-logo' src={logoArt} alt='swarmAg' />
            <UiLayout gap='tight'>
              <span data-ui='login-product'>{props.shell.identity.productName}</span>
              <span data-ui='login-application'>{props.shell.identity.applicationName}</span>
            </UiLayout>
          </div>

          {/* STEP 1: validate email and send OTP code */}
          <div data-ui='login-form'>
            <Show when={step() === 'email'}>
              <UiLayout>
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

            {/* STEP 2: OTP code delivered now validate */}
            <Show when={step() === 'code'}>
              <UiLayout>
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
              </UiLayout>
            </Show>

            {/* Display alert message if error */}
            <Show when={!!error()}>
              <UiAlert variant='danger'>{error()}</UiAlert>
            </Show>
          </div>
        </UiLayout>

        {/* Shell configuration metadata */}
        <div>
          <dl data-ui='login-config'>
            <For each={props.shell.config}>
              {datum => (
                <div>
                  <dt>{datum.label}</dt>
                  <dd>{datum.value}</dd>
                </div>
              )}
            </For>
          </dl>
        </div>
      </div>
    </div>
  )
}
