import { livenessErrorReportFileName, livenessErrorReportText, parseLivenessDetail } from './livenessErrorReport';

describe('parseLivenessDetail', () => {
  it('keeps the error name, message and stack the liveness page sent', () => {
    expect(parseLivenessDetail({ name: 'OverconstrainedError', message: 'Invalid constraint', stack: 'at gUM' }))
      .toEqual({ name: 'OverconstrainedError', message: 'Invalid constraint', stack: 'at gUM' });
  });

  it('drops anything that is not a string and caps long fields', () => {
    const detail = parseLivenessDetail({ name: 42, message: 'm'.repeat(5000), stack: { evil: true } });
    expect(detail).toEqual({ name: '', message: 'm'.repeat(300), stack: '' });
  });

  it('returns nothing when there is no usable detail', () => {
    expect(parseLivenessDetail(undefined)).toBeUndefined();
    expect(parseLivenessDetail('oops')).toBeUndefined();
    expect(parseLivenessDetail({ name: '', message: '' })).toBeUndefined();
  });
});

describe('livenessErrorReportText', () => {
  const at = new Date('2026-11-19T10:00:00.000Z');

  it('lists what support needs to trace the failure', () => {
    const text = livenessErrorReportText({
      code: 'CAMERA_ACCESS_ERROR', message: 'We could not use your camera.', at,
      detail: { name: 'OverconstrainedError', message: 'Invalid constraint', stack: 'at gUM (Detector.js:1)' },
      userAgent: 'Safari/605.1.15 SEB/3.7.2', page: 'https://www.scaler.com/test/abc/instruction',
    });
    expect(text).toContain('Error code: CAMERA_ACCESS_ERROR');
    expect(text).toContain('Error: OverconstrainedError');
    expect(text).toContain('Message: Invalid constraint');
    expect(text).toContain('at gUM (Detector.js:1)');
    expect(text).toContain('Browser: Safari/605.1.15 SEB/3.7.2');
    expect(text).toContain('Time: 2026-11-19T10:00:00.000Z');
  });

  it('still produces a report when the page sent only a code', () => {
    expect(livenessErrorReportText({ code: 'SERVER_ERROR', at, userAgent: 'ua', page: 'p' })).toContain('Error code: SERVER_ERROR');
  });

  it('names the file by time so repeated downloads do not clash', () => {
    expect(livenessErrorReportFileName(at)).toBe('face-verification-error-2026-11-19T10-00-00-000Z.txt');
  });
});
