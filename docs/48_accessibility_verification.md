# Accessibility verification — HRD-002

TASK-HRD-002 requires the prototype's primary UI paths to address NFR-019 and NFR-035: RTL/English readiness, keyboard operation, visible focus, labels, focus management, accessible validation, screen-reader semantics, semantic tables, contrast awareness, and no color-only dependency.

## Implemented prototype checks
- The document root retains Arabic language and RTL direction.
- A keyboard-visible skip link targets the semantic main content region.
- The application main region is focusable for skip-link navigation.
- The primary toolbar exposes navigation semantics.
- MUI button/link focus-visible styling is explicit rather than suppressed.
- Login feedback uses live-region semantics and moves focus to the result message after authentication success/failure.
- Existing user/role tables have accessible names.
- Existing form controls retain visible/accessible labels.
- A static regression check rejects known focus-suppression patterns and checks the required markup/contracts.

## Automated verification
Run:

```bash
pnpm --filter @ihepsrs/web accessibility:check
```

The CI workflow also runs this command.

## Manual verification still required for release
The automated/static check is prototype evidence, not a formal WCAG certification. Before a production release, execute keyboard-only navigation, browser/OS screen-reader checks, zoom/reflow, and measured color-contrast testing on the final rendered interface. Any new screen added after this task must preserve these accessibility contracts.
