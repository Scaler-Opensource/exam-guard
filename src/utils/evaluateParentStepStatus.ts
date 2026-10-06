import { SubStepState, Status } from '@/types/workflowTypes';

export function evaluateParentStepStatus(substeps: SubStepState[] | undefined): Status {
  if (!substeps?.length) return 'pending';

  const hasError = substeps.some((substep) => substep.status === 'error');
  if (hasError) return 'error';

  const allCompleted = substeps.every((substep) => substep.status === 'completed');
  if (allCompleted) return 'completed';

  return 'pending';
}
