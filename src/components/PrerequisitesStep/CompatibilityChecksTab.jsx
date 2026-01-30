import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/ui/Button';
import SystemCheckCard from '@/ui/SystemCheckCard';
import {
  selectStep,
  setSubStepStatus,
  setActiveSubStep,
} from '@/store/features/workflowSlice';
import { selectProctor } from '@/store/features/assessmentInfoSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxhooks';
import { PREREQUISITE_STEPS, COMPATIBILITY_CHECK_SUBSTEPS } from '@/utils/constants';
import LightBulb from '@/assets/images/light-bulb.svg';
import { isFullScreen } from '@/utils/fullScreenBlocker';
import { checkBandwidthV2 } from '@/utils/network';
import { getBrowserInfo } from '@/utils/browser';

const MIN_LOADER_TIME = 500;
const BANDWIDTH_CHECK_URL = 'https://dajh2p2mfq4ra.cloudfront.net/assets/icons/ib-logo-hire-8f3406787bc4241628bb7e5bea43d56a7ab275401134c297b6631c8b81cd3996.png';
const BANDWIDTH_TIMEOUT = 10000;
const NON_BLOCKING_ERRORS = ['networkChecks'];

const CompatibilityChecksTab = () => {
  const dispatch = useAppDispatch();
  const proctor = useAppSelector(selectProctor);
  const { enableProctoring } = useAppSelector((state) => state.workflow);

  const stepData = useAppSelector((state) => selectStep(state, 'prerequisites')) || {};
  const subSteps = stepData.subSteps || {};

  const enabledCheckSubsteps = useMemo(() => {
     return COMPATIBILITY_CHECK_SUBSTEPS.filter(
      (key) => subSteps?.[key]?.enabled !== false
    );
  }, []);

  const [visualStatuses, setVisualStatuses] = useState(() => {
    const initial = {};
    enabledCheckSubsteps.forEach((key, index) => {
      initial[key] = index === 0 ? 'pending' : 'locked';
    });
    return initial;
  });

  const [currentCheckIndex, setCurrentCheckIndex] = useState(0);
  const [networkSpeed, setNetworkSpeed] = useState(0);
  const loaderStartTime = useRef(Date.now());
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const updateFullScreenStatus = useCallback(() => {
    if (!enabledCheckSubsteps.includes('fullScreenCheck')) return;
    const isFull = isFullScreen();
    dispatch(
      setSubStepStatus({
        step: 'prerequisites',
        subStep: 'fullScreenCheck',
        status: isFull ? 'completed' : 'error',
        clearError: isFull,
      })
    );
  }, [dispatch, enabledCheckSubsteps]);

  useEffect(() => {
    if (enableProctoring) return;
    if (enabledCheckSubsteps.length === 0) return;

    const runChecks = async () => {
      if (enabledCheckSubsteps.includes('systemChecks')) {
        const { isSupported } = getBrowserInfo();
        dispatch(setSubStepStatus({
          step: 'prerequisites',
          subStep: 'systemChecks',
          status: isSupported ? 'completed' : 'error',
        }));
      }

      if (enabledCheckSubsteps.includes('networkChecks')) {
        try {
          const { speedKbps } = await checkBandwidthV2(BANDWIDTH_CHECK_URL, BANDWIDTH_TIMEOUT);
          if (isMounted.current) {
            setNetworkSpeed(speedKbps);
            dispatch(setSubStepStatus({
              step: 'prerequisites',
              subStep: 'networkChecks',
              status: speedKbps >= 1024 ? 'completed' : 'error',
            }));
          }
        } catch (e) {
          if (isMounted.current) {
            dispatch(setSubStepStatus({ step: 'prerequisites', subStep: 'networkChecks', status: 'error' }));
          }
        }
      }
    };

    runChecks();
    
    updateFullScreenStatus();
    document.addEventListener('fullscreenchange', updateFullScreenStatus);
    document.addEventListener('webkitfullscreenchange', updateFullScreenStatus);

    return () => {
      document.removeEventListener('fullscreenchange', updateFullScreenStatus);
      document.removeEventListener('webkitfullscreenchange', updateFullScreenStatus);
    };
  }, [dispatch, enableProctoring, enabledCheckSubsteps, updateFullScreenStatus]);


  useEffect(() => {
    if (enableProctoring || currentCheckIndex >= enabledCheckSubsteps.length) return;

    const currentKey = enabledCheckSubsteps[currentCheckIndex];
    const realStatus = subSteps?.[currentKey]?.status;

    if (realStatus === 'completed' || realStatus === 'error') {
      const elapsed = Date.now() - loaderStartTime.current;
      const remainingTime = Math.max(0, MIN_LOADER_TIME - elapsed);

      const timeoutId = setTimeout(() => {
        if (!isMounted.current) return;

        setVisualStatuses(prev => ({ ...prev, [currentKey]: realStatus }));

        if (currentCheckIndex < enabledCheckSubsteps.length - 1) {
          const nextKey = enabledCheckSubsteps[currentCheckIndex + 1];
          setVisualStatuses(prev => ({ ...prev, [nextKey]: 'pending' }));
          setCurrentCheckIndex(prev => prev + 1);
          loaderStartTime.current = Date.now();
        }
      }, remainingTime);

      return () => clearTimeout(timeoutId);
    }
  }, [currentCheckIndex, subSteps, enabledCheckSubsteps, enableProctoring]);

  const areAllVisuallyCompleted = useMemo(() => {
    return enabledCheckSubsteps.every(key => ['completed', 'error'].includes(visualStatuses[key]));
  }, [visualStatuses, enabledCheckSubsteps]);

  const hasError = useMemo(() => {
    return enabledCheckSubsteps.some(key =>
      !NON_BLOCKING_ERRORS.includes(key) && subSteps?.[key]?.status === 'error'
    );
  }, [subSteps, enabledCheckSubsteps]);

  const handleNext = () => {
    dispatch(setSubStepStatus({ step: 'prerequisites', subStep: PREREQUISITE_STEPS.consent, status: 'pending' }));
    dispatch(setActiveSubStep({ step: 'prerequisites', subStep: PREREQUISITE_STEPS.consent }));
  };

  const handleGoBack = () => {
    dispatch(setActiveSubStep({ step: 'prerequisites', subStep: PREREQUISITE_STEPS.intro }));
  };

  return (
    <div className="h-full min-h-fit w-full flex flex-col justify-between gap-20 items-start">
      <div className="w-full">
        {enableProctoring ? (
          <SystemCheckCard />
        ) : (
          <SystemCheckCard statusOverrides={visualStatuses} networkSpeed={networkSpeed} />
        )}
      </div>

      <div className="mb-10">
        <div className="text-xs text-base-200 flex items-center mb-8 gap-2">
          <img src={LightBulb} alt="Tip" className="w-7 h-7 opacity-60" />
          Need more help? Click to view{' '}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="text-scaler-500 hover:underline cursor-pointer"
          >
            setup guide
          </a>
        </div>

        {!enableProctoring ? (
          <div className="flex items-center gap-5">
            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              disabled={!areAllVisuallyCompleted || hasError}
              className="px-20 text-sm font-normal disabled:bg-[#D6DEE5] disabled:opacity-100 disabled:text-[#91A1B7]"
            >
              Next <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
            <Button variant="outline" size="lg" onClick={handleGoBack} className="px-8 font-normal text-sm">
              Go back
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={() => proctor?.handleCompatibilityChecks({ forceRun: true })}
            className="px-20 text-sm font-normal"
          >
            Confirm Settings
          </Button>
        )}
      </div>
    </div>
  );
};

export default CompatibilityChecksTab;