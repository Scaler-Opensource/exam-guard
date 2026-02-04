import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxhooks';
import { selectStep, setSubStepStatus } from '@/store/features/workflowSlice';
import { evaluateParentStepStatus } from '@/utils/evaluateParentStepStatus';
import StepHeader from '@/ui/StepHeader';


import IntroTab from '@/components/DesktopCameraStep/IntroTab';
import CameraShareTab from '@/components/DesktopCameraStep/CameraShareTab';
import ImageChecksTab from '@/components/DesktopCameraStep/ImageChecksTab';

const MemoizedIntroTab = React.memo(IntroTab);
const MemoizedCameraShareTab = React.memo(CameraShareTab);
const MemoizedImageChecksTab = React.memo(ImageChecksTab);

const PrerequisitesStep = () => {
  const dispatch = useAppDispatch();
  const { subSteps, activeSubStep } = useAppSelector((state) =>
    selectStep(state, 'cameraShare'),
  );

  const status = useMemo(
    () => evaluateParentStepStatus(Object.values(subSteps || {})),
    [subSteps],
  );

  const { activeSection, currentSegment } = useMemo(() => {
    let section = 'intro';
    let segment = 1;

    if (activeSubStep === 'introduction') {
      section = 'intro';
      segment = 1;
    } else if (activeSubStep === 'cameraShare') {
      section = 'cameraShare';
      segment = 2;
    } else if (['qualityCheck', 'visibilityCheck'].includes(activeSubStep)) {
      section = 'imageChecks';
      segment =  3;
    }

    return { activeSection: section, currentSegment: segment };
  }, [activeSubStep]);

  useEffect(() => {
    if (subSteps?.['introduction']?.status === 'locked') {
      dispatch(
        setSubStepStatus({
          step: 'prerequisites',
          subStep: 'introduction',
          status: 'pending',
        }),
      );
    }
  }, [dispatch, subSteps]);

  return (
    <div className="w-full h-full">
      <StepHeader
        stepNumber="2"
        title="Desktop Camera Setup"
        status={status}
        showIcon={false}
        progressBar={{
          segments: 3,
          currentSegment: currentSegment,
        }}
      />

      <div className="flex-1 pt-20 h-full">
        {activeSection === 'intro' && (
          <MemoizedIntroTab />
        )}
        {activeSection === 'cameraShare' && (
          <MemoizedCameraShareTab />
        )}
        {activeSection === 'imageChecks' && (
          <MemoizedImageChecksTab />
        )}
      </div>
    </div>
  );
};

export default PrerequisitesStep;