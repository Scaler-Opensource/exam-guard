import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, ChevronDown } from 'lucide-react';
import Loader from './Loader';

const CompatibilityStep = ({
  status,
  title,
  description,
  icon,
  error,
  extraUi,
  checkBg,
}: any) => {

  return (
    <div
      className={cn(
        'flex items-center justify-between w-full p-8 px-12 bg-white',
        checkBg,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-8 w-full',
          status === 'error' && 'items-center',
        )}
      >
        <div className='mt-1'>{status === 'pending' ? <Loader size='sm' /> : icon}</div>
        <div className='flex flex-col gap-1.5 w-full'>
          <div
            className='flex items-center justify-between cursor-pointer'
          >
            <h3 className='font-medium text-gray-900 text-base'>{title}</h3>
          </div>
          {status === 'pending' && description && (
            <p className='text-gray-500 text-sm'>{description}</p>
          )}
          {status === 'error' && description && (
            <p className='text-gray-500 text-sm italic'>{description}</p>
          )}
          {/* {error && (
            <div className='mt-1 text-xs italic text-red-500'>{error}</div>
          )} */}
        </div>
      </div>
      {extraUi && <div className='flex items-center'>{extraUi}</div>}
    </div>
  );
};

export default CompatibilityStep;