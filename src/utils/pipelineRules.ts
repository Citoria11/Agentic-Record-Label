import { PipelineStage, ProjectSong, AgentId } from '../types';

export const PIPELINE_STAGES_ORDER: PipelineStage[] = [
  '1_IDEATION',
  '2_CEO_CONCEPT_GATE',
  '3_PRODUCTION_AND_LYRICS',
  '4_CEO_MASTER_GATE',
  '5_TUNECORE_AND_MARKETING',
  '6_CEO_RELEASE_GATE',
  'RELEASED'
];

export function isCeoGate(stage: PipelineStage): boolean {
  return (
    stage === '2_CEO_CONCEPT_GATE' ||
    stage === '4_CEO_MASTER_GATE' ||
    stage === '6_CEO_RELEASE_GATE'
  );
}

export function getNextStage(current: PipelineStage): PipelineStage | null {
  const idx = PIPELINE_STAGES_ORDER.indexOf(current);
  if (idx < 0 || idx >= PIPELINE_STAGES_ORDER.length - 1) {
    return null;
  }
  return PIPELINE_STAGES_ORDER[idx + 1];
}

export function getPreviousWorkStage(gate: PipelineStage): PipelineStage {
  switch (gate) {
    case '2_CEO_CONCEPT_GATE':
      return '1_IDEATION';
    case '4_CEO_MASTER_GATE':
      return '3_PRODUCTION_AND_LYRICS';
    case '6_CEO_RELEASE_GATE':
      return '5_TUNECORE_AND_MARKETING';
    default:
      return '1_IDEATION';
  }
}

export function getStageResponsibleAgent(stage: PipelineStage): AgentId | null {
  switch (stage) {
    case '1_IDEATION':
      return 'miles';
    case '3_PRODUCTION_AND_LYRICS':
      return 'nova'; // and lyra
    case '5_TUNECORE_AND_MARKETING':
      return 'vance';
    default:
      return null;
  }
}

export function isProjectBlockedByCeo(project: ProjectSong): boolean {
  return isCeoGate(project.stage);
}

export function advanceProject(project: ProjectSong, ceoNotes?: string): ProjectSong {
  const next = getNextStage(project.stage);
  if (!next) return project;

  return {
    ...project,
    stage: next,
    ceoFeedback: ceoNotes || project.ceoFeedback,
    blockedByGate: isCeoGate(next) ? next : undefined,
    updatedAt: new Date().toISOString()
  };
}

export function rejectProjectGate(project: ProjectSong, feedback: string): ProjectSong {
  const fallbackStage = getPreviousWorkStage(project.stage);
  return {
    ...project,
    stage: fallbackStage,
    ceoFeedback: feedback,
    blockedByGate: undefined,
    updatedAt: new Date().toISOString()
  };
}
