// Compare independently implemented native Rust and browser JS, in SI units.
// This is an implementation parity check, not independent physical validation.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRun, step, specificEnergy, specificAngularMomentum, stellarFlux, distance, DAY} from '../tests/support/legacy-sim.js';

const cases = [
  {name:'circular', distance:1, speed:1, dt:DAY},
  {name:'eccentric inner', distance:0.6, speed:0.75, dt:DAY},
  {name:'faster outer', distance:1.4, speed:1.25, dt:DAY/2},
];
const checkpoints = [0, 1, 17, 365, 1000];
// Scale tolerances account for accumulated rounding and different hypot implementations;
// absolute floors handle values near zero. No bitwise cross-platform promise is made.
const fields = [
  ['x', 1e-2], ['y', 1e-2], ['vx', 1e-8], ['vy', 1e-8],
  ['energy', 1e-3], ['angular momentum', 1], ['flux', 1e-8],
];
const relativeTolerance = 1e-11;
for (const scenario of cases) {
  const args = ['run','--quiet','--locked','--manifest-path','rust-core/Cargo.toml',
    '--example','parity','--',String(scenario.distance),String(scenario.speed),String(scenario.dt)];
  const result = spawnSync('cargo', args, {encoding:'utf8'});
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `Rust fixture failed: ${result.stderr}`);
  const lines = result.stdout.trim().split('\n');
  assert.equal(lines.length, checkpoints.length, `${scenario.name}: checkpoint count`);
  const state = createRun(scenario.distance, scenario.speed, scenario.dt);
  for (let i=0; i<checkpoints.length; i++) {
    const target=checkpoints[i];
    while (state.stepCount < target) step(state);
    const values=lines[i].split(',').map(Number);
    assert.equal(values.length, fields.length+1, `${scenario.name}: field count`);
    assert.ok(values.every(Number.isFinite), `${scenario.name}: non-finite Rust result`);
    assert.equal(values[0],target,`${scenario.name}: checkpoint`);
    const actual=[state.x,state.y,state.vx,state.vy,specificEnergy(state),
      specificAngularMomentum(state),stellarFlux(distance(state))];
    for (let j=0; j<fields.length; j++) {
      const [name, floor]=fields[j], reference=values[j+1], value=actual[j];
      assert.ok(Number.isFinite(value), `${scenario.name} step ${target} ${name}: non-finite JS result`);
      const allowed=floor+relativeTolerance*Math.max(Math.abs(reference),Math.abs(value));
      assert.ok(Math.abs(value-reference)<=allowed,
        `${scenario.name} step ${target} ${name}: JS ${value}, Rust ${reference}, allowed ${allowed}`);
    }
  }
  console.log(`PASS ${scenario.name}: ${checkpoints.length} checkpoints`);
}
