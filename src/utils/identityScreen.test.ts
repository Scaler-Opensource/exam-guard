import { IdentityStatus } from '@/utils/identityVerification';
import { failureBanner, identityScreen } from '@/utils/identityScreen';

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

  it('asks for consent before anything else (S1)', () => {
    const s = identityScreen(status({ consent: { required: true, given: false, version: '2026-10-06' } }));
    expect(s).toMatchObject({ state: 'consent', title: "Verify it's you", canProceed: false });
  });

  it('captures, then analyses, then shows the verified screen (S2-S5)', () => {
    expect(identityScreen(status({})).state).toBe('capture');
    expect(identityScreen(status({ status: 'pending' }))).toMatchObject({ state: 'analysing', title: 'Verifying your identity...' });
    expect(identityScreen(status({ status: 'verified', allowed: true }))).toMatchObject({ state: 'verified', tone: 'completed', canProceed: true });
  });

  it('shows the specific reason and the next attempt after a failure (S6)', () => {
    const s = identityScreen(status({ status: 'retry', reason: 'mismatch', attempts_remaining: 2 }), policy);
    expect(s).toMatchObject({
      state: 'attempt_failed', tone: 'error', canRetry: true, attempt: { current: 2, max: 3 },
      banner: "We couldn't match your face. Try again in better lighting.",
    });
  });

  it('blocks with a reference ID once attempts run out in required mode (S11)', () => {
    const s = identityScreen(status({ status: 'failed', reason: 'attempts_exhausted', reference_id: 'DCP-8F2K41' }), policy);
    expect(s).toMatchObject({ state: 'blocked', tone: 'error', referenceId: 'DCP-8F2K41', canRetry: false, canProceed: false });
  });

  it('lets an advisory candidate continue after failing, without blocking', () => {
    expect(identityScreen(status({ status: 'failed', allowed: true, reason: 'attempts_exhausted' }))).toMatchObject({ state: 'attempt_failed', canProceed: true, canRetry: false });
  });

  it('treats an outage as the service failing, not the candidate (S12)', () => {
    const blocked = identityScreen(status({ status: 'engine_error', reason: 'engine_unavailable' }));
    expect(blocked).toMatchObject({ state: 'service_error', tone: 'pending', canRetry: true, canProceed: false });
    expect(identityScreen(status({ status: 'engine_error', allowed: true })).canProceed).toBe(true);
  });
});

describe('failureBanner', () => {
  it('names the cause, never a generic error', () => {
    expect(failureBanner('liveness_failed')).toBe("We couldn't confirm a live person. Follow the on-screen prompts.");
    expect(failureBanner('liveness_no_frame')).toBe('Your face was not fully visible.');
    expect(failureBanner('too_dark')).toMatch(/too dark/);
    expect(failureBanner('something_new')).toBe('Your face was not fully visible.');
  });
});
