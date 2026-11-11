import { useAppSelector } from '@/hooks/reduxhooks';
import { shownSteps, stepNumberOf } from '@/utils/stepOrder';
import { WorkflowStepKey } from '@/types/workflowTypes';

export const useStepNumber = (key: WorkflowStepKey): string => {
  const { steps, identityResolved, activeStep } = useAppSelector((state) => state.workflow);
  return String(stepNumberOf(key, shownSteps(steps, identityResolved, activeStep)));
};
