import React from 'react';

import { CONSENT_COPY } from '@/utils/identityScreen';
import {
  GuideLink, IdentityCard, IllustrationPanel, InfoRow, Split,
} from './IdentityCard';

// S1: shown until the candidate agrees; nothing is captured before this. The agreement checkbox
// and the buttons sit under the card, like every other wizard step.
const ConsentCard = ({ baseUrl, onOpenGuide }: { baseUrl: string; onOpenGuide: () => void }) => (
  <IdentityCard>
    <Split>
      <IllustrationPanel tone='info' baseUrl={baseUrl} />
      <div>
        <h3 className='text-xl font-bold text-base-700'>{CONSENT_COPY.title}</h3>
        <p className='mt-3 text-base leading-relaxed text-base-500'>{CONSENT_COPY.body}</p>
        <p className='mt-3 text-base leading-relaxed text-base-500'>{CONSENT_COPY.instructions}</p>
        <InfoRow label={CONSENT_COPY.retention} />
        <GuideLink onOpen={onOpenGuide} />
      </div>
    </Split>
  </IdentityCard>
);

export default ConsentCard;
