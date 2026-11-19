// What went wrong in the identity step, as a file the candidate can download and attach to a support request:
// a failed liveness check, a face match the service rejected, or the camera or upload failing on this device.
// Code paths, codes and browser details only; no images or tokens.

export interface ErrorDetail {
  name: string;
  message: string;
  stack: string;
}

export type FailureStage = 'liveness' | 'face_match' | 'camera' | 'upload' | 'request';

export interface IdentityFailure {
  stage: FailureStage;
  code: string;
  message?: string;
  detail?: ErrorDetail;
  referenceId?: string | null;
  at: Date;
}

const LIMITS: Record<keyof ErrorDetail, number> = { name: 100, message: 300, stack: 2000 };

// Capped strings only: the liveness page's detail crosses a frame boundary, and errors can be huge.
export const parseErrorDetail = (raw: unknown): ErrorDetail | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const value = raw as Record<string, unknown>;
  const text = (key: keyof ErrorDetail) => (typeof value[key] === 'string' ? (value[key] as string).slice(0, LIMITS[key]) : '');
  const detail = { name: text('name'), message: text('message'), stack: text('stack') };
  return detail.name || detail.message || detail.stack ? detail : undefined;
};

export const STAGE_LABEL: Record<FailureStage, string> = {
  liveness: 'Liveness check',
  face_match: 'Face match',
  camera: 'Camera',
  upload: 'Photo upload',
  request: 'Identity service request',
};

export const identityErrorReportText = (failure: IdentityFailure, env: { userAgent: string; page: string }): string => [
  'Face verification error report',
  `Time: ${failure.at.toISOString()}`,
  `Stage: ${STAGE_LABEL[failure.stage]}`,
  `Error code: ${failure.code}`,
  `Shown to you: ${failure.message ?? ''}`,
  `Reference ID: ${failure.referenceId ?? ''}`,
  `Page: ${env.page}`,
  `Browser: ${env.userAgent}`,
  '',
  `Error: ${failure.detail?.name ?? ''}`,
  `Message: ${failure.detail?.message ?? ''}`,
  'Stack:',
  failure.detail?.stack ?? '',
].join('\n');

export const identityErrorReportFileName = (at: Date) => `face-verification-error-${at.toISOString().replace(/[:.]/g, '-')}.txt`;
