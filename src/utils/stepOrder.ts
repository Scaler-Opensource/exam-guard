import { WorkflowStepKey } from '@/types/workflowTypes';

// The wizard's order. Identity comes right after the desktop camera, whose stream is already live.
// The rail, the panel headings and nextStep all number and walk steps from this one list.
export const STEP_ORDER: WorkflowStepKey[] = [
  'cameraShare',
  'identityVerification',
  'screenShare',
  'mobileCameraShare',
  'compatibilityChecks',
];

type EnabledSteps = Partial<Record<WorkflowStepKey, { enabled: boolean }>>;

export const enabledStepKeys = (steps: EnabledSteps): WorkflowStepKey[] => (
  STEP_ORDER.filter((key) => steps[key]?.enabled)
);

// 1-based position among the enabled steps, so "STEP N" matches the rail.
export const stepNumberOf = (key: WorkflowStepKey, steps: EnabledSteps): number => (
  enabledStepKeys(steps).indexOf(key) + 1
);
