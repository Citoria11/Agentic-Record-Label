import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  isCeoGate, 
  getNextStage, 
  advanceProject, 
  rejectProjectGate, 
  getPreviousWorkStage 
} from './pipelineRules';
import { ProjectSong } from '../types';

test('isCeoGate identifies the 3 CEO decision gates', () => {
  assert.equal(isCeoGate('1_IDEATION'), false);
  assert.equal(isCeoGate('2_CEO_CONCEPT_GATE'), true);
  assert.equal(isCeoGate('3_PRODUCTION_AND_LYRICS'), false);
  assert.equal(isCeoGate('4_CEO_MASTER_GATE'), true);
  assert.equal(isCeoGate('5_TUNECORE_AND_MARKETING'), false);
  assert.equal(isCeoGate('6_CEO_RELEASE_GATE'), true);
  assert.equal(isCeoGate('RELEASED'), false);
});

test('getNextStage advances through pipeline sequence', () => {
  assert.equal(getNextStage('1_IDEATION'), '2_CEO_CONCEPT_GATE');
  assert.equal(getNextStage('2_CEO_CONCEPT_GATE'), '3_PRODUCTION_AND_LYRICS');
  assert.equal(getNextStage('3_PRODUCTION_AND_LYRICS'), '4_CEO_MASTER_GATE');
  assert.equal(getNextStage('4_CEO_MASTER_GATE'), '5_TUNECORE_AND_MARKETING');
  assert.equal(getNextStage('5_TUNECORE_AND_MARKETING'), '6_CEO_RELEASE_GATE');
  assert.equal(getNextStage('6_CEO_RELEASE_GATE'), 'RELEASED');
  assert.equal(getNextStage('RELEASED'), null);
});

test('advanceProject moves to next stage and flags CEO gate blocker', () => {
  const initial: ProjectSong = {
    id: 'song-1',
    title: 'Neon Drift',
    artistName: 'Kira',
    genre: 'Synthwave',
    stage: '1_IDEATION',
    targetBpm: 120,
    musicalKey: 'F#m',
    conceptNotes: 'Cyberpunk night drive',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const advanced = advanceProject(initial);
  assert.equal(advanced.stage, '2_CEO_CONCEPT_GATE');
  assert.equal(advanced.blockedByGate, '2_CEO_CONCEPT_GATE');

  const afterGateApproved = advanceProject(advanced, 'Great concept approved');
  assert.equal(afterGateApproved.stage, '3_PRODUCTION_AND_LYRICS');
  assert.equal(afterGateApproved.blockedByGate, undefined);
  assert.equal(afterGateApproved.ceoFeedback, 'Great concept approved');
});

test('rejectProjectGate sends project back to previous work stage', () => {
  assert.equal(getPreviousWorkStage('2_CEO_CONCEPT_GATE'), '1_IDEATION');
  assert.equal(getPreviousWorkStage('4_CEO_MASTER_GATE'), '3_PRODUCTION_AND_LYRICS');
  assert.equal(getPreviousWorkStage('6_CEO_RELEASE_GATE'), '5_TUNECORE_AND_MARKETING');

  const inGate: ProjectSong = {
    id: 'song-2',
    title: 'Electric Shadows',
    artistName: 'Synth Lab',
    genre: 'Cyberpunk',
    stage: '4_CEO_MASTER_GATE',
    targetBpm: 128,
    musicalKey: 'Am',
    conceptNotes: 'Needs tighter mix',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blockedByGate: '4_CEO_MASTER_GATE'
  };

  const revised = rejectProjectGate(inGate, 'Bassline too muddy. Re-do chords.');
  assert.equal(revised.stage, '3_PRODUCTION_AND_LYRICS');
  assert.equal(revised.blockedByGate, undefined);
  assert.equal(revised.ceoFeedback, 'Bassline too muddy. Re-do chords.');
});
