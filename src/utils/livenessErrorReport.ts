// The error behind a failed face check, as the proctoring liveness page reports it, turned into a file the
// candidate can download and attach to a support request. Code paths and browser details only.

export interface LivenessErrorDetail {
  name: string;
  message: string;
  stack: string;
}

const LIMITS: Record<keyof LivenessErrorDetail, number> = { name: 100, message: 300, stack: 2000 };

// The detail crosses a frame boundary, so only capped strings are kept.
export const parseLivenessDetail = (raw: unknown): LivenessErrorDetail | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const value = raw as Record<string, unknown>;
  const text = (key: keyof LivenessErrorDetail) => (typeof value[key] === 'string' ? (value[key] as string).slice(0, LIMITS[key]) : '');
  const detail = { name: text('name'), message: text('message'), stack: text('stack') };
  return detail.name || detail.message || detail.stack ? detail : undefined;
};

export interface LivenessErrorReport {
  code: string;
  message?: string;
  detail?: LivenessErrorDetail;
  at: Date;
  userAgent: string;
  page: string;
}

export const livenessErrorReportText = (report: LivenessErrorReport): string => [
  'Face verification error report',
  `Time: ${report.at.toISOString()}`,
  `Error code: ${report.code}`,
  `Shown to you: ${report.message ?? ''}`,
  `Page: ${report.page}`,
  `Browser: ${report.userAgent}`,
  '',
  `Error: ${report.detail?.name ?? ''}`,
  `Message: ${report.detail?.message ?? ''}`,
  'Stack:',
  report.detail?.stack ?? '',
].join('\n');

export const livenessErrorReportFileName = (at: Date) => `face-verification-error-${at.toISOString().replace(/[:.]/g, '-')}.txt`;
