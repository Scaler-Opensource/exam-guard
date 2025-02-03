import classNames from 'classnames';
import React, { useCallback } from 'react';

import {
  Loader2, CircleCheck, AlertTriangle, ArrowUpRight,
} from 'lucide-react';
import CompatibilityStep from '@/ui/CompatibilityStep';

const LOGO_SRC = 'https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/106/389/original/Image_7_from_Figma.png?1738592475';

const POSITION_CHECKS = {
  alignment: {
    pending: {
      title: 'Your Alignment',
      description: 'Please ensure your head is visible in the frame',
      icon: <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />,
    },
    completed: {
      title: 'Your Alignment',
      description: 'Please ensure your head is visible in the frame',
      icon: <CircleCheck className='w-12 h-12 text-white fill-green-600' />,
    },
    error: {
      title: 'Your Alignment',
      description: 'Please ensure your head is visible in the frame',
      icon: <AlertTriangle className='w-12 h-12 text-red-500' />,
    },
  },
  laptopVisbility: {
    pending: {
      title: 'Laptop Visibility',
      description: 'Please ensure your laptop is visible in the frame',
      icon: <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />,
    },
    completed: {
      title: 'Laptop Visibility',
      description: 'Please ensure your laptop is visible in the frame',
      icon: <CircleCheck className='w-12 h-12 text-white fill-green-600' />,
    },
    error: {
      title: 'Laptop Visibility',
      description: 'Please ensure your laptop is visible in the frame',
      icon: <AlertTriangle className='w-12 h-12 text-red-500' />,
    },
  },
  imageQuality: {
    pending: {
      title: 'Image Quality',
      description: 'Please ensure your image is clear and sharp',
      icon: <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />,
    },
    completed: {
      title: 'Image Quality',
      description: 'Please ensure your image is clear and sharp',
      icon: <CircleCheck className='w-12 h-12 text-white fill-green-600' />,
    },
    error: {
      title: 'Image Quality',
      description: 'Please ensure your image is clear and sharp',
      icon: <AlertTriangle className='w-12 h-12 text-red-500' />,
    },
  },
  imageQuality1: {
    pending: {
      title: 'Image Quality',
      description: 'Please ensure your image is clear and sharp',
      icon: <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />,
    },
    completed: {
      title: 'Image Quality',
      description: 'Please ensure your image is clear and sharp',
      icon: <CircleCheck className='w-12 h-12 text-white fill-green-600' />,
    },
    error: {
      title: 'Image Quality',
      description: 'Please ensure your image is clear and sharp',
      icon: <AlertTriangle className='w-12 h-12 text-red-500' />,
    },
  },
  imageQuality2: {
    pending: {
      title: 'Image Quality',
      description: 'Please ensure your image is clear and sharp',
      icon: <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />,
    },
    completed: {
      title: 'Image Quality',
      description: 'Please ensure your image is clear and sharp',
      icon: <CircleCheck className='w-12 h-12 text-white fill-green-600' />,
    },
    error: {
      title: 'Image Quality',
      description: 'Please ensure your image is clear and sharp',
      icon: <AlertTriangle className='w-12 h-12 text-red-500' />,
    },
  },
};

const RealTimeCheckResult = ({ isComplete, setPositionGuideModalOpen }) => {
  const handleSubtitleClick = useCallback(() => {
    if (isComplete) {
      setPositionGuideModalOpen(true);
    }
  }, [isComplete, setPositionGuideModalOpen]);

  return (<section className="flex flex-col flex-1 ml-6">
    <div className="flex flex-row items-center">
      <img className="mr-3 h-8 w-8" src={LOGO_SRC} alt="logo" />
      <div className="flex-col">
        <heading className="mb-1 text-base font-bold">
          {isComplete ? 'Screenshot Analysis Completed'
            : 'Screenshot Analysis In Progress'}
        </heading>
        {<p
          className={classNames('flex items-center text-xs', {
            'text-blue-500': isComplete,
            'text-gray-500': !isComplete,
            'cursor-pointer': isComplete,
          })}
          onClick={handleSubtitleClick}>
          {isComplete ? (<>View Demo <ArrowUpRight className='w-6 h-6 ml-2' /></>) : 'Please wait'}
        </p>}
      </div>
    </div>
    <section className="flex flex-col
    rounded-2xl border border-gray-200 bg-white
     divide-y divide-gray-200 mt-8 overflow-auto max-h-[300px]">
      {Object.entries(POSITION_CHECKS).map(([key, value]) => (
        <CompatibilityStep
          key={key}
          status={'completed'}
          title={value.completed.title}
          description={value.completed.description}
          icon={value.completed.icon}
        />
      ))}
    </section>
  </section>);
};

export default RealTimeCheckResult;
