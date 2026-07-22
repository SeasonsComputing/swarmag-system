/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Login                                                                        ║
║ Passwordless OTP authentication UI.                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Two-step login form:
  Step 1 collects email, validates user access and sends an OTP.
  Step 2 collects the code and verifies it.

Auth state flows through onAuthStateChange in the app shell —
this component does not write to sessionStore directly.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Login Passwordless OTP login component.
*/

import { api } from '@front/api'
import { UiActionButton, UiAlert, UiButton, UiField, UiInput, UiLayout } from '@front/ux/ui'
import { createSignal, onMount, Show } from '@solid-js'
import { Navigate } from '@tanstack/solid-router'
import { BrandHero } from './brand-hero.tsx'
import { ConfigTable } from './config-table.tsx'
import { getShellMetadata, type ShellMetadata } from './shell-metadata.ts'

import './login.css'

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

/** Focus a login input based on the current step. */
const focusLoginInput = (id: LoginStep): void => document.getElementById(id)?.focus()

/** Login client component. */
const LoginClient = (props: LoginClientProps) => {
  const session = api.SessionState.store
  const [step, setStep] = createSignal<LoginStep>('email')
  const [email, setEmail] = createSignal('')
  const [code, setCode] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [pending, setPending] = createSignal(false)

  onMount(() => focusLoginInput('email'))

  /** Keep login visible while auth is unresolved or unauthenticated. */
  const loginRequired = () => session.isLoading || !session.isAuthenticated

  /** Sends the OTP code to the user's email. */
  const submitEmail = async () => {
    if (pending()) return
    setPending(true)
    setError(null)
    try {
      const hasAccess = await api.Users.hasAccess(email())
      if (!hasAccess) {
        setError('Email address not registered.')
        return
      }
      await api.Auth.sendOtp(email())
      setStep('code')
      queueMicrotask(() => focusLoginInput('code'))
    } catch (_e) {
      setError('Could not send code. Please try again.')
    } finally {
      setPending(false)
    }
  }

  /** Verifies the OTP code and logs the user in if valid. */
  const submitCode = async () => {
    if (pending()) return
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

  /** Handle email form submission. */
  const submitEmailForm = (event: SubmitEvent) => {
    event.preventDefault()
    void submitEmail()
  }

  /** Handle code form submission. */
  const submitCodeForm = (event: SubmitEvent) => {
    event.preventDefault()
    void submitCode()
  }

  /** Return to the email step and restore focus. */
  const returnToEmail = () => {
    setStep('email')
    queueMicrotask(() => focusLoginInput('email'))
  }

  return (
    <Show
      when={loginRequired()}
      fallback={<Navigate to='/dashboard' replace />}
    >
      <div data-feat='login'>
        <div data-feat='login-layout'>
          <UiLayout gap='loose'>
            <BrandHero />

            <Show when={!session.isLoading}>
              {/* STEP 1: validate email and send OTP code */}
              <div data-feat='login-form'>
                <Show when={step() === 'email'}>
                  <form onSubmit={submitEmailForm}>
                    <UiLayout>
                      <p>Enter your email to receive a one-time sign-in code.</p>
                      <UiField for='email' label='Email'>
                        <UiInput
                          name='email'
                          type='email'
                          autocomplete='email'
                          placeholder='Enter your registered email'
                          value={email()}
                          onInput={e => setEmail(e.currentTarget.value)}
                          error={error() !== null}
                          disabled={pending()}
                          required
                        />
                      </UiField>
                      <UiButton type='submit' variant='primary' loading={pending()}>
                        Send Code
                      </UiButton>
                    </UiLayout>
                  </form>
                </Show>

                {/* STEP 2: OTP code delivered now validate */}
                <Show when={step() === 'code'}>
                  <form onSubmit={submitCodeForm}>
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
                      <UiLayout variant='inline-fill'>
                        <UiActionButton
                          align='start'
                          icon='arrow-left'
                          label='Back'
                          labelMode='visible'
                          onClick={returnToEmail}
                        />
                        <UiButton type='submit' variant='primary' loading={pending()}>
                          Sign In
                        </UiButton>
                      </UiLayout>
                    </UiLayout>
                  </form>
                </Show>
              </div>

              {/* Display alert message if error */}
              <Show when={!!error()}>
                <UiAlert variant='danger'>{error()}</UiAlert>
              </Show>
            </Show>
          </UiLayout>

          {/* Shell configuration metadata */}
          <ConfigTable shell={props.shell} showAuthor={false} />
        </div>
      </div>
    </Show>
  )
}
