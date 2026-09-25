import React from 'react';

import Logo from '@/assets/images/logo.svg';
import { useAppSelector } from '@/hooks/reduxhooks';

export default function CompatibilityModalHeader() {
  const assessmentInfo = useAppSelector((state) => state.assessmentInfo);

  return (
    <div>
      <img src={Logo} alt='Scaler Logo' className='h-6' />
      <div className='mt-12'>
        <p className='text-base-200 text-base'>
          Hi {assessmentInfo?.userName}!
        </p>
        <h1 className='text-2xl font-bold mt-1'>
          {assessmentInfo?.assessmentName}
        </h1>
      </div>
    </div>
  );
}
