/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ AppFooter                                                                    ║
║ Application shell footer — branding and mobile safe-area anchor.            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Shell footer that renders a caller-supplied logo centered with the mono filter
applied. Accounts for mobile browser chrome via safe-area-inset. Logo asset
stays in the app layer — the shell remains domain-free.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppFooter  Shell footer component.
*/

/** AppFooter props. */
type AppFooterProps = {
  /** Logo image URL. Caller supplies — keeps shell domain-free. */
  logo: string
  /** Accessible alt text for the logo image. */
  alt?: string
}

/** Application shell footer. */
export const AppFooter = (props: AppFooterProps) => (
  <footer data-ui='footer'>
    <img data-ui='footer-logo' src={props.logo} alt={props.alt ?? ''} />
  </footer>
)
