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

const getSectionFromSubStep = (activeSubStep) => {
  if (activeSubStep === PREREQUISITE_STEPS.intro) return 'intro';
  if (COMPATIBILITY_CHECK_SUBSTEPS.includes(activeSubStep)) return 'compatibility';
  if (activeSubStep === PREREQUISITE_STEPS.consent) return 'consent';
  return 'intro';
};

const getSegmentFromSubStep = (activeSubStep) => {
  if (activeSubStep === PREREQUISITE_STEPS.intro) return 1;
  if (COMPATIBILITY_CHECK_SUBSTEPS.includes(activeSubStep)) return 2;
  if (activeSubStep === PREREQUISITE_STEPS.consent) return 3;
  return 1;
};

const isCompatibilityCompleted = (subSteps) => {
  return COMPATIBILITY_CHECK_SUBSTEPS.every((key) => {
    const substep = subSteps?.[key];
    if (!substep?.enabled) return true;
    return substep.status === 'completed';
  });
};

const PrerequisitesStep = () => {
  const dispatch = useAppDispatch();
  const { subSteps, activeSubStep } = useAppSelector((state) =>
    selectStep(state, 'prerequisites'),
  );

  const status = useMemo(
    () => evaluateParentStepStatus(Object.values(subSteps || {})),
    [subSteps],
  );

  const activeSection = getSectionFromSubStep(activeSubStep);
  
  const currentSegment = getSegmentFromSubStep(activeSubStep);

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
          segments: 3,
          currentSegment: currentSegment, 
        }}
      />

        <div className="flex-1 pt-20 h-full">
        {activeSection === 'intro' && <MemoizedIntroTab />}
        {activeSection === 'compatibility' && <MemoizedCompatibilityChecksTab />}
        {activeSection === 'consent' && <MemoizedConsentTab />}
      </div>
    </div>
  );
};

export default PrerequisitesStep;