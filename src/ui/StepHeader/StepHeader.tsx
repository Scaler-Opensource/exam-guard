import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { Status } from '@/types/workflowTypes';
import Loader from '@/ui/Loader';
import WavyCheckIcon from '@/assets/images/wavy-check-icon.svg';
import styles from './StepHeader.module.scss';

const StepHeader = ({
  stepNumber,
  title,
  description = '',
  status = 'pending',
}: {
  stepNumber: string;
  title: string;
  description?: string;
  status?: Status;
}) => (
  <div className='flex items-center gap-4'>
    {status === 'completed' ? (
      <img 
        src={WavyCheckIcon} 
        className='text-white w-20 h-20 mr-4'
        alt="Wavy check icon"
      />
    ) : status === 'error' ? (
      <AlertTriangle className='text-red-500 w-20 h-20 mr-4' />
    ) : (
      <Loader size='lg' />
    )}
    <div>
      <div className={`text-xs text-base-500 ${styles.stepNumber}`}>
        STEP {stepNumber}
      </div>
      <h2 className='text-2xl font-bold mt-1 text-base-700'>
        {title}
      </h2>
      <p className='text-sm text-base-200 italic mt-2'>
        {description}
      </p>
    </div>
  </div>
);

export default StepHeader;
