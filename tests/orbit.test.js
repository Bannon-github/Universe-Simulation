import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,step,distance,specificEnergy,specificAngularMomentum,stellarFlux,equilibriumTemperature,energyDrift,exportRun,AU,DAY,MU} from './support/legacy-sim.js';

test('solar fixture yields approximately 1361 W/m² and 255 K',()=>{
  const flux=stellarFlux(AU);
  assert.ok(Math.abs(flux-1361)<3, `flux ${flux}`);
  assert.ok(Math.abs(equilibriumTemperature(flux)-255)<1);
});
test('a near-circular orbit returns close to its starting position after one year',()=>{
  const s=createRun(); const period=2*Math.PI*Math.sqrt(AU**3/MU); const n=Math.round(period/DAY);
  for(let i=0;i<n;i++) step(s);
  assert.ok(Math.hypot(s.x-AU,s.y)/AU<0.01);
  assert.ok(Math.abs(distance(s)/AU-1)<0.001);
});
test('smaller time steps reduce maximum energy error in an eccentric orbit',()=>{
  const maxError=(dt)=>{const s=createRun(1,0.8,dt*DAY);let max=0;for(let i=0;i<Math.round(700/dt);i++){step(s);max=Math.max(max,Math.abs(energyDrift(s)))}return max};
  const coarse=maxError(4), fine=maxError(2);
  assert.ok(coarse>0 && fine < coarse*0.3, `${coarse} -> ${fine}`);
});
test('angular momentum is conserved and fixed-step replay is deterministic',()=>{
  const a=createRun(0.9,0.85), b=createRun(0.9,0.85);const l=specificAngularMomentum(a);
  for(let i=0;i<400;i++){step(a);step(b)}
  assert.deepEqual(a,b); assert.ok(Math.abs((specificAngularMomentum(a)-l)/l)<1e-12);
  assert.equal(exportRun(a).step_count,400); assert.ok(Number.isFinite(specificEnergy(a)));
});
test('reject invalid parameters before mutating the state',()=>{
  assert.throws(()=>createRun(0,1));assert.throws(()=>createRun(1,NaN));assert.throws(()=>createRun(1,1,-1));
});
