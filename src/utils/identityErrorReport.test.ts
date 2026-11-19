import { identityErrorReportFileName, identityErrorReportText, parseErrorDetail } from './identityErrorReport';

const env = { userAgent: 'Safari/605.1.15 SEB/3.7.2', page: 'https://www.scaler.com/test/abc/instruction' };
const at = new Date('2026-11-19T10:00:00.000Z');

describe('parseErrorDetail', () => {
  it('keeps the error name, message and stack', () => {
    expect(parseErrorDetail({ name: 'OverconstrainedError', message: 'Invalid constraint', stack: 'at gUM' }))
      .toEqual({ name: 'OverconstrainedError', message: 'Invalid constraint', stack: 'at gUM' });
  });

  it('reads a browser error object', () => {
    const error = Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' });
    expect(parseErrorDetail(error)).toMatchObject({ name: 'NotAllowedError', message: 'Permission denied' });
  });

  it('drops anything that is not a string and caps long fields', () => {
    expect(parseErrorDetail({ name: 42, message: 'm'.repeat(5000), stack: { evil: true } })).toEqual({ name: '', message: 'm'.repeat(300), stack: '' });
  });

  it('returns nothing when there is no usable detail', () => {
    expect(parseErrorDetail(undefined)).toBeUndefined();
    expect(parseErrorDetail('oops')).toBeUndefined();
    expect(parseErrorDetail({ name: '', message: '' })).toBeUndefined();
  });
});

describe('identityErrorReportText', () => {
  it('reports a liveness failure with the error behind it', () => {
    const text = identityErrorReportText({
      stage: 'liveness',
      code: 'CAMERA_ACCESS_ERROR',
      message: 'We could not use your camera.',
      detail: { name: 'OverconstrainedError', message: 'Invalid constraint', stack: 'at gUM (Detector.js:1)' },
      at,
    }, env);
    expect(text).toContain('Stage: Liveness check');
    expect(text).toContain('Error code: CAMERA_ACCESS_ERROR');
    expect(text).toContain('Error: OverconstrainedError');
    expect(text).toContain('at gUM (Detector.js:1)');
    expect(text).toContain('Browser: Safari/605.1.15 SEB/3.7.2');
    expect(text).toContain('Time: 2026-11-19T10:00:00.000Z');
  });

  it('reports a face match the service rejected, with its reference ID', () => {
    const text = identityErrorReportText({
      stage: 'face_match', code: 'mismatch:mismatch', message: 'Face verification failed', referenceId: 'DCP-EHNVXE', at,
    }, env);
    expect(text).toContain('Stage: Face match');
    expect(text).toContain('Error code: mismatch:mismatch');
    expect(text).toContain('Reference ID: DCP-EHNVXE');
  });

  it('names the file by time so repeated downloads do not clash', () => {
    expect(identityErrorReportFileName(at)).toBe('face-verification-error-2026-11-19T10-00-00-000Z.txt');
  });
});
