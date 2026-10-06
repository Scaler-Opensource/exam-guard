import { IdentityStatus } from '@/utils/identityVerification';
import { failureBanner, identityScreen, startsLivenessAfterConsent } from '@/utils/identityScreen';

const consented = { required: true, given: true, version: '2026-10-06' };
const status = (overrides: Partial<IdentityStatus>): IdentityStatus => ({
  mode: 'required', required: true, status: 'awaiting_capture', allowed: false, consent: consented, ...overrides,
});
const policy = { mode: 'required' as const, required: true, max_attempts: 3 };

describe('identityScreen', () => {
  it('waits for the status, and skips when the template does not verify', () => {
    expect(identityScreen(null).state).toBe('loading');
    expect(identityScreen(status({ status: 'not_required', allowed: true }))).toMatchObject({ state: 'skip', canProceed: true });
  });

  it('asks for consent before anything else', () => {
    const s = identityScreen(status({ consent: { required: true, given: false, version: '2026-10-06' } }));
    expect(s).toMatchObject({ state: 'consent', title: 'Let us check if it is really you', canProceed: false });
  });

  it('captures, then checks, then shows the scan as complete', () => {
    expect(identityScreen(status({})).state).toBe('capture');
    expect(identityScreen(status({ status: 'pending' }))).toMatchObject({ state: 'analysing', title: 'Checking that it is you…' });
    expect(identityScreen(status({ status: 'verified', allowed: true }))).toMatchObject({
      state: 'verified', tone: 'completed', title: 'Face scan complete', body: 'Your face matches the photo on your record.', canProceed: true,
    });
  });

  it('completes without claiming a match when there was no reference photo to match', () => {
    const s = identityScreen(status({ status: 'captured', allowed: true, reason: 'no_reference_image' }));
    expect(s).toMatchObject({ state: 'captured', tone: 'completed', title: 'Face scan complete', canProceed: true });
    expect(s.body).toMatch(/matched with your Scaler record once/);
  });

  it('explains a failed attempt, what to do, and how many attempts are left', () => {
    const s = identityScreen(status({ status: 'retry', reason: 'mismatch', attempts_remaining: 2 }), policy);
    expect(s).toMatchObject({
      state: 'attempt_failed', tone: 'error', canRetry: true, attemptsLeft: 2, attemptsUsed: 1,
      banner: 'Face verification failed. Please try again in better light.',
      body: 'Your photo did not match the photo we have for you.',
    });
    expect(s.tip).toMatch(/more light/);
  });

  it('tells a failed liveness check apart from a face mismatch', () => {
    const s = identityScreen(status({ status: 'retry', reason: 'liveness_failed', attempts_remaining: 2 }), policy);
    expect(s.body).toBe('We could not confirm a live person in front of the camera.');
    expect(s.tip).toMatch(/Do not use a photo or a screen/);
  });

  it('blocks with a reference ID and next steps once attempts run out', () => {
    const s = identityScreen(status({ status: 'failed', reason: 'attempts_exhausted', reference_id: 'DCP-8F2K41' }), policy);
    expect(s).toMatchObject({ state: 'blocked', tone: 'error', referenceId: 'DCP-8F2K41', canRetry: false, canProceed: false });
    expect(s.bullets).toContain('Do not open the test again. Your attempts do not reset');
  });

  it('lets a candidate continue after failing when the template allows it', () => {
    expect(identityScreen(status({ status: 'failed', allowed: true, reason: 'attempts_exhausted' }))).toMatchObject({ state: 'attempt_failed', canProceed: true, canRetry: false });
  });

  it('treats an outage as the service failing, not the candidate', () => {
    const blocked = identityScreen(status({ status: 'engine_error', reason: 'engine_unavailable', attempts_remaining: 3 }), policy);
    expect(blocked).toMatchObject({ state: 'service_error', tone: 'pending', canRetry: true, canProceed: false, attemptsUsed: 0 });
    expect(blocked.body).toMatch(/not your mistake/);
    expect(identityScreen(status({ status: 'engine_error', allowed: true })).canProceed).toBe(true);
  });
});

describe('startsLivenessAfterConsent', () => {
  const liveness = { mode: 'required' as const };

  it('opens the liveness check straight after consent, without another click', () => {
    expect(startsLivenessAfterConsent(status({ liveness } as Partial<IdentityStatus>), policy)).toBe(true);
  });

  it('waits on the selfie path, where the candidate captures from the preview', () => {
    expect(startsLivenessAfterConsent(status({}), policy)).toBe(false);
  });

  it('does not start when consent leads somewhere other than the camera', () => {
    expect(startsLivenessAfterConsent(status({ liveness, status: 'verified', allowed: true } as Partial<IdentityStatus>), policy)).toBe(false);
    expect(startsLivenessAfterConsent(status({ liveness, status: 'failed', allowed: false } as Partial<IdentityStatus>), policy)).toBe(false);
  });
});

describe('failureBanner', () => {
  it('names the cause, never a generic error', () => {
    expect(failureBanner('liveness_failed')).toBe('We could not confirm you are really there. Please follow the instructions on screen.');
    expect(failureBanner('liveness_no_frame')).toMatch(/couldn't capture your face/);
    expect(failureBanner('too_dark')).toMatch(/too dark/);
    expect(failureBanner('something_new')).toBe('Your face was not fully visible. Please try again.');
  });
});
