import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { Status } from '@/types/workflowTypes';
import Loader from '@/ui/Loader';
import WavyCheckIcon from '@/assets/images/wavy-check-icon.svg';
import styles from './StepHeader.module.scss';

const StatusIcon = ({ status }: { status: Status }) => (
  status === 'completed' ? (
    <img
      src={WavyCheckIcon}
      className='text-white w-20 h-20 mr-4'
      alt="Wavy check icon"
    />
  ) : status === 'error' ? (
    <AlertTriangle className='text-red-500 w-20 h-20 mr-4' />
  ) : (
    <Loader size='lg' />
  )
);

const ProgressBar = ({ segments, currentSegment }: { segments: number; currentSegment: number }) => {
  return (
    <div className="flex items-center gap-2.5 mt-4 w-fit">
      {Array.from({ length: segments }).map((_, index) => (
        <div
          key={index}
          className={`h-1.5 w-20 rounded-full ${
            index < currentSegment ? 'bg-scaler-500' : 'bg-scaler-100'
          }`}
        />
      ))}
    </div>
  );
};

const StepHeader = ({
  stepNumber,
  title,
  description = '',
  status = 'pending',
  showIcon = true,
  progressBar = { segments: 0, currentSegment: 1 },
}: {
  stepNumber: string;
  title: string;
  description?: string;
  status?: Status;
  showIcon?: boolean;
  progressBar?: { segments: number; currentSegment: number };
}) => (
  <div className='flex items-center gap-4'>
    {showIcon && <StatusIcon status={status} />}
    <div>
      <div className={`text-xs text-base-200 ${styles.stepNumber}`}>
        STEP {stepNumber}
      </div>
      <h2 className='text-2xl font-bold mt-1 text-base-700'>
        {title}
      </h2>

      {progressBar && (
        <ProgressBar
          segments={progressBar.segments}
          currentSegment={progressBar.currentSegment}
        />
      )}

      {description && !progressBar && (
        <p className="text-sm text-base-200 italic mt-2">{description}</p>
      )}
    </div>
  </div>
);

export default StepHeader;
