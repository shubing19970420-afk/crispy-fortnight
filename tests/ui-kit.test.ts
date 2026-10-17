import assert from 'node:assert/strict';
import {starsFromRecord,recordMedals} from '../src/ui-kit';
for(const value of [undefined,null,NaN,Infinity,0,-1,'2.5'])assert.equal(starsFromRecord(value),0);
assert.equal(starsFromRecord(undefined,true),1);
for(const [time,count] of [[1.75,3],[3,3],[3.01,2],[5,2],[5.01,1],[9,1]])assert.equal(starsFromRecord(time),count);
assert.equal((recordMedals(4.2).match(/medal-star earned/g)||[]).length,2);
assert.ok(recordMedals(4.2).includes('最佳 4.20 秒'));
assert.ok(recordMedals(undefined).includes('尚未通关'));
console.log('PASS read-only medal grading: real times, boundaries, invalid records, legacy progress, no fake unlocked medals');
