import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, ChevronDown } from 'lucide-react';

const CompatibilityStep = ({
  status,
  title,
  description,
  icon,
  error,
  extraUi,
}: any) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      className={cn(
        'flex items-center justify-between w-full p-8 px-12 bg-white',
        status === 'error' && 'bg-red-50',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-8 w-full',
          status === 'error' && 'items-center',
        )}
      >
        <div className='mt-1'>{status === 'pending' ? <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' /> : icon}</div>
        <div className='flex flex-col gap-1.5 w-full'>
          <div 
            className='flex items-center justify-between cursor-pointer' 
            onClick={() => status === 'error' && description && setIsExpanded(!isExpanded)}
          >
            <h3 className='font-medium text-gray-900 text-base'>{title}</h3>
            {status === 'error' && description && (
              <ChevronDown 
                className={cn(
                  'w-7 h-7 transition-transform',
                  isExpanded && 'transform rotate-180'
                )} 
              />
            )}
          </div>
          {status === 'error' && description && isExpanded && (
            <p className='text-gray-500 text-sm italic'>{description}</p>
          )}
          {error && (
            <div className='mt-1 text-xs italic text-red-500'>{error}</div>
          )}
        </div>
      </div>
      {extraUi && <div className='flex items-center'>{extraUi}</div>}
    </div>
  );
};

export default CompatibilityStep;