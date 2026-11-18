// Rust/Wasm owns orbit state and physics. This module manages handles and data exchange.
export const G=6.67430e-11, SOLAR_MASS=1.98847e30, SOLAR_RADIUS=6.957e8;
export const SOLAR_TEMPERATURE=5772, SIGMA=5.670374419e-8, AU=1.495978707e11, DAY=86400;
// Display metadata uses the declared star inputs; all evolving diagnostics come from Rust.
export const LUMINOSITY=4*Math.PI*SOLAR_RADIUS**2*SIGMA*SOLAR_TEMPERATURE**4;
export const MODEL_VERSION='fixed-star-verlet-rust-wasm-0.1.0';
let wasm;
export async function initSimulation(bytes) {
  if (wasm) return;
  if (!bytes) {
    const response=await fetch(new URL('./sim_orbit_core.wasm',import.meta.url));
    if (!response.ok) throw new Error(`Could not load physics module (HTTP ${response.status})`);
    bytes=await response.arrayBuffer();
  }
  const {instance}=await WebAssembly.instantiate(bytes,{});
  const exports=instance.exports;
  for(const name of ['sim_create','sim_free','sim_step','sim_get','sim_equilibrium_temperature']) {
    if(typeof exports[name]!=='function') throw new Error(`Invalid physics module: missing ${name}`);
  }
  wasm=exports;
}
class OrbitRun {
  #handle;
  constructor(distanceAU,velocityFraction,stepSeconds) {
    if(!wasm) throw new Error('Physics module is not initialized');
    if(![distanceAU,velocityFraction,stepSeconds].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>0)) throw new RangeError('Starting conditions and timestep must be finite and positive');
    const handle=wasm.sim_create(distanceAU,velocityFraction,stepSeconds);
    if(!handle) throw new RangeError('Starting conditions and timestep must be finite and positive');
    this.#handle=handle;
    this.initial=Object.freeze({distanceAU,velocityFraction,stepSeconds});
    this.model=MODEL_VERSION;
  }
  get(field) {if(!this.#handle) throw new Error('Run has been disposed');return wasm.sim_get(this.#handle,field)}
  get x(){return this.get(0)} get y(){return this.get(1)}
  get vx(){return this.get(2)} get vy(){return this.get(3)}
  get initialEnergy(){return this.get(4)} get initialAngularMomentum(){return this.get(5)}
  get stepCount(){return this.get(7)}
  advance(){if(!this.#handle) throw new Error('Run has been disposed');if(this.stepCount>=Number.MAX_SAFE_INTEGER)throw new RangeError('Step count exceeds safe export range');if(wasm.sim_step(this.#handle)!==0)throw new RangeError('Non-finite or singular state; run halted');return this}
  dispose(){if(this.#handle){wasm.sim_free(this.#handle);this.#handle=0}}
}
export function createRun(distanceAU=1,velocityFraction=1,stepSeconds=DAY){return new OrbitRun(distanceAU,velocityFraction,stepSeconds)}
export const step=run=>run.advance();
export const distance=run=>Math.hypot(run.x,run.y);
export const specificEnergy=run=>run.get(8);
export const specificAngularMomentum=run=>run.get(9);
export const energyDrift=run=>(specificEnergy(run)-run.initialEnergy)/Math.abs(run.initialEnergy);
export const stellarFlux=run=>run.get(10);
export const equilibriumTemperature=(flux,albedo=0.30)=>wasm.sim_equilibrium_temperature(flux,albedo);
export function exportRun(run){
 return {schema:'sim.orbit-run.v2',model:MODEL_VERSION,method:'velocity Verlet; fixed star; no close-encounter handling',units:{position:'m',velocity:'m/s',time:'s',specific_energy:'J/kg',specific_angular_momentum:'m²/s'},constants:{G,SOLAR_MASS,SOLAR_RADIUS,SOLAR_TEMPERATURE,SIGMA,AU},initial:run.initial,step_count:run.stepCount,elapsed_seconds:run.stepCount*run.initial.stepSeconds,state:{x:run.x,y:run.y,vx:run.vx,vy:run.vy},diagnostics:{initial_specific_energy:run.initialEnergy,current_specific_energy:specificEnergy(run),relative_energy_drift:energyDrift(run),initial_specific_angular_momentum:run.initialAngularMomentum,current_specific_angular_momentum:specificAngularMomentum(run),stellar_flux_w_m2:stellarFlux(run)},random_seed:null,note:'Deterministic model; no random numbers. Rendering sizes and planet color are illustrative.'};
}
export function replayRun(record){
 if(!record || record.schema!=='sim.orbit-run.v2' || record.model!==MODEL_VERSION)throw new Error('Unsupported run format or model version');
 const expectedConstants={G,SOLAR_MASS,SOLAR_RADIUS,SOLAR_TEMPERATURE,SIGMA,AU};
 if(!record.constants||Object.entries(expectedConstants).some(([k,v])=>record.constants[k]!==v))throw new Error('Run constants do not match this model');
 const n=record.step_count, p=record.initial;
 if(!Number.isSafeInteger(n)||n<0||n>1000000 || !p || !record.state)throw new Error('Invalid run or replay exceeds 1,000,000 steps');
 const run=createRun(p.distanceAU,p.velocityFraction,p.stepSeconds);
 try {
  for(let i=0;i<n;i++) step(run);
  for(const [field,floor] of [['x',1e-2],['y',1e-2],['vx',1e-8],['vy',1e-8]]){
   const value=record.state[field], actual=run[field];
   if(!Number.isFinite(value)||Math.abs(actual-value)>floor+1e-11*Math.max(Math.abs(value),Math.abs(actual)))throw new Error(`Replay differs from saved ${field}`);
  }
  return run;
 }catch(err){run.dispose();throw err}
}
