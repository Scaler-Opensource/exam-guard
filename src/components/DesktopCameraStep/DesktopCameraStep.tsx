import React, { useState, useMemo } from 'react';

import { ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { evaluateParentStepStatus } from '@/utils/evaluateParentStepStatus';
import { getBrowserInfo } from '@/utils/browser';
import { getOperatingSystemInfo } from '@/utils/osInfo';
import { nextStep, setStepAcknowledged, selectSubStep, selectStep } from '@/store/features/workflowSlice';
import { selectProctor } from '@/store/features/assessmentInfoSlice';
import { SubStepState } from '@/types/workflowTypes';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxhooks';
import CameraCard from '@/ui/CameraCard';
import CameraShareGuide from '@/ui/CameraShareGuide';
import GuideModal from '@/ui/GuideModal';
import StepHeader from '@/ui/StepHeader';

const DesktopCameraStep = () => {
  const dispatch = useAppDispatch();
  const { acknowledged, subSteps } = useAppSelector((state) =>
    selectStep(state, 'cameraShare'),
  );
  const proctor = useAppSelector(selectProctor);
  const { enableProctoring } = useAppSelector((state) => state.workflow);

  const cameraState = useAppSelector((state) =>
    selectSubStep(state, 'cameraShare', 'cameraShare'),
  );

  const browserInfo: any = useMemo(() => getBrowserInfo(), []);
  const osInfo: any = useMemo(() => getOperatingSystemInfo(), []);

  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleCheckboxChange = () => {
    dispatch(
      setStepAcknowledged({
        step: 'cameraShare',
        acknowledged: !acknowledged,
      }),
    );
  };

  const handleClick = () => {
    if (enableProctoring) {
      proctor?.handleCompatibilityChecks({ forceRun: true });
    } else {
      proctor?.handleWebcamRequest();
      dispatch(nextStep());
    }
  };

  const areAllSubstepsCompleted = Object.values(subSteps).every(
    (subStep: SubStepState) => subStep.status === 'completed',
  );

  const status = evaluateParentStepStatus(Object.values(subSteps));

  const canProceed = enableProctoring || (acknowledged && areAllSubstepsCompleted);
  const renderGuideModal = useMemo(() => (
    <GuideModal
      open={showGuideModal}
      onOpenChange={setShowGuideModal}
      isError={cameraState.status === 'error'}
      title="It looks like you're having trouble accessing your camera"
    >
      <div className='space-y-6'>
        <p className='text-base-500 text-sm'>
          Refer to the image below for steps to troubleshoot and grant camera
          permissions
        </p>
        <div className='aspect-[16/9] w-full bg-muted rounded-lg overflow-y-auto p-8 shadow-sm'>
          <CameraShareGuide browserName={browserInfo?.name} osName={osInfo?.osName} />
        </div>
      </div>
    </GuideModal>
  ), [showGuideModal, cameraState.status, browserInfo?.name, osInfo?.osName]);

  return (
    <>
      <StepHeader
        stepNumber='2'
        title='Desktop/Laptop Camera Permissions'
        status={status}
      />
      <div className='mt-16'>
        <CameraCard />

        <p className='mt-6 text-sm text-base-500 font-semibold text-center'>
          <Lightbulb className='mb-1 w-6 h-6 inline-block mr-2 text-base-500 font-bold' />
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
              camera setup guide
        </p>
        {!enableProctoring && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (canProceed) {
                handleClick();
              }
            }}
          >
            <div className='flex items-start mt-16 text-sm'>
              <Checkbox
                id='confirm'
                className={`mt-1 mr-4 h-6 w-6`}
                checked={acknowledged}
                onCheckedChange={handleCheckboxChange}
                disabled={!areAllSubstepsCompleted}
                role="checkbox"
                required={areAllSubstepsCompleted}
              />
              <label 
                htmlFor='confirm' 
                className="text-sm text-gray-600 cursor-pointer"
              >
                By clicking, you confirm that all your compatibility checks have
                been successful. Failure to maintain them during the test may
                result in disqualification.
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

        {showGuideModal && renderGuideModal}
      </div>
    </>
  );
};

export default DesktopCameraStep;

