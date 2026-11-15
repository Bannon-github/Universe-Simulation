# Handoff — 15 November 2026

## Goal
Ship a tested, reproducible foundation for a cosmic-to-creature simulation, starting with a measurable orbit-and-light demo. The blueprint defines later gates and their acceptance evidence.

## Implemented in this baseline
- Static browser observatory with distance and velocity controls, play/pause, single-day step, reset, speed, inspection and JSON export.
- A two-dimensional fixed-star, massless-planet Newtonian model with velocity Verlet, solar luminosity approximation, flux and albedo-based equilibrium temperature. Rendering is schematic; the planet's color is supplied, and there is no atmosphere, formation or life model.
- A separate Rust 2024 reference implementation and native tests. **It is not wired to the site.**
- Automated Node and Rust CI plus a daily scheduled CI run; CI checks do not autonomously implement fixes.

## Verification at initial development
- `npm run check`: passed.
- `npm test`: 5 meaningful numerical cases passed, including solar irradiance/temperature, a circular orbit, timestep convergence, angular momentum, reproducibility and input validation.
- Browser preview: pause, step, distance control and the object inspector were exercised on the rendered page.
- Rust compiler was not installed in the initial local environment. Rust tests were authored but their status must be verified on an actual Rust toolchain / GitHub Actions; do not report them as passed until evidence exists.
- Energy is approximate and the current UI's one-day timestep has not yet been validated across the full slider range or close encounters.

## Next bounded task
Run native Rust tests, compare Rust/JS fixtures over multiple trajectories, and integrate the tested Rust core into the browser via WebAssembly. Preserve deterministic stepping and add a CI parity test. Document the chosen build chain, version, artifacts and any precision differences. Keep visual styling and physical state separate.

## Continuity and conflict handling
Before starting, inspect current remote heads, CI runs and in-flight work. Claim a small task and use an isolated branch. If another change lands, reconcile against the new head without force-pushing. If a check fails or a machine cannot run it, retain the failing command and output, make a small reproducible test case, and update this file before stopping. If no progress occurs in a scheduled check, identify one concrete blocker or pick the next independent task. Daily CI is a signal, not a worker.

## Deployment
The public GitHub repository and Sites deployment have separate source remotes. Changes merged on GitHub must also be synchronized and published through the Sites workflow; verify the deployed version and public access. Never assume a successful GitHub push deployed the website.
