import {
  IdentityStatus,
  errorText,
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

describe('reasonMessage', () => {
  it('falls back for engine and unknown reasons', () => {
    expect(reasonMessage('engine_access_denied')).toBe('The verification service is unavailable right now.');
    expect(reasonMessage('something_new')).toBe('Please try again.');
    expect(reasonMessage(null)).toBe('Please try again.');
    expect(reasonMessage('engine_throttled')).toMatch(/Many candidates are verifying/);
    expect(reasonMessage('engine_misconfigured')).toBe('The verification service is unavailable right now.');
    expect(reasonMessage('no_face')).toMatch(/couldn't find a face/);
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
