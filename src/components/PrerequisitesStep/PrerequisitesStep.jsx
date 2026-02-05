import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxhooks';
import { selectStep, setSubStepStatus } from '@/store/features/workflowSlice';
import { evaluateParentStepStatus } from '@/utils/evaluateParentStepStatus';
import StepHeader from '@/ui/StepHeader';

import IntroTab from '@/components/PrerequisitesStep/IntroTab';
import CompatibilityChecksTab from '@/components/PrerequisitesStep/CompatibilityChecksTab';
import ConsentTab from '@/components/PrerequisitesStep/ConsentTab';

const MemoizedIntroTab = React.memo(IntroTab);
const MemoizedCompatibilityChecksTab = React.memo(CompatibilityChecksTab);
const MemoizedConsentTab = React.memo(ConsentTab);

const PrerequisitesStep = () => {
  const dispatch = useAppDispatch();
  const { subSteps, activeSubStep } = useAppSelector((state) =>
    selectStep(state, 'prerequisites'),
  );

  const status = useMemo(
    () => evaluateParentStepStatus(Object.values(subSteps || {})),
    [subSteps],
  );

  const isCompatibilitySegmentEnabled = useMemo(() => {
    return (
      subSteps?.browserCheck?.enabled ||
      subSteps?.networkCheck?.enabled ||
      subSteps?.fullScreenCheck?.enabled
    );
  }, [subSteps]);

  const { activeSection, currentSegment } = useMemo(() => {
    let section = 'intro';
    let segment = 1;

    if (activeSubStep === 'introduction') {
      section = 'intro';
      segment = 1;
    } else if (isCompatibilitySegmentEnabled && ['browserCheck', 'networkCheck', 'fullScreenCheck'].includes(activeSubStep)) {
      section = 'compatibility';
      segment = 2;
    } else if (activeSubStep === 'consent') {
      section = 'consent';
      segment = isCompatibilitySegmentEnabled ? 3 : 2;
    }

    return { activeSection: section, currentSegment: segment };
  }, [activeSubStep, isCompatibilitySegmentEnabled]);

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
        stepNumber="1"
        title="Prerequisites"
        status={status}
        showIcon={false}
        progressBar={{
          segments: isCompatibilitySegmentEnabled ? 3 : 2,
          currentSegment: currentSegment,
        }}
      />

      <div className="flex-1 pt-20 h-full">
        {activeSection === 'intro' && (
          <MemoizedIntroTab isCompatibilitySegmentEnabled={isCompatibilitySegmentEnabled} />
        )}
        {activeSection === 'compatibility' && (
          <MemoizedCompatibilityChecksTab />
        )}
        {activeSection === 'consent' && (
          <MemoizedConsentTab isCompatibilitySegmentEnabled={isCompatibilitySegmentEnabled} />
        )}
      </div>
    </div>
  );
};

export default PrerequisitesStep;