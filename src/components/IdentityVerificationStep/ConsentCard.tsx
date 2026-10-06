import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { CONSENT_COPY, LIVENESS_TIPS, PHOTOSENSITIVITY_NOTE } from '@/utils/identityScreen';
import {
  GuideLink, IdentityCard, IllustrationPanel, InfoRow, Split,
} from './IdentityCard';

// S1: shown until the candidate agrees; nothing is captured before this. With liveness on, Start
// opens the check straight away, so its tips and the flashing-light warning are shown here.
const ConsentCard = ({ baseUrl, livenessOn, onOpenGuide }: { baseUrl: string; livenessOn: boolean; onOpenGuide: () => void }) => (
  <IdentityCard>
    <Split>
      <IllustrationPanel tone='info' baseUrl={baseUrl} />
      <div>
        <h3 className='text-xl font-bold text-base-700'>{CONSENT_COPY.title}</h3>
        <p className='mt-3 text-base leading-relaxed text-base-500'>{CONSENT_COPY.body}</p>
        {livenessOn ? (
          <>
            <ul className='mt-3 list-disc space-y-1 pl-5 text-base leading-relaxed text-base-500'>
              {LIVENESS_TIPS.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
            <p className='mt-4 flex items-start gap-2 rounded-md bg-scaler-100 px-4 py-3 text-sm text-base-700'>
              <AlertTriangle className='mt-0.5 h-[1.6rem] w-[1.6rem] shrink-0 text-scaler-500' />
              {PHOTOSENSITIVITY_NOTE}
            </p>
          </>
        ) : (
          <p className='mt-3 text-base leading-relaxed text-base-500'>{CONSENT_COPY.instructions}</p>
        )}
        <InfoRow label={CONSENT_COPY.retention} />
        <GuideLink onOpen={onOpenGuide} />
      </div>
    </Split>
  </IdentityCard>
);

export default ConsentCard;
