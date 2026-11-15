# SIM — Cosmic Observatory

SIM is an open research project exploring the causal links between cosmic matter, stars, planets, chemistry and living systems. The governing design is [the cosmic-to-creature blueprint](docs/blueprint.md). This repository begins with one deliberately bounded experiment: a Sun-like fixed star and an orbiting test planet.

**Live demo:** https://sim-cosmic-observatory.daintyaria1.chatgpt.site  
**Status:** Initial orbit-and-light prototype; a foundation, not an end-to-end universe or life simulation.

## Try the experiment

Use the distance and velocity sliders to reset the initial state, then pause, step a simulated day, play, or export the run. The planet moves under Newtonian gravity via velocity Verlet at a fixed one-day timestep. Time and state depend on simulation steps, not display frames. The canvas is a schematic: sizes, color, cloud-like lines and the star's appearance are artistic choices; the planet's screen position follows its calculated state. The dashed ring marks initial distance, not a predicted orbit.

The inspector reports actual current distance, speed, model starlight and a simple equilibrium temperature (albedo 0.30, no atmosphere). Relative specific-energy drift is `(E - E₀) / |E₀|`. Specific angular momentum is shown in m²/s. The start state is supplied; no planet formation or prior material history is modeled. The Sun-like star is fixed and the planet has negligible mass; no collisions, atmospheric scattering, weather, chemistry, life or ecological processes are simulated. The fixed point-mass model has a singularity at its center; close encounters need a different model/integrator. UI ranges are intentionally bounded and not a claim of universal validity.

## Run and verify

The browser demo needs no package installation. Serve `dist/` with any static HTTP server (for example `python3 -m http.server 8080 --directory dist`) and open `http://localhost:8080`. JavaScript modules require HTTP rather than opening the file directly.

```sh
npm run check
npm test
cargo test --manifest-path rust-core/Cargo.toml --locked
```

The JS tests cover a solar flux/temperature fixture, a near-circular orbit, energy convergence as the timestep is reduced, conserved angular momentum, deterministic replay, and invalid inputs. The Rust crate has analogous native tests. GitHub Actions runs both suites on pushes, pull requests, manual dispatch and a daily schedule. Check the actual run status before claiming a test passed.

## Architecture and current handoff

- `dist/sim.js`: authoritative numerical implementation **for this browser prototype**, explicitly independent of rendering.
- `dist/app.js`, `dist/styles.css`, `dist/index.html`: browser controls, instrumentation and schematic canvas.
- `rust-core/`: independent Rust reference implementation. It is **not yet called by the browser**. Replace the duplicated JS physics with a Rust-to-Wasm core after parity tests and browser integration.
- `tests/orbit.test.js`: browser-model numerical tests, runnable with Node's built-in test runner.
- `docs/blueprint.md`: scientific vision and gated validation plan.
- `docs/STATUS.md` and `AGENTS.md`: continuation, verification, and collaboration instructions.

Run export saves initial conditions, constants, method, units, step count, current state, and diagnostics. Given the same implementation and floating-point environment, reconstruct by creating a run with the exported initial conditions and applying the recorded number of fixed steps. No random seed is needed for this deterministic experiment. Cross-platform bitwise equality has not been established; compare using documented tolerances.

References: [NASA solar irradiance](https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science), [The Rust Book](https://doc.rust-lang.org/stable/book/), [Cargo Book](https://doc.rust-lang.org/stable/cargo/), and [Rust release notes](https://doc.rust-lang.org/stable/releases.html). The project uses Rust 2024 edition (minimum Rust 1.85); consult the current stable Rust and Cargo documentation before changes. At this initial setup on 15 November 2026, the latest announced stable release was [Rust 1.100.0](https://blog.rust-lang.org/releases/latest/).

## License

The existing repository had an empty `LICENSE` file. No project license has been selected yet; do not treat the project as licensed for reuse until the owner chooses one.
