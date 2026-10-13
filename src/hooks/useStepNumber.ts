import { useAppSelector } from '@/hooks/reduxhooks';
import { stepNumberOf } from '@/utils/stepOrder';
import { WorkflowStepKey } from '@/types/workflowTypes';

export const useStepNumber = (key: WorkflowStepKey): string => {
  const steps = useAppSelector((state) => state.workflow.steps);
  return String(stepNumberOf(key, steps));
};
