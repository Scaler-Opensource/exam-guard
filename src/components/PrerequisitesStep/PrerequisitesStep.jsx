import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxhooks';
import { selectStep, setSubStepStatus } from '@/store/features/workflowSlice';
import { evaluateParentStepStatus } from '@/utils/evaluateParentStepStatus';
import { PREREQUISITE_STEPS, COMPATIBILITY_CHECK_SUBSTEPS } from '@/utils/constants';
import StepHeader from '@/ui/StepHeader';

import IntroTab from './IntroTab';
import CompatibilityChecksTab from './CompatibilityChecksTab';
import ConsentTab from './ConsentTab';

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
      subSteps?.systemChecks?.enabled ||
      subSteps?.networkChecks?.enabled ||
      subSteps?.fullScreenCheck?.enabled
    );
  }, [subSteps]);

  const { activeSection, currentSegment } = useMemo(() => {
    let section = 'intro';
    let segment = 1;

    if (activeSubStep === PREREQUISITE_STEPS.intro) {
      section = 'intro';
      segment = 1;
    } else if (isCompatibilitySegmentEnabled && COMPATIBILITY_CHECK_SUBSTEPS.includes(activeSubStep)) {
      section = 'compatibility';
      segment = 2;
    } else if (activeSubStep === PREREQUISITE_STEPS.consent) {
      section = 'consent';
      segment = isCompatibilitySegmentEnabled ? 3 : 2;
    }

    return { activeSection: section, currentSegment: segment };
  }, [activeSubStep, isCompatibilitySegmentEnabled]);

  useEffect(() => {
    if (subSteps?.[PREREQUISITE_STEPS.intro]?.status === 'locked') {
      dispatch(
        setSubStepStatus({
          step: 'prerequisites',
          subStep: PREREQUISITE_STEPS.intro,
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