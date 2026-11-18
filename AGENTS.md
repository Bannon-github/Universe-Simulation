# Agent instructions for SIM

## Project objective
Develop the cosmic-to-creature simulation against `docs/blueprint.md`. Deliver small, testable milestones; do not imply the entire program or downstream physical processes are implemented. The immediate milestone is a trustworthy orbit-and-light experiment and a reproducible scientific foundation.

## Resume procedure
1. Read `docs/STATUS.md`, `README.md`, and the blueprint's gate 0 and gate 1 before changing code. Inspect the current Git branch, remote head, open work and CI status; the status document is a handoff, not evidence that the current state is unchanged.
2. Choose one bounded task with acceptance criteria, declare scope and tests in a work record or issue, and avoid claiming work already in progress. Never assume an unacknowledged agent has started. Prefer an isolated branch/worktree per contributor.
3. Work from the latest public `master` and do not overwrite another contributor's work. If the branch moved, fetch and reconcile; report conflicts rather than force-pushing. Keep commits focused and record test results and remaining risks.
4. Run `npm run check`, `npm test`, and `cargo test --manifest-path rust-core/Cargo.toml --locked` as relevant; inspect GitHub Actions and report missing checks honestly. Add a meaningful test for each new scientific behavior and use independent references where practical.
5. Update `docs/STATUS.md` after material progress with tested behavior, exact next step, blockers and reproduction commands. Preserve seeds/initial conditions, units, reference citations and numerical tolerances. Do not encode fabricated history or visuals as physical state.
6. If a test or process fails, reproduce the failure, contain it, and leave an actionable handoff with failing command and last known good revision. If progress stalls, select an unblocked task or report the specific blocker; do not silently mark the milestone complete. Re-check open branches/leases before retrying.

## Scientific boundaries
The interactive experiment runs the Rust core compiled to WebAssembly; the legacy JavaScript model is retained only as a test reference. The planet's colors, cloud-like marks and sizes are illustrative. The star is fixed and the particle is massless. Avoid representing color, climate, formation, chemistry or life as outcomes of this model. Use SI internally and state units at boundaries. Never use camera or frame rate to advance simulated physics. See `docs/blueprint.md` for conservation and provenance contracts.

## Priority queue
1. Maintain and verify the Rust/Wasm browser path and its parity, reproducible build, replay, browser and deployment checks. Inspect current CI before claiming success.
2. Add explicit checkpoint, event log, replay and versioned manifest with deterministic same-build checks and numeric cross-platform tolerances.
3. Improve gravity model, energy and angular-momentum convergence, domain validation and close-encounter handling; compare with a named independent reference.
4. Only then expand into camera/atmosphere and later gates with measured acceptance cases and known limitations.

## Deployment and automation
The public GitHub repository is the collaboration source. The deployed site uses a separate Sites source repository; synchronize tested source deliberately and record the deployed revision. A repository commit alone does not update the site. Scheduled CI checks run daily but do not repair code or guarantee an agent is working; inspect results. Any separate continuation automation must verify current state and avoid conflicts before editing. Do not place credentials or customer information in public commits. Respect the existing repository's license status.
