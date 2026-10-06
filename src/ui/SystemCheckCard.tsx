import React from 'react';
import { AlertTriangle, CircleCheck, Loader2 } from 'lucide-react';

import { Button } from '@/ui/Button';
import { selectStep } from '@/store/features/workflowSlice';
import { selectProctor } from '@/store/features/assessmentInfoSlice';
import { useAppSelector } from '@/hooks/reduxhooks';
import CompatibilityStep from './CompatibilityStep';

export default function SystemCheckCard() {
  const compatibilityStep = useAppSelector((state) =>
    selectStep(state, 'compatibilityChecks'),
  );
  const proctor = useAppSelector(selectProctor);

  const COMPATIBILITY_CHECK_DATA = {
    systemChecks: {
      locked: {
        title: 'System Compatibility',
        description:
          "We'll check your browser settings to ensure the test runs smoothly",
        icon: <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />,
      },
      pending: {
        title: 'System Compatibility',
        description:
          "We'll check your browser settings to ensure the test runs smoothly",
        icon: <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />,
      },
      completed: {
        title: 'System Compatibility',
        description:
          "We'll check your browser settings to ensure the test runs smoothly",
        icon: <CircleCheck className='w-12 h-12 text-white fill-green-600' />,
      },
      error: {
        title: 'System Compatibility',
        description:
          "We'll check your browser settings to ensure the test runs smoothly",
        icon: <AlertTriangle className='w-12 h-12 text-red-500' />,
        error: (
          <span className='text-red-500'>
            <strong>Error</strong> - Supported browsers: Latest three versions
            of Chrome (preferred), Microsoft edge, Firefox and Safari browser
          </span>
        ),
        extraUi: null,
      },
    },
    networkChecks: {
      locked: {
        title: 'Network Checks : Compatibility',
        description:
          'Checking your network connection to ensure it stays stable during the test.',
        icon: <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />,
      },
      pending: {
        title: 'Network Checks : Compatibility',
        description:
          'Checking your network connection to ensure it stays stable during the test.',
        icon: <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />,
      },
      completed: {
        title: 'Network Checks : Compatibility',
        description:
          'Checking your network connection to ensure it stays stable during the test.',
        icon: <CircleCheck className='w-12 h-12 text-white fill-green-600' />,
      },
      error: {
        title: 'Network Checks : Compatibility',
        description:
          'Checking your network connection to ensure it stays stable during the test.',
        icon: <AlertTriangle className='w-12 h-12 text-red-500' />,
        error: (
          <span className='text-red-500'>
            Error - Network speed:{' '}
            <span className='font-medium'>Atleast 512kbps</span>
          </span>
        ),
        extraUi: null,
      },
    },
    fullScreenCheck: {
      locked: {
        title: 'Switch to full screen mode',
        description: 'Ensure you stay in full-screen mode at all times',
        icon: <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />,
      },
      pending: {
        title: 'Switch to full screen mode',
        description: 'Ensure you stay in full-screen mode at all times',
        icon: <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />,
      },
      completed: {
        title: 'Switch to full screen mode',
        description: 'Ensure you stay in full-screen mode at all times',
        icon: <CircleCheck className='w-12 h-12 text-white fill-green-600' />,
      },
      error: {
        title: 'Switch to full screen mode',
        description: 'Ensure you stay in full-screen mode at all times',
        icon: <AlertTriangle className='w-12 h-12 text-red-500' />,
        error: (
          <span className='text-red-500'>
            Error - Switch to full screen mode
          </span>
        ),
        extraUi: (
          <div className='flex flex-row flex-wrap items-center gap-2 justify-end'>
            <span className='text-base-200 italic text-sm mr-2G'>
              Press <span className='font-semibold'>ENTER KEY</span> or
            </span>
            <Button
              variant='outline'
              className='text-scaler-500 border-blue-500 hover:bg-blue-50 hover:text-blue-600 text-sm'
              onClick={() => proctor?.enableFullScreen()}
            >
              Enter Full Screen Mode
            </Button>
          </div>
        ),
      },
    },
  };

  return (
    <div className='max-w-full'>
      <section className='flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-200'>
        {Object.entries(COMPATIBILITY_CHECK_DATA).map(
          ([checkId, checkData]) => {
            const subStepStatus = compatibilityStep.subSteps[checkId].status;
            return (
              <CompatibilityStep
                key={checkId}
                checkId={checkId}
                status={subStepStatus}
                {...checkData[subStepStatus]}
              />
            );
          },
        )}
      </section>
    </div>
  );
}


