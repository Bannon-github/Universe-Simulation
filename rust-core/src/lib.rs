//! A planar test particle orbiting a fixed star, in SI units.
//! This native reference is not yet connected to the JavaScript demo.
#[cfg(target_arch = "wasm32")]
mod wasm;

use std::f64::consts::PI;

pub const G: f64 = 6.674_30e-11;
pub const SOLAR_MASS_KG: f64 = 1.988_47e30;
pub const SOLAR_RADIUS_M: f64 = 6.957e8;
pub const SOLAR_TEMPERATURE_K: f64 = 5_772.0;
pub const SIGMA: f64 = 5.670_374_419e-8;
pub const AU_M: f64 = 1.495_978_707e11;
pub const DAY_S: f64 = 86_400.0;
pub const MU: f64 = G * SOLAR_MASS_KG;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct State {
    pub x_m: f64, pub y_m: f64, pub vx_m_s: f64, pub vy_m_s: f64,
    pub step_seconds: f64, pub step_count: u64,
    pub initial_specific_energy_j_kg: f64,
    pub initial_specific_angular_momentum_m2_s: f64,
}
#[derive(Debug, PartialEq)]
pub enum ModelError { InvalidInput, SingularOrNonFiniteState }

impl State {
    pub fn new(distance_au: f64, velocity_fraction: f64, step_seconds: f64) -> Result<Self, ModelError> {
        if ![distance_au, velocity_fraction, step_seconds].iter().all(|x| x.is_finite() && *x > 0.0) {
            return Err(ModelError::InvalidInput);
        }
        let radius = distance_au * AU_M;
        let mut state = Self { x_m: radius, y_m: 0.0, vx_m_s: 0.0,
            vy_m_s: (MU / radius).sqrt() * velocity_fraction, step_seconds, step_count: 0,
            initial_specific_energy_j_kg: 0.0, initial_specific_angular_momentum_m2_s: 0.0 };
        if !state.x_m.is_finite() || !state.vy_m_s.is_finite() { return Err(ModelError::InvalidInput); }
        state.initial_specific_energy_j_kg = state.specific_energy();
        state.initial_specific_angular_momentum_m2_s = state.specific_angular_momentum();
        Ok(state)
    }
    pub fn radius(&self) -> f64 { self.x_m.hypot(self.y_m) }
    pub fn specific_energy(&self) -> f64 { (self.vx_m_s.powi(2) + self.vy_m_s.powi(2)) / 2.0 - MU / self.radius() }
    pub fn specific_angular_momentum(&self) -> f64 { self.x_m * self.vy_m_s - self.y_m * self.vx_m_s }
    pub fn step(&mut self) -> Result<(), ModelError> {
        let (ax, ay) = acceleration(self.x_m, self.y_m)?;
        let dt = self.step_seconds;
        let x = self.x_m + self.vx_m_s * dt + 0.5 * ax * dt * dt;
        let y = self.y_m + self.vy_m_s * dt + 0.5 * ay * dt * dt;
        let (ax2, ay2) = acceleration(x, y)?;
        let vx = self.vx_m_s + 0.5 * (ax + ax2) * dt;
        let vy = self.vy_m_s + 0.5 * (ay + ay2) * dt;
        if ![x,y,vx,vy].iter().all(|x| x.is_finite()) { return Err(ModelError::SingularOrNonFiniteState); }
        let next_count = self.step_count.checked_add(1).ok_or(ModelError::SingularOrNonFiniteState)?;
        self.x_m=x; self.y_m=y; self.vx_m_s=vx; self.vy_m_s=vy; self.step_count=next_count;
        Ok(())
    }
}
fn acceleration(x: f64, y: f64) -> Result<(f64, f64), ModelError> {
    let r2 = x*x + y*y;
    if !r2.is_finite() || r2 <= 0.0 { return Err(ModelError::SingularOrNonFiniteState); }
    let factor = -MU / (r2 * r2.sqrt());
    Ok((factor*x, factor*y))
}
pub fn stellar_flux(radius_m: f64) -> f64 {
    let luminosity = 4.0 * PI * SOLAR_RADIUS_M.powi(2) * SIGMA * SOLAR_TEMPERATURE_K.powi(4);
    luminosity / (4.0 * PI * radius_m.powi(2))
}
pub fn equilibrium_temperature(flux_w_m2: f64, albedo: f64) -> f64 {
    (flux_w_m2 * (1.0 - albedo) / (4.0 * SIGMA)).powf(0.25)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn solar_fixture() {
        let flux=stellar_flux(AU_M); assert!((flux-1_361.0).abs()<3.0);
        assert!((equilibrium_temperature(flux,0.30)-255.0).abs()<1.0);
    }
    #[test] fn circular_orbit_returns_near_start() {
        let mut s=State::new(1.0,1.0,DAY_S).unwrap();
        let n=(2.0*PI*(AU_M.powi(3)/MU).sqrt()/DAY_S).round() as usize;
        for _ in 0..n { s.step().unwrap(); }
        assert!((s.x_m-AU_M).hypot(s.y_m)/AU_M < 0.01);
    }
    #[test] fn fixed_step_replay_and_angular_momentum() {
        let mut a=State::new(0.9,0.85,DAY_S).unwrap(); let mut b=a;
        for _ in 0..400 { a.step().unwrap(); b.step().unwrap(); }
        assert_eq!(a,b);
        assert!(((a.specific_angular_momentum()-a.initial_specific_angular_momentum_m2_s)/a.initial_specific_angular_momentum_m2_s).abs()<1e-12);
    }
    #[test] fn invalid_input_rejected() { assert_eq!(State::new(0.0,1.0,DAY_S),Err(ModelError::InvalidInput)); }
}
