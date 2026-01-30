import React from 'react';
import { AlertTriangle, CircleCheck, CircleX, Loader2 } from 'lucide-react';

import { Button } from '@/ui/Button';
import { selectStep } from '@/store/features/workflowSlice';
import { selectProctor } from '@/store/features/assessmentInfoSlice';
import { useAppSelector } from '@/hooks/reduxhooks';
import CompatibilityStep from './CompatibilityStep';

interface StatusOverrides {
  systemChecks?: 'locked' | 'pending' | 'completed' | 'error';
  networkChecks?: 'locked' | 'pending' | 'completed' | 'error';
  fullScreenCheck?: 'locked' | 'pending' | 'completed' | 'error';
}

interface SystemCheckCardProps {
  statusOverrides?: StatusOverrides;
  networkSpeed?: number;
}

export default function SystemCheckCard({ statusOverrides, networkSpeed }: SystemCheckCardProps) {
  const compatibilityStep = useAppSelector((state) =>
    selectStep(state, 'prerequisites'),
  );
  const proctor = useAppSelector(selectProctor);

  const COMPATIBILITY_CHECK_DATA = {
    systemChecks: {
      locked: {
        title: 'Browser compatibility',
        description:
          "We'll check your browser settings to ensure the test runs smoothly",
        icon: <div className='w-12 h-12 border-[#D6DEE5] border rounded-full' />,
      },
      pending: {
        title: 'Browser compatibility',
        description:
          "We'll check your browser settings to ensure the test runs smoothly",
        icon: <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />,
        checkBg: 'bg-blue-50',
      },
      completed: {
        title: 'Browser is compatible',
        description:
          "We'll check your browser settings to ensure the test runs smoothly",
        icon: <CircleCheck className='w-12 h-12 text-white fill-green-600' />,
      },
      error: {
        title: 'Browser is not recommended',
        description:
          "Supported browsers: Latest three versions of Chrome (preferred), Microsoft edge, Firefox, Opera and Safari browser",
        icon: <AlertTriangle className='w-12 h-12 text-white fill-yellow-500' />,
        checkBg: 'bg-yellow-50',
        error: (
          <span className='text-red-500'>
            <strong>Error</strong> - Supported browsers: Latest three versions
            of Chrome (preferred), Microsoft edge, Firefox, Opera and Safari browser
          </span>
        ),
        extraUi: null,
      },
    },
    networkChecks: {
      locked: {
        title: 'Network speed test',
        description:
          'Checking your network connection to ensure it stays stable during the test.',
        icon: <div className='w-12 h-12 border-[#D6DEE5] border rounded-full' />,
      },
      pending: {
        title: 'Network speed test',
        description:
          'Checking your network connection to ensure it stays stable during the test.',
        icon: <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />,
        checkBg: 'bg-blue-50',
      },
      completed: {
        title: 'Network looks good',
        description:
          'Checking your network connection to ensure it stays stable during the test.',
        icon: <CircleCheck className='w-12 h-12 text-white fill-green-600' />,
      },
      error: {
        title: `Very Poor Network, Speed${networkSpeed ? ": "+(networkSpeed / 1024).toFixed(2)+" Mbps" : ''}`,
        description:
          'This test needs at least 1mbps download speed.',
        icon: <AlertTriangle className='w-12 h-12 text-white fill-yellow-500' />,
        checkBg: 'bg-yellow-50',
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
        title: 'Full screen compliance',
        description: 'Ensure you stay in full-screen mode at all times',
        icon: <div className='w-12 h-12 border-[#D6DEE5] border rounded-full' />,
      },
      pending: {
        title: 'Full screen compliance',
        description: 'Ensure you stay in full-screen mode at all times',
        icon: <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />,
        checkBg: 'bg-blue-50',
      },
      completed: {
        title: 'In full screen mode',
        description: 'Ensure you stay in full-screen mode at all times',
        icon: <CircleCheck className='w-12 h-12 text-white fill-green-600' />,
      },
      error: {
        title: 'Switch to full screen mode',
        description: 'Ensure you stay in full-screen mode at all times',
        icon: <CircleX className='w-12 h-12 fill-red-500 text-red-50' />,
        checkBg: 'bg-red-50',
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
            const subStepStatus = statusOverrides?.[checkId as keyof StatusOverrides]
              ?? compatibilityStep.subSteps[checkId].status;
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


