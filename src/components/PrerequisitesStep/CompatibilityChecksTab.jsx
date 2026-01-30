import React, { useEffect, useMemo, useState, useRef } from 'react';
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

const MIN_LOADER_TIME = 700;
const BANDWIDTH_CHECK_URL = 'https://dajh2p2mfq4ra.cloudfront.net/assets/icons/ib-logo-hire-8f3406787bc4241628bb7e5bea43d56a7ab275401134c297b6631c8b81cd3996.png';
const BANDWIDTH_TIMEOUT = 10000;

const CompatibilityChecksTab = () => {
  const dispatch = useAppDispatch();
  const proctor = useAppSelector(selectProctor);
  const { subSteps } = useAppSelector((state) => selectStep(state, 'prerequisites'));
  const { enableProctoring } = useAppSelector((state) => state.workflow);

  const [visualStatuses, setVisualStatuses] = useState({
    systemChecks: 'locked',
    networkChecks: 'locked',
    fullScreenCheck: 'locked',
  });
  const [currentCheckIndex, setCurrentCheckIndex] = useState(-1);
  const [networkSpeed, setNetworkSpeed] = useState(0);

  const loaderStartTime = useRef(null);
  const isMounted = useRef(false);
  const proctorTriggered = useRef(false);


  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!enableProctoring) return;
    if (proctor && !proctorTriggered.current) {
      proctorTriggered.current = true;

      setVisualStatuses({
        systemChecks: 'pending',
        networkChecks: 'locked',
        fullScreenCheck: 'locked',
      });
      setCurrentCheckIndex(0);
      loaderStartTime.current = Date.now();
      proctor.handleCompatibilityChecks();
    }
  }, [proctor]);

  useEffect(() => {
    if (enableProctoring) return;
    const updateFullScreenStatus = () => {
      const isFull = isFullScreen();
      dispatch(
        setSubStepStatus({
          step: 'prerequisites',
          subStep: 'fullScreenCheck',
          status: isFull ? 'completed' : 'error',
          clearError: isFull,
        })
      );
    };

    updateFullScreenStatus();

    document.addEventListener('fullscreenchange', updateFullScreenStatus);
    document.addEventListener('webkitfullscreenchange', updateFullScreenStatus);

    return () => {
      document.removeEventListener('fullscreenchange', updateFullScreenStatus);
      document.removeEventListener('webkitfullscreenchange', updateFullScreenStatus);
    };
  }, [dispatch]);


  useEffect(() => {
    if (enableProctoring) return;

    setVisualStatuses({
      systemChecks: 'pending',
      networkChecks: 'locked',
      fullScreenCheck: 'locked',
    });
    setCurrentCheckIndex(0);
    loaderStartTime.current = Date.now();

    const browserInfo = getBrowserInfo();
    dispatch(
      setSubStepStatus({
        step: 'prerequisites',
        subStep: 'systemChecks',
        status: browserInfo.isSupported ? 'completed' : 'error',
      })
    );

    const runNetworkCheck = async () => {
      try {
        const { speedKbps } = await checkBandwidthV2(BANDWIDTH_CHECK_URL, BANDWIDTH_TIMEOUT);

        if (!isMounted.current) return;

        setNetworkSpeed(speedKbps);
        dispatch(
          setSubStepStatus({
            step: 'prerequisites',
            subStep: 'networkChecks',
            status: speedKbps >= 1024 ? 'completed' : 'error',
          })
        );
      } catch (err) {
        if (!isMounted.current) return;
        dispatch(
          setSubStepStatus({
            step: 'prerequisites',
            subStep: 'networkChecks',
            status: 'error',
          })
        );
      }
    };

    runNetworkCheck();
  }, [dispatch, enableProctoring]);


  useEffect(() => {
    if (currentCheckIndex < 0 || currentCheckIndex >= COMPATIBILITY_CHECK_SUBSTEPS.length) {
      return;
    }

    const currentCheckKey = COMPATIBILITY_CHECK_SUBSTEPS[currentCheckIndex];
    const reduxStatus = subSteps?.[currentCheckKey]?.status;
    const isDone = reduxStatus === 'completed' || reduxStatus === 'error';

    if (isDone) {
      const elapsed = Date.now() - (loaderStartTime.current || Date.now());
      const remainingLoaderTime = Math.max(0, MIN_LOADER_TIME - elapsed);

      const timer = setTimeout(() => {
        if (!isMounted.current) return;

        setVisualStatuses((prev) => ({
          ...prev,
          [currentCheckKey]: reduxStatus,
        }));

        if (currentCheckIndex < COMPATIBILITY_CHECK_SUBSTEPS.length - 1) {
          const nextIndex = currentCheckIndex + 1;
          const nextCheckKey = COMPATIBILITY_CHECK_SUBSTEPS[nextIndex];

          setVisualStatuses((prev) => ({
            ...prev,
            [nextCheckKey]: 'pending',
          }));
          setCurrentCheckIndex(nextIndex);
          loaderStartTime.current = Date.now();
        }
      }, remainingLoaderTime);

      return () => clearTimeout(timer);
    }
  }, [currentCheckIndex, subSteps]);

  const areAllVisuallyCompleted = useMemo(() => {
    return COMPATIBILITY_CHECK_SUBSTEPS.every((key) => {
      const status = visualStatuses[key];
      return status === 'completed' || status === 'error';
    });
  }, [visualStatuses]);

  const isAnimating = useMemo(() => {
    return COMPATIBILITY_CHECK_SUBSTEPS.some((key) => {
      return visualStatuses[key] === 'pending' || visualStatuses[key] === 'locked';
    });
  }, [visualStatuses]);

  const hasError = useMemo(() => {
    return COMPATIBILITY_CHECK_SUBSTEPS.some((key) => {
      return subSteps?.[key]?.status === 'error';
    });
  }, [subSteps]);

  const handleNext = () => {
    dispatch(setActiveSubStep({ step: 'prerequisites', subStep: PREREQUISITE_STEPS.consent }));
    dispatch(setSubStepStatus({ step: 'prerequisites', subStep: PREREQUISITE_STEPS.consent, status: 'pending' }));
  };

  const handleGoBack = () => {
    dispatch(setActiveSubStep({ step: 'prerequisites', subStep: PREREQUISITE_STEPS.intro }));
  };

  const handleConfirmSettings = () => {
    setVisualStatuses({
      systemChecks: 'pending',
      networkChecks: 'locked',
      fullScreenCheck: 'locked',
    });
    setCurrentCheckIndex(0);
    loaderStartTime.current = Date.now();
    proctorTriggered.current = false;
    proctor?.handleCompatibilityChecks({ forceRun: true });
    proctorTriggered.current = true;
  };

  return (
    <div className="h-full min-h-fit w-full flex flex-col justify-between gap-20 items-start">
      <div className="w-full">
        <SystemCheckCard statusOverrides={visualStatuses} networkSpeed={networkSpeed} />
      </div>

      <div className="mb-10">
        <div className="text-xs text-base-200 flex items-center mb-8 gap-2">
          <img src={LightBulb} alt="Light Bulb" className="w-7 h-7 opacity-60" />
          Need more help? Click to view{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="text-scaler-500 hover:underline cursor-pointer"
          >
            setup guide
          </a>
        </div>

        {!enableProctoring && (
          <div className="flex items-center gap-5">
            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              disabled={!areAllVisuallyCompleted || isAnimating || hasError}
              className="px-20 text-sm font-normal disabled:bg-[#D6DEE5] disabled:opacity-100 disabled:text-[#91A1B7]"
            >
              Next
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleGoBack}
              className="px-8 font-normal text-sm"
            >
              Go back
            </Button>
          </div>
        )}

        {enableProctoring && (
          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleConfirmSettings}
              disabled={isAnimating}
              className="px-20 text-sm font-normal disabled:bg-[#D6DEE5] disabled:opacity-100 disabled:text-[#91A1B7]"
            >
              Confirm Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompatibilityChecksTab;
