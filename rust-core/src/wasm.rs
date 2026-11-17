//! Minimal Wasm-only ABI. Handles must be obtained from `sim_create`, used only
//! while live, and freed exactly once. All physical values use SI units.
use crate::{State, stellar_flux, equilibrium_temperature};

#[unsafe(no_mangle)]
pub extern "C" fn sim_create(distance_au: f64, velocity_fraction: f64, step_seconds: f64) -> *mut State {
    match State::new(distance_au, velocity_fraction, step_seconds) {
        Ok(state) => Box::into_raw(Box::new(state)),
        Err(_) => std::ptr::null_mut(),
    }
}

/// # Safety
/// `state` must be null or a live handle returned by `sim_create` and not freed before.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn sim_free(state: *mut State) {
    if !state.is_null() { drop(unsafe { Box::from_raw(state) }); }
}

/// # Safety
/// `state` must be null or a live handle returned by `sim_create`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn sim_step(state: *mut State) -> i32 {
    let Some(state) = (unsafe { state.as_mut() }) else { return 1; };
    match state.step() { Ok(()) => 0, Err(_) => 1 }
}

/// # Safety
/// `state` must be null or a live handle returned by `sim_create`.
/// Fields: 0..3 x/y/vx/vy; 4 initial energy; 5 initial angular momentum;
/// 6 step seconds; 7 step count; 8 current energy; 9 current angular momentum;
/// 10 stellar flux. Invalid fields and null handles return NaN.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn sim_get(state: *const State, field: u32) -> f64 {
    let Some(state) = (unsafe { state.as_ref() }) else { return f64::NAN; };
    match field {
        0 => state.x_m, 1 => state.y_m, 2 => state.vx_m_s, 3 => state.vy_m_s,
        4 => state.initial_specific_energy_j_kg,
        5 => state.initial_specific_angular_momentum_m2_s,
        6 => state.step_seconds, 7 => state.step_count as f64,
        8 => state.specific_energy(), 9 => state.specific_angular_momentum(),
        10 => stellar_flux(state.radius()), _ => f64::NAN,
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn sim_equilibrium_temperature(flux_w_m2: f64, albedo: f64) -> f64 {
    equilibrium_temperature(flux_w_m2, albedo)
}
