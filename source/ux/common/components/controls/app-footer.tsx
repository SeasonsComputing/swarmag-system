/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ AppFooter                                                                    ║
║ Footer control with branding and mobile safe-area support.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Footer primitive that renders a caller-supplied logo centered with the mono
filter applied. Accounts for mobile browser chrome via safe-area-inset. Logo
asset stays in the app layer — the control remains domain-free.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppFooter  Footer control component.
*/

/** AppFooter props. */
export type AppFooterProps = {
  /** Logo image URL. Caller supplies — keeps the control domain-free. */
  logo: string
  /** Accessible alt text for the logo image. */
  alt?: string
}

/** Footer control with centered logo. */
export const AppFooter = (props: AppFooterProps) => (
  <footer data-ui='footer'>
    <img data-ui='footer-logo' src={props.logo} alt={props.alt ?? ''} />
  </footer>
)
