// Which DCP identity screen to show (PRD section 5) and its copy (section 7), derived from the
// proctoring service's status. Kept apart from the component so every state is unit tested.
import { IdentityPolicy, IdentityStatus, reasonMessage } from '@/utils/identityVerification';

// Names the consent copy below; the proctoring service records which version was agreed to.
export const CONSENT_VERSION = '2026-10-06';

export const CONSENT_COPY = {
  title: "Verify it's you",
  body: "We'll scan your face and match it with the photo on your Scaler record. This takes about 20 seconds.",
  retention: 'Your scan is stored securely for exam records and deleted after 90 days.',
  checkbox: 'I agree to a face scan for identity verification.',
};

export const VERIFIED_CONFIRMATION = 'By clicking, you confirm that the person taking this test is you. '
  + 'Misrepresentation may result in disqualification.';

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
  attempt: { current: number; max: number } | null;
  referenceId: string | null;
  canRetry: boolean;
  canProceed: boolean;
}

const FACE_NOT_VISIBLE = 'Your face was not fully visible.';

// Specific to the cause, never generic (acceptance criterion 6).
export const failureBanner = (reason?: string | null): string => {
  if (reason === 'mismatch' || reason === 'attempts_exhausted') {
    return "We couldn't match your face. Try again in better lighting.";
  }
  if (reason === 'liveness_no_frame') return FACE_NOT_VISIBLE;
  if (reason?.startsWith('liveness_')) return "We couldn't confirm a live person. Follow the on-screen prompts.";
  const message = reasonMessage(reason);
  return message === reasonMessage(null) ? FACE_NOT_VISIBLE : message;
};

const attemptChip = (status: IdentityStatus, policy?: IdentityPolicy | null) => {
  const max = policy?.max_attempts;
  if (!max || typeof status.attempts_remaining !== 'number') return null;
  return { current: Math.min(max - status.attempts_remaining + 1, max), max };
};

const screen = (state: IdentityScreenState, fields: Partial<IdentityScreen> = {}): IdentityScreen => ({
  state,
  tone: 'pending',
  title: '',
  body: '',
  banner: '',
  attempt: null,
  referenceId: null,
  canRetry: false,
  canProceed: false,
  ...fields,
});

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

  const blocked = {
    tone: 'error' as const,
    title: "We couldn't verify your identity",
    referenceId: status.reference_id ?? null,
  };
  switch (status.status) {
    case 'pending':
      return screen('analysing', { title: 'Verifying your identity...' });
    case 'verified':
      return screen('verified', { tone: 'completed', title: 'Identity verified', canProceed: true });
    case 'captured':
      // No reference photo yet: the check is recorded and matched later, so nothing is claimed as matched.
      return screen('captured', {
        tone: 'completed',
        title: 'Check complete',
        body: "Your check is recorded. It will be matched with your Scaler record once your photo is on file.",
        canProceed: true,
      });
    case 'retry':
      return screen('attempt_failed', {
        tone: 'error',
        title: "Let's try that again",
        banner: failureBanner(status.reason),
        attempt: attemptChip(status, policy),
        canRetry: true,
        canProceed: status.allowed,
      });
    case 'failed':
      if (status.allowed) {
        return screen('attempt_failed', { tone: 'error', title: 'Verification did not pass', banner: failureBanner(status.reason), canProceed: true });
      }
      return screen('blocked', {
        ...blocked,
        body: "You can't start the test right now. Contact support and quote this reference ID.",
        banner: failureBanner(status.reason),
      });
    case 'blocked':
      return screen('blocked', {
        ...blocked,
        body: 'No photo is on your Scaler record to match against. Contact support and quote this reference ID.',
      });
    case 'engine_error':
      // Not the candidate's fault: no attempt used, and the template decides whether they may go on.
      return screen('service_error', {
        title: 'Verification is temporarily unavailable',
        body: "This isn't your fault and no attempt has been used. Try again in a moment.",
        canRetry: true,
        canProceed: status.allowed,
      });
    default:
      return screen('capture', {
        title: CONSENT_COPY.title,
        body: 'Keep your face inside the oval and follow the prompts.',
        canProceed: status.allowed,
      });
  }
};
