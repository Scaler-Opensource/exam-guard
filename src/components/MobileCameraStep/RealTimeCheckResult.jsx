import classNames from 'classnames';
import React, { useCallback } from 'react';

import {
  Loader2, CircleCheck, AlertTriangle, ArrowUpRight,
} from 'lucide-react';
import { titleCase } from '@/utils/case';
import CompatibilityStep from '@/ui/CompatibilityStep';

const LOGO_SRC = 'https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/106/389/original/Image_7_from_Figma.png?1738592475';

const PLACEHOLDER_CHECKS = [
  'user_visibility',
  'laptop_visibility',
  'image_quality',
];

const RealTimeCheckResult = ({
  setPositionGuideModalOpen,
  positionCheckResult,
  isLoading,
}) => {
  const handleSubtitleClick = useCallback(() => {
    if (!isLoading) {
      setPositionGuideModalOpen(true);
    }
  }, [isLoading, setPositionGuideModalOpen]);

  return (<section className="flex flex-col flex-1 ml-6">
    <div className="flex flex-row items-center">
      <img className="mr-3 h-8 w-8" src={LOGO_SRC} alt="logo" />
      <div className="flex-col">
        <heading className="mb-1 text-base font-bold">
          {!isLoading ? 'Screenshot Analysis Completed'
            : 'Screenshot Analysis In Progress'}
        </heading>
        {<p
          className={classNames('flex items-center text-xs', {
            'text-blue-500': !isLoading,
            'text-gray-500': isLoading,
            'cursor-pointer': !isLoading,
          })}
          onClick={handleSubtitleClick}>
          {!isLoading ? (<>View Demo <ArrowUpRight className='w-6 h-6 ml-2' /></>) : 'Please wait'}
        </p>}
      </div>
    </div>
    <section className="flex flex-col
    rounded-2xl border border-gray-200 bg-white
     divide-y divide-gray-200 mt-8 overflow-auto max-h-[300px]">
      {isLoading && PLACEHOLDER_CHECKS.map((item, key) => (
        <CompatibilityStep
          key={key}
          status={'pending'}
          title={titleCase(item)}
          description={null}
          icon={<Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />}
        />
      ))}
      {!isLoading && positionCheckResult
       && positionCheckResult.length > 0 && positionCheckResult.map((item, key) => (
        <CompatibilityStep
          key={key}
          status={item.is_valid ? 'completed' : 'error'}
          title={titleCase(item.check_type)}
          description={item.feedback}
          icon={item.is_valid ? <CircleCheck className='w-12 h-12 text-white fill-green-600' />
            : <AlertTriangle className='w-12 h-12 text-red-500' />}
        />
      ))}
    </section>
  </section>);
};

export default RealTimeCheckResult;
