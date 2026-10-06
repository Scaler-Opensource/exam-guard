import {
  IdentityStatus,
  errorText,
  identityView,
  isIdentityStepWanted,
  pollDelayMs,
  reasonMessage,
} from '@/utils/identityVerification';

const status = (overrides: Partial<IdentityStatus>): IdentityStatus => ({
  mode: 'required', required: true, status: 'awaiting_capture', allowed: false, ...overrides,
});

describe('isIdentityStepWanted', () => {
  it('needs both the host opt-in and a template that verifies', () => {
    expect(isIdentityStepWanted(true, { mode: 'required', required: true })).toBe(true);
    expect(isIdentityStepWanted(true, { mode: 'advisory', required: false })).toBe(true);
    expect(isIdentityStepWanted(true, { mode: 'off', required: false })).toBe(false);
    expect(isIdentityStepWanted(false, { mode: 'required', required: true })).toBe(false);
    expect(isIdentityStepWanted(true, null)).toBe(false);
  });
});

describe('identityView', () => {
  it('shows a loader until the status is known', () => {
    expect(identityView(null)).toMatchObject({ phase: 'loading', canProceed: false });
  });

  it('skips when the template does not require it or there is no reference photo to skip on', () => {
    expect(identityView(status({ status: 'not_required', allowed: true }))).toMatchObject({ phase: 'skip', canProceed: true });
    expect(identityView(status({ status: 'skipped', allowed: true }))).toMatchObject({ phase: 'skip', canProceed: true });
  });

  it('asks for a capture before anything is submitted', () => {
    expect(identityView(status({ status: 'awaiting_capture' }))).toMatchObject({ phase: 'capture', tone: 'pending', canProceed: false });
  });

  it('explains why a retry is needed and how many attempts are left', () => {
    const view = identityView(status({
      status: 'retry', reason: 'too_dark', attempts_remaining: 2, captures_remaining: 1,
    }));

    expect(view).toMatchObject({ phase: 'capture', tone: 'error', canProceed: false });
    expect(view.message).toBe('The photo was too dark. Move to a brighter place or face a light source. 1 attempt left.');
  });

  it('lets advisory candidates continue without verifying', () => {
    expect(identityView(status({ mode: 'advisory', status: 'awaiting_capture', allowed: true }))).toMatchObject({ phase: 'capture', canProceed: true });
  });

  it('waits while a selfie is being verified', () => {
    expect(identityView(status({ status: 'pending' }))).toMatchObject({ phase: 'verifying', canProceed: false });
  });

  it('lets a verified candidate continue', () => {
    expect(identityView(status({ status: 'verified', allowed: true }))).toMatchObject({ phase: 'done', tone: 'completed', canProceed: true });
  });

  it('follows the policy on engine errors', () => {
    expect(identityView(status({ status: 'engine_error', reason: 'engine_throttled', allowed: true }))).toMatchObject({ phase: 'done', canProceed: true });
    expect(identityView(status({ status: 'engine_error', reason: 'engine_throttled', allowed: false }))).toMatchObject({ phase: 'capture', canProceed: false });
  });

  it('blocks a failed candidate in required mode and records it in advisory mode', () => {
    const required = identityView(status({ status: 'failed', reason: 'attempts_exhausted' }));
    expect(required).toMatchObject({ phase: 'blocked', canProceed: false });
    expect(required.message).toContain('contact your test administrator');

    const advisory = identityView(status({ mode: 'advisory', status: 'failed', reason: 'attempts_exhausted', allowed: true }));
    expect(advisory).toMatchObject({ phase: 'blocked', canProceed: true });
    expect(advisory.message).toContain('recorded for review');
  });

  it('blocks when there is no reference photo and the policy blocks', () => {
    const view = identityView(status({ status: 'blocked', reason: 'no_reference_image' }));
    expect(view).toMatchObject({ phase: 'blocked', canProceed: false });
    expect(view.message).toContain('No reference photo');
  });
});

describe('reasonMessage', () => {
  it('falls back for engine and unknown reasons', () => {
    expect(reasonMessage('engine_access_denied')).toBe('The verification service is unavailable right now.');
    expect(reasonMessage('something_new')).toBe('Please try again.');
    expect(reasonMessage(null)).toBe('Please try again.');
  });
});

describe('pollDelayMs', () => {
  it('honours retry_after within 1-5 seconds', () => {
    expect(pollDelayMs(status({ retry_after: 3 }))).toBe(3000);
    expect(pollDelayMs(status({ retry_after: 0 }))).toBe(1000);
    expect(pollDelayMs(status({ retry_after: 30 }))).toBe(5000);
    expect(pollDelayMs(status({ retry_after: null }))).toBe(2000);
  });
});

describe('errorText', () => {
  it('shows a specific message with the code support can look up', () => {
    expect(errorText('engine_unavailable')).toBe('The verification service is unavailable right now. Please try again in a moment. (Error code: engine_unavailable)');
  });

  it('explains the rejections the proctoring service can return', () => {
    ['already_verified', 'verification_in_progress', 'not_required', 'liveness_session_expired', 'service_unavailable'].forEach((code) => {
      expect(errorText(code)).not.toMatch(/^Please try again\./);
      expect(errorText(code)).toContain(`(Error code: ${code})`);
    });
  });

  it('prefers the message sent by the liveness page', () => {
    expect(errorText('FACE_DISTANCE_ERROR', 'Move a little further away.')).toBe('Move a little further away. (Error code: FACE_DISTANCE_ERROR)');
  });
});
