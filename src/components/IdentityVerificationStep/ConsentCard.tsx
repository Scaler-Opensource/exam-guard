import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { CONSENT_COPY } from '@/utils/identityScreen';
import { IdentityCard, identityMedia } from './IdentityCard';

// S1: shown until the candidate agrees; nothing is captured before this.
const ConsentCard = ({
  baseUrl, busy, onAccept,
}: { baseUrl: string; busy: boolean; onAccept: () => void }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <IdentityCard>
      <div className='flex gap-12 items-center'>
        <img src={identityMedia(baseUrl, 'illus-hero.jpg')} alt='' className='w-72 object-contain' />
        <div className='flex-1'>
          <h3 className='text-xl font-bold text-base-700'>{CONSENT_COPY.title}</h3>
          <p className='mt-3 text-base text-base-500'>{CONSENT_COPY.body}</p>
          <p className='mt-3 text-sm text-base-500'>{CONSENT_COPY.retention}</p>
          <label className='mt-6 flex items-center gap-3 text-sm text-base-500 cursor-pointer'>
            <Checkbox checked={agreed} onCheckedChange={(value) => setAgreed(value === true)} />
            {CONSENT_COPY.checkbox}
          </label>
          <Button variant='primary' size='lg' className='mt-6 items-center gap-3' disabled={!agreed || busy} onClick={onAccept}>
            Start verification
            <ArrowRight className='w-6 h-6' />
          </Button>
        </div>
      </div>
    </IdentityCard>
  );
};

export default ConsentCard;
