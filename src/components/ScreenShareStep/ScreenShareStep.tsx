import React, { useMemo, useState } from 'react';
import { ArrowRight, Lightbulb } from 'lucide-react';

import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { evaluateParentStepStatus } from '@/utils/evaluateParentStepStatus';
import { nextStep, setStepAcknowledged } from '@/store/features/workflowSlice';
import { SubStepState } from '@/types/workflowTypes';
import { selectProctor } from '@/store/features/assessmentInfoSlice';
import { selectStep, selectSubStep } from '@/store/features/workflowSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxhooks';
import GuideModal from '@/ui/GuideModal';
import LightbulbIcon from '@/assets/images/light-bulb.svg';
import ScreenShareCard from '@/ui/ScreenShareCard';
import ScreenShareGuide from '@/ui/ScreenShareGuide';
import StepHeader from '@/ui/StepHeader';

const ScreenShareStep = () => {
  const dispatch = useAppDispatch();
  const { acknowledged, subSteps } = useAppSelector((state) =>
    selectStep(state, 'screenShare'),
  );
  const { enableProctoring } = useAppSelector((state) => state.workflow);
  const proctor = useAppSelector(selectProctor);
  const screenShareState = useAppSelector((state) =>
    selectSubStep(state, 'screenShare', 'screenShare'),
  );

  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleCheckboxChange = () => {
    dispatch(
      setStepAcknowledged({
        step: 'screenShare',
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

  const areAllSubstepsCompleted = Object.values(subSteps).every(
    (subStep: SubStepState) => subStep.status === 'completed',
  );

  const status = evaluateParentStepStatus(Object.values(subSteps));

  const canProceed = enableProctoring || (acknowledged && areAllSubstepsCompleted);

  return (
    <>
      <StepHeader
        stepNumber='1'
        title='Share your Entire Screen'
        status={status}
      />
      <div className='mt-16'>
        <ScreenShareCard />
        <p className='mt-6 text-sm text-base-500 font-semibold text-center'>
          <img
            src={LightbulbIcon}
            alt='Lightbulb Icon'
            className='mb-1 w-6 h-6 inline-block mr-2 text-base-500 font-bold'
          />
          Need help?{' '}
          <a
            href='#'
            onClick={(e) => {
              e.preventDefault();
              setShowGuideModal(true);
            }}
            className='text-scaler-500 underline'
          >
            Click to view
          </a>{' '}
          screen sharing setup guide
        </p>
        {!enableProctoring && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (canProceed) {
                handleClick();
              }
            }}
            noValidate={false}
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
                By clicking on this, you confirm that you have shared your entire
                screen and it will stay connected throughout the test. Failure to
                do so may result in disqualification
              </label>
            </div>
            <Button
              type="submit"
              className='mt-8 items-center'
              variant='primary'
              size='lg'
              disabled={!areAllSubstepsCompleted}
            >
              {enableProctoring ? (
                'Confirm Settings'
              ) : (
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
        <GuideModal
          open={showGuideModal}
          onOpenChange={setShowGuideModal}
          isError={screenShareState.status === 'error'}
          title="It looks like you're having trouble allowing Screen Sharing Permissions"
        >
          <div className='space-y-6'>
            <p className='text-muted-foreground text-sm'>
              Refer to the guide below for steps to troubleshoot and grant
              screen sharing permissions
            </p>
            <div className='aspect-[16/9] w-full bg-muted rounded-lg overflow-y-auto p-8 shadow-sm'>
              <ScreenShareGuide />
            </div>
          </div>
        </GuideModal>
      </div>
    </>
  );
};

export default ScreenShareStep;
