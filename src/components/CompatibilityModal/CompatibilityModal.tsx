import React, { useMemo, useState, useEffect } from 'react';
import {
  Monitor,
  Camera,
  Smartphone,
  Settings,
  CircleCheck,
} from 'lucide-react';

import { Modal } from '@/ui/Modal';
import { Step, WorkflowStepKey } from '@/types/workflowTypes';
import { useAppSelector } from '@/hooks/reduxhooks';
import { evaluateParentStepStatus } from '@/utils/evaluateParentStepStatus';
import CompatibilityModalHeader from '@/components/CompatibilityModalHeader';
import CompatibilityModalStepsScreen from '@/components/CompatibilityModalStepsScreen';
import DesktopCameraStep from '@/components/DesktopCameraStep';
import DisqualificationTimerBar from '@/components/DisqualificationTimerBar';
import MobileCameraStep from '@/components/MobileCameraStep';
import ScreenShareStep from '@/components/ScreenShareStep';
import SystemChecksStep from '@/components/SystemChecksStep';

const ALL_STEPS: Record<string, Step> = {
  cameraShare: {
    icon: Camera,
    title: 'Desktop Camera Permissions',
    component: <DesktopCameraStep />,
  },
  screenShare: {
    icon: Monitor,
    title: 'Screen Share Permissions',
    component: <ScreenShareStep />,
  },
  mobileCameraShare: {
    icon: Smartphone,
    title: 'Mobile Camera Pairing',
    component: <MobileCameraStep />,
  },
  compatibilityChecks: {
    icon: Settings,
    title: 'System Compatibility Checks',
    component: <SystemChecksStep />,
  },
};

export default function CompatibilityModal() {
  const { activeStep, enableProctoring, steps, modalOpen } = useAppSelector(
    (state) => state.workflow,
  );
  const isDisqualified = useAppSelector(
    (state) => state.workflow.isDisqualified,
  );
  const beepConfig = useAppSelector((state) => state.workflow.beepConfig);
  const [localModalOpen, setLocalModalOpen] = useState(modalOpen);
  const [showSuccess, setShowSuccess] = useState(false);
  const [timer, setTimer] = useState(3);

  const enabledSteps = useMemo(() => {
    return Object.entries(ALL_STEPS).reduce(
      (acc, [key, step]) => {
        if (steps[key as WorkflowStepKey]?.enabled) {
          acc[key] = step;
        }
        return acc;
      },
      {} as Record<string, Step>,
    );
  }, [steps]);

  const failingSteps = useMemo(() => {
    return Object.entries(steps).reduce((acc, [key, stepState]) => {
      if (stepState.enabled && evaluateParentStepStatus(Object.values(stepState.subSteps)) === 'error') {
        acc.push(key as WorkflowStepKey);
      }
      return acc;
    }, [] as WorkflowStepKey[]);
  }, [steps]);

  const [initialStep, setInitialStep] = useState(activeStep);

  useEffect(() => {
    if (modalOpen) {
      setInitialStep(activeStep);
      setLocalModalOpen(true);
      setShowSuccess(false);
      setTimer(2);
    }
  }, [modalOpen, activeStep]);

  useEffect(() => {
    if (!modalOpen && localModalOpen) {
      if (!isDisqualified) {
        setShowSuccess(true);
      }

      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            setLocalModalOpen(false);
            setShowSuccess(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [modalOpen, localModalOpen, isDisqualified]);

  return (
    <Modal
      isOpen={localModalOpen}
      modalClassName='w-[100%] h-[100%] flex flex-col items-stretch overflow-hidden'
    >
      {showSuccess ? (
        <div className='flex flex-col items-center justify-center h-full bg-white space-y-4'>
          <CircleCheck className='w-32 h-32  text-white fill-green-600' />
          <div className='text-3xl font-semibold text-green-600'>
            Compatibility Check Success
          </div>
          <div className='text-lg text-gray-500'>
            Redirecting back to the page in {timer} seconds
          </div>
        </div>
      ) : (
        <>
          {localModalOpen && enableProctoring && activeStep && (
            <DisqualificationTimerBar
              activeStep={initialStep}
              modalOpen={localModalOpen}
              failingSteps={failingSteps}
              beepConfig={beepConfig}
            />
          )}
          <div className='grow flex flex-row items-center overflow-hidden'>
            <div className='flex flex-col justify-center bg-base-100 p-20 pt-24 m-w-96 w-1/3 h-[calc(100vh-22px)] overflow-y-auto'>
              <div className='h-[80%]'>
                <CompatibilityModalHeader />
                <CompatibilityModalStepsScreen step_data={enabledSteps} />
              </div>
            </div>

            <div className='flex flex-col justify-center p-20 pt-20 flex-1 overflow-y-auto h-full'>
              {enabledSteps[activeStep]?.component}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
