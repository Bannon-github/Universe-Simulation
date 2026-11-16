//! Emit native Rust checkpoints for comparison with the browser implementation.
//! Arguments: initial distance in AU, circular-speed fraction, timestep in seconds.
use sim_orbit_core::{State, stellar_flux};

fn main() {
    let args: Vec<f64> = std::env::args().skip(1)
        .map(|s| s.parse().expect("expected numeric argument"))
        .collect();
    assert_eq!(args.len(), 3, "expected distance, velocity fraction, timestep");
    let mut state = State::new(args[0], args[1], args[2]).expect("invalid initial conditions");
    for target in [0, 1, 17, 365, 1000] {
        while state.step_count < target { state.step().expect("integration failed"); }
        println!("{},{:.17e},{:.17e},{:.17e},{:.17e},{:.17e},{:.17e},{:.17e}",
            state.step_count, state.x_m, state.y_m, state.vx_m_s, state.vy_m_s,
            state.specific_energy(), state.specific_angular_momentum(), stellar_flux(state.radius()));
    }
}
