import React from 'react';
import { AlertTriangle, CircleCheck } from 'lucide-react';

import LightBulb from '@/assets/images/light-bulb.svg';

// The design's illustrations and positioning clip are served by the proctoring web app, which
// shares its origin with the API (baseUrl), so they stay out of the proctor.js bundle.
export const identityMedia = (baseUrl: string, name: string): string => `${baseUrl}/identity-media/${name}`;

// The wizard's card: on errors the pink reason strip is pinned to its top, as on screen share.
export const IdentityCard = ({ banner, children }: { banner?: string; children: React.ReactNode }) => (
  <div className='mt-8 w-full'>
    {banner && (
      <div className='w-full bg-red-100 p-4 rounded-t-2xl flex items-center justify-center gap-2'>
        <AlertTriangle className='w-6 h-6 text-red-500' />
        <span className='text-red-700 text-sm'>{banner}</span>
      </div>
    )}
    <div className={`${banner ? 'rounded-b-lg' : 'rounded-2xl'} overflow-hidden shadow-[0px_0px_24px_0px_rgba(0,0,0,0.08)] bg-white p-8`}>
      {children}
    </div>
  </div>
);

export const CheckRows = ({ rows }: { rows: string[] }) => (
  <ul className='divide-y divide-base-100'>
    {rows.map((row) => (
      <li key={row} className='flex items-center gap-4 py-5'>
        <CircleCheck className='w-6 h-6 text-white fill-green-600' />
        <span className='text-base font-medium text-base-700'>{row}</span>
      </li>
    ))}
  </ul>
);

export const AttemptChip = ({ current, max }: { current: number; max: number }) => (
  <span className='inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-500'>
    Attempt {current} of {max}
  </span>
);

export const HelpLine = ({ onOpen }: { onOpen: () => void }) => (
  <p className='mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-base-700'>
    <img src={LightBulb} alt='' className='w-5 h-5' />
    Need help?
    <button type='button' className='text-scaler-500 underline' onClick={onOpen}>
      Click to view face verification guide
    </button>
  </p>
);
