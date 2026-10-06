// Which DCP identity screen to show and its copy, derived from the proctoring service's status.
// Wording follows the DCP prototype; facts follow this system (Face Liveness, 90-day retention).
// Kept apart from the component so every state is unit tested.
import {
  IdentityPolicy, IdentityStatus, isLivenessOn, reasonMessage,
} from '@/utils/identityVerification';

// Names the consent copy below; the proctoring service records which version was agreed to.
export const CONSENT_VERSION = '2026-10-06';

export const CONSENT_COPY = {
  title: 'Let us check if it is really you',
  body: 'We will do a short live video check to make sure you are really there, then match your face with '
    + 'the photo on your Scaler record. This takes about 20 seconds.',
  instructions: 'Follow the instructions on your screen and keep your face in the oval until it finishes.',
  retention: 'Your scan is kept securely for exam records and deleted after 90 days.',
  checkbox: 'I agree to a face check.',
  declined: 'You need to agree to the face check to take this test. If you have questions, contact support.',
};

// Shown on the consent screen when the check is a liveness check, which starts right after Start.
export const LIVENESS_TIPS = [
  'Sit in a well-lit place, facing the light.',
  'Turn your screen brightness up.',
  'Keep your face inside the oval and hold still until it finishes.',
];
export const PHOTOSENSITIVITY_NOTE = 'The screen flashes different colours during the check. Take care if you are sensitive to flashing light.';

export const VERIFIED_CONFIRMATION = 'I confirm that I am the person taking this test. '
  + 'If this is not true, the exam team can cancel my test.';

export const CAPTURE_COPY = {
  waiting: 'Waiting for you to sit in front of the camera',
  ready: 'You are in frame. Start when ready.',
  running: 'Follow the instructions in the camera window.',
  pill: 'Put your face in the oval',
  caption: 'A short live check: keep your face in the oval while the screen changes colour.',
};

export type IdentityScreenState =
  | 'loading' | 'skip' | 'consent' | 'capture' | 'analysing' | 'verified' | 'captured'
  | 'attempt_failed' | 'blocked' | 'service_error';

export interface IdentityScreen {
  state: IdentityScreenState;
  // Heading icon and rail: error states show red in both, success green, the rest in progress.
  tone: 'pending' | 'completed' | 'error';
  title: string;
  body: string;
  // The pink strip at the top of the card, with the specific reason.
  banner: string;
  // "What to do" on a failed attempt.
  tip: string;
  bullets: string[];
  attemptsUsed: number | null;
  attemptsLeft: number | null;
  referenceId: string | null;
  canRetry: boolean;
  canProceed: boolean;
}

const isLiveness = (reason?: string | null) => Boolean(reason?.startsWith('liveness_')) && reason !== 'liveness_no_frame';
const isMismatch = (reason?: string | null) => reason === 'mismatch' || reason === 'attempts_exhausted';

// Specific to the cause, never generic.
export const failureBanner = (reason?: string | null): string => {
  if (isMismatch(reason)) return 'Face verification failed. Please try again in better light.';
  if (isLiveness(reason)) return 'We could not confirm you are really there. Please follow the instructions on screen.';
  const message = reasonMessage(reason);
  return message === reasonMessage(null) ? 'Your face was not fully visible. Please try again.' : message;
};

const failureDetail = (reason?: string | null): { body: string; tip: string } => {
  if (isMismatch(reason)) {
    return {
      body: 'Your photo did not match the photo we have for you.',
      tip: 'Sit where there is more light. Turn towards the light. Keep your whole face in the oval.',
    };
  }
  if (isLiveness(reason)) {
    return {
      body: 'We could not confirm a live person in front of the camera.',
      tip: 'Keep your face in the oval and hold still while the screen changes colour. Do not use a photo or a screen.',
    };
  }
  return {
    body: 'We could not see your face clearly.',
    tip: 'Face the camera in good light and keep your whole face in the oval.',
  };
};

const attempts = (status: IdentityStatus, policy?: IdentityPolicy | null) => {
  const max = policy?.max_attempts;
  if (!max || typeof status.attempts_remaining !== 'number') return { attemptsUsed: null, attemptsLeft: null };
  return { attemptsUsed: Math.max(max - status.attempts_remaining, 0), attemptsLeft: status.attempts_remaining };
};

const screen = (state: IdentityScreenState, fields: Partial<IdentityScreen> = {}): IdentityScreen => ({
  state,
  tone: 'pending',
  title: '',
  body: '',
  banner: '',
  tip: '',
  bullets: [],
  attemptsUsed: null,
  attemptsLeft: null,
  referenceId: null,
  canRetry: false,
  canProceed: false,
  ...fields,
});

// After consent, Start opens the liveness check straight away when the next screen is the camera.
export const startsLivenessAfterConsent = (
  status: IdentityStatus,
  policy?: IdentityPolicy | null,
): boolean => isLivenessOn(status) && identityScreen(status, policy).state === 'capture';

export const identityScreen = (
  status: IdentityStatus | null | undefined,
  policy?: IdentityPolicy | null,
): IdentityScreen => {
  if (!status) return screen('loading');
  if (status.status === 'not_required' || status.status === 'skipped') {
    return screen('skip', { tone: 'completed', title: 'Identity verification not needed', canProceed: true });
  }
  if (status.consent?.required && !status.consent.given) {
    return screen('consent', { title: CONSENT_COPY.title, body: CONSENT_COPY.body });
  }

  switch (status.status) {
    case 'pending':
      return screen('analysing', { title: 'Checking that it is you…' });
    case 'verified':
      return screen('verified', {
        tone: 'completed', title: 'Face scan complete', body: 'Your face matches the photo on your record.', canProceed: true,
      });
    case 'captured':
      // No reference photo yet: the check is recorded and matched later, so nothing is claimed as matched.
      return screen('captured', {
        tone: 'completed',
        title: 'Face scan complete',
        body: 'Your check is recorded. It will be matched with your Scaler record once your photo is on file.',
        canProceed: true,
      });
    case 'retry':
      return screen('attempt_failed', {
        tone: 'error',
        title: 'Face verification failed',
        ...failureDetail(status.reason),
        banner: failureBanner(status.reason),
        ...attempts(status, policy),
        canRetry: true,
        canProceed: status.allowed,
      });
    case 'failed':
      if (status.allowed) {
        return screen('attempt_failed', {
          tone: 'error', title: 'Face verification failed', ...failureDetail(status.reason), banner: failureBanner(status.reason), canProceed: true,
        });
      }
      return screen('blocked', {
        tone: 'error',
        title: 'We could not verify you',
        body: 'You cannot start the test now. Please contact support.',
        banner: 'We could not check it is you. You have no attempts left.',
        bullets: ['Contact support and quote your reference ID', 'Do not open the test again. Your attempts do not reset'],
        referenceId: status.reference_id ?? null,
      });
    case 'blocked':
      return screen('blocked', {
        tone: 'error',
        title: 'We could not verify you',
        body: 'There is no photo on your Scaler record to match. Please contact support.',
        banner: 'We could not check it is you.',
        bullets: ['Contact support and quote your reference ID'],
        referenceId: status.reference_id ?? null,
      });
    case 'engine_error':
      // Not the candidate's fault: no attempt used, and the template decides whether they may go on.
      return screen('service_error', {
        title: 'The face check is not working',
        body: 'This is not your mistake. You did not use an attempt. Please try again in a minute.',
        banner: 'The check is not working right now.',
        ...attempts(status, policy),
        canRetry: true,
        canProceed: status.allowed,
      });
    default:
      return screen('capture', { title: CONSENT_COPY.title, canProceed: status.allowed });
  }
};
