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
    <div class='login'>
      <Show
        when={step() === 'email'}
        fallback={
          <form
            onSubmit={e => {
              e.preventDefault()
              void submitCode()
            }}
          >
            <h1>swarmAg</h1>
            <p>Enter the code sent to {email()}</p>
            <label for='code'>Code</label>
            <input
              id='code'
              type='text'
              inputMode='numeric'
              autocomplete='one-time-code'
              value={code()}
              onInput={e => setCode(e.currentTarget.value)}
              required
            />
            <button type='submit' disabled={pending()}>Sign In</button>
            <button type='button' onClick={() => setStep('email')}>Back</button>
            <Show when={error()}>
              <p class='login-error'>{error()}</p>
            </Show>
          </form>
        }
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            void submitEmail()
          }}
        >
          <h1>swarmAg</h1>
          <label for='email'>Email</label>
          <input
            id='email'
            type='email'
            autocomplete='email'
            value={email()}
            onInput={e => setEmail(e.currentTarget.value)}
            required
          />
          <button type='submit' disabled={pending()}>Send Code</button>
          <Show when={error()}>
            <p class='login-error'>{error()}</p>
          </Show>
        </form>
      </Show>
    </div>
  )
}
