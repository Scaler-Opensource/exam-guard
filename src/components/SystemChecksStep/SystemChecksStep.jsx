import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { evaluateParentStepStatus } from '@/utils/evaluateParentStepStatus';
import { selectProctor } from '@/store/features/assessmentInfoSlice';
import { selectStep, nextStep, setStepAcknowledged } from '@/store/features/workflowSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxhooks';
import StepHeader from '@/ui/StepHeader';
import SystemCheckCard from '@/ui/SystemCheckCard';

const SystemChecksStep = () => {
  const dispatch = useAppDispatch();
  const proctor = useAppSelector((state) => selectProctor(state));
  const { acknowledged, subSteps } = useAppSelector((state) => (
    selectStep(state, 'compatibilityChecks')
  ));
  const { enableProctoring } = useAppSelector((state) => state.workflow);

  useEffect(() => {
    if (proctor) {
      proctor?.handleCompatibilityChecks();
    }
  }, [proctor]);

  const handleCheckboxChange = () => {
    dispatch(
      setStepAcknowledged({
        step: 'compatibilityChecks',
        acknowledged: !acknowledged,
      }),
    );
  };

  const handleClick = () => {
    if (enableProctoring) {
      proctor?.handleCompatibilityChecks({ forceRun: true });
    } else {
      dispatch(nextStep());
    }
  };

  const areAllSubstepsCompleted = Object.values(subSteps)?.every(
    (substep) => substep.status === 'completed',
  );

  const status = evaluateParentStepStatus(Object.values(subSteps));

  const canProceed = enableProctoring || (acknowledged && areAllSubstepsCompleted);

  return (
    <>
      <StepHeader
        stepNumber='4'
        title='System Compatibility Checks'
        status={status}
      />
      <div className='mt-16'>
        <SystemCheckCard />
        {!enableProctoring && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canProceed) {
                handleClick();
              }
            }}
          >
            <div className='flex items-start mt-16 text-xs'>
              <Checkbox
                id='confirm'
                className='mt-1 mr-4 h-6 w-6'
                checked={acknowledged}
                onCheckedChange={handleCheckboxChange}
                disabled={!areAllSubstepsCompleted}
                role="checkbox"
                required={areAllSubstepsCompleted}
              />
              <label htmlFor='confirm' className='text-sm text-base-200 cursor-pointer'>
                By clicking, you confirm that all your compatibility checks
                remains same. Failure to maintain proper setup may result in
                interruption.
              </label>
            </div>
            <Button
              type="submit"
              className='mt-8 items-center'
              variant='primary'
              size='lg'
              disabled={!areAllSubstepsCompleted}
            >
              {enableProctoring ? 'Confirm Settings' : (
                <>
                  Proceed to next step
                  <ArrowRight className='w-6 h-6' />
                </>
              )}
            </Button>
          </form>
        )}
        {enableProctoring && (
          <Button
            className='mt-8 items-center'
            variant='primary'
            onClick={handleClick}
            size='lg'
          >
            Confirm Settings
          </Button>
        )}
      </div>
    </>
  );
};

export default SystemChecksStep;
