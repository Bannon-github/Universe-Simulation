// SIM experiment 01: dimensioned, planar, fixed-star test-particle model.
// The browser version is a demonstrator; rust-core is a separate native reference,
// and a shared Rust/Wasm implementation is a documented next milestone.
export const G = 6.67430e-11; // m^3 kg^-1 s^-2
export const SOLAR_MASS = 1.98847e30; // kg, input approximation
export const SOLAR_RADIUS = 6.957e8; // m
export const SOLAR_TEMPERATURE = 5772; // K
export const SIGMA = 5.670374419e-8; // W m^-2 K^-4
export const AU = 1.495978707e11; // m, exact
export const DAY = 86400; // s
export const MU = G * SOLAR_MASS;
export const LUMINOSITY = 4 * Math.PI * SOLAR_RADIUS ** 2 * SIGMA * SOLAR_TEMPERATURE ** 4;
export const MODEL_VERSION = 'fixed-star-verlet-js-0.1.0';

export function createRun(distanceAU = 1, velocityFraction = 1, stepSeconds = DAY) {
  if (!Number.isFinite(distanceAU) || distanceAU <= 0 || !Number.isFinite(velocityFraction) || velocityFraction <= 0 || !Number.isFinite(stepSeconds) || stepSeconds <= 0) throw new RangeError('Starting conditions and timestep must be finite and positive');
  const radius = distanceAU * AU;
  const run = {model: MODEL_VERSION, initial: {distanceAU, velocityFraction, stepSeconds}, stepCount: 0, x: radius, y: 0, vx: 0, vy: Math.sqrt(MU / radius) * velocityFraction};
  run.initialEnergy = specificEnergy(run);
  run.initialAngularMomentum = specificAngularMomentum(run);
  return run;
}
function acceleration(x, y) {
  const r2 = x*x + y*y;
  if (!Number.isFinite(r2) || r2 <= 0) throw new RangeError('The fixed-star point-mass model is singular at the origin');
  const factor = -MU / (r2 * Math.sqrt(r2));
  return [factor*x, factor*y];
}
export function step(run) {
  const dt = run.initial.stepSeconds;
  const [ax, ay] = acceleration(run.x, run.y);
  const nx = run.x + run.vx*dt + 0.5*ax*dt*dt;
  const ny = run.y + run.vy*dt + 0.5*ay*dt*dt;
  const [nax, nay] = acceleration(nx, ny);
  const nvx = run.vx + 0.5*(ax+nax)*dt;
  const nvy = run.vy + 0.5*(ay+nay)*dt;
  if (![nx,ny,nvx,nvy].every(Number.isFinite)) throw new RangeError('Non-finite state; run halted');
  run.x=nx; run.y=ny; run.vx=nvx; run.vy=nvy; run.stepCount++;
  return run;
}
export const distance = run => Math.hypot(run.x, run.y);
export const specificEnergy = run => (run.vx**2 + run.vy**2)/2 - MU/distance(run);
export const specificAngularMomentum = run => run.x*run.vy - run.y*run.vx;
export const energyDrift = run => (specificEnergy(run) - run.initialEnergy)/Math.abs(run.initialEnergy);
export const stellarFlux = radius => LUMINOSITY / (4*Math.PI*radius*radius);
export const equilibriumTemperature = (flux, albedo = 0.30) => (flux*(1-albedo)/(4*SIGMA))**0.25;
export function exportRun(run) {
  return {schema:'sim.orbit-run.v1', model:MODEL_VERSION, method:'velocity Verlet; fixed star; no close-encounter handling', units:{position:'m',velocity:'m/s',time:'s',specific_energy:'J/kg',specific_angular_momentum:'m²/s'}, constants:{G,SOLAR_MASS,SOLAR_RADIUS,SOLAR_TEMPERATURE,SIGMA,AU}, initial:run.initial, step_count:run.stepCount, elapsed_seconds:run.stepCount*run.initial.stepSeconds, state:{x:run.x,y:run.y,vx:run.vx,vy:run.vy}, diagnostics:{initial_specific_energy:run.initialEnergy,current_specific_energy:specificEnergy(run),relative_energy_drift:energyDrift(run),initial_specific_angular_momentum:run.initialAngularMomentum,current_specific_angular_momentum:specificAngularMomentum(run),stellar_flux_w_m2:stellarFlux(distance(run))}, random_seed:null, note:'Deterministic model; no random numbers. Rendering sizes and planet color are illustrative.'};
}
