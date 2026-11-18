import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initSimulation,createRun,step,stellarFlux,equilibriumTemperature,exportRun,replayRun} from '../dist/sim.js';
await initSimulation(await readFile(new URL('../dist/sim_orbit_core.wasm',import.meta.url)));
test('Wasm state, solar flux, deterministic export and replay',()=>{
 const a=createRun(0.9,0.85);for(let i=0;i<400;i++)step(a);
 const saved=JSON.parse(JSON.stringify(exportRun(a)));const b=replayRun(saved);
 assert.deepEqual(exportRun(b),saved);assert.equal(a.stepCount,400);assert.notEqual(a.x,0);
 const earth=createRun();assert.ok(Math.abs(stellarFlux(earth)-1361)<3);assert.ok(Math.abs(equilibriumTemperature(stellarFlux(earth))-255)<1);
 a.dispose();a.dispose();assert.throws(()=>step(a),/disposed/);assert.equal(b.stepCount,400);b.dispose();earth.dispose();
});
test('reject invalid conditions, unsupported and altered replay records',()=>{
 assert.throws(()=>createRun(0,1));assert.throws(()=>createRun(1,NaN));assert.throws(()=>createRun('1',1));
 const r=createRun();step(r);const saved=exportRun(r);r.dispose();
 assert.throws(()=>replayRun({...saved,schema:'sim.orbit-run.v1'}),/Unsupported/);
 assert.throws(()=>replayRun({...saved,step_count:1000001}),/1,000,000/);
 assert.throws(()=>replayRun({...saved,constants:{...saved.constants,G:1}}),/constants/);
 assert.throws(()=>replayRun({...saved,state:{...saved.state,x:saved.state.x+1000}}),/differs/);
});
