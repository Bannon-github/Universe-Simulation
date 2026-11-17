// Compare the actual compiled Wasm with native Rust, using SI-unit tolerances.
// This checks implementations, not independent physical accuracy.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const wasmPath = 'rust-core/target/wasm32-unknown-unknown/release/sim_orbit_core.wasm';
const {instance} = await WebAssembly.instantiate(await readFile(wasmPath), {});
const {sim_create,sim_free,sim_step,sim_get,sim_equilibrium_temperature} = instance.exports;
const cases=[['circular',1,1,86400],['eccentric inner',0.6,0.75,86400],['faster outer',1.4,1.25,43200]];
const checkpoints=[0,1,17,365,1000];
// Native fixture columns x/y/vx/vy/energy/angular momentum/flux.
const fieldIds=[0,1,2,3,8,9,10], floors=[1e-2,1e-2,1e-8,1e-8,1e-3,1,1e-8];
const near=(actual,expected,floor,label)=>{
  assert.ok(Number.isFinite(actual)&&Number.isFinite(expected),`${label}: non-finite result`);
  const allowed=floor+1e-11*Math.max(Math.abs(actual),Math.abs(expected));
  assert.ok(Math.abs(actual-expected)<=allowed,`${label}: wasm ${actual}, native ${expected}, allowed ${allowed}`);
};
assert.equal(sim_create(0,1,86400),0);
assert.equal(sim_create(1,NaN,86400),0);
assert.equal(sim_step(0),1);
assert.ok(Number.isNaN(sim_get(0,0)));
for (const [name,distance,speed,dt] of cases) {
  const result=spawnSync('cargo',['run','--quiet','--locked','--manifest-path','rust-core/Cargo.toml',
    '--example','parity','--',String(distance),String(speed),String(dt)],{encoding:'utf8'});
  if(result.error) throw result.error;
  assert.equal(result.status,0,result.stderr);
  const lines=result.stdout.trim().split('\n');
  assert.equal(lines.length,checkpoints.length);
  const a=sim_create(distance,speed,dt), b=sim_create(distance,speed,dt);
  assert.ok(a && b && a!==b,`${name}: distinct live states`);
  try {
    assert.equal(sim_get(a,6),dt);
    assert.ok(Number.isNaN(sim_get(a,99)));
    for(let i=0;i<checkpoints.length;i++) {
      const target=checkpoints[i];
      while(sim_get(a,7)<target) {assert.equal(sim_step(a),0);assert.equal(sim_step(b),0);}
      const values=lines[i].split(',').map(Number);
      assert.equal(values.length,8);assert.equal(values[0],target);
      assert.equal(sim_get(b,7),target);
      for(let j=0;j<fieldIds.length;j++) {
        const value=sim_get(a,fieldIds[j]);
        near(value,values[j+1],floors[j],`${name} step ${target} field ${fieldIds[j]}`);
        assert.equal(value,sim_get(b,fieldIds[j]),`${name}: same-build replay`);
      }
    }
    near(sim_equilibrium_temperature(sim_get(a,10),0.3),
      (sim_get(a,10)*0.7/(4*5.670374419e-8))**0.25,1e-9,`${name}: temperature`);
  } finally {sim_free(a);sim_free(b);}
  console.log(`PASS ${name}: Wasm/native parity and deterministic replay`);
}
