// Presentation rules for the pre-test identity verification step, kept out of the component so
// they can be unit tested. Statuses and reasons mirror the proctoring service
// (Identity::PreTestStatus, Identity::FrameUsabilityCheck, Identity::PreTestVerifier).

export type IdentityMode = 'off' | 'advisory' | 'required';

// The policy returned with the session token by the host's init endpoint.
export interface IdentityPolicy {
  mode: IdentityMode;
  required: boolean;
  max_attempts?: number;
  max_captures?: number;
  liveness?: { mode: IdentityMode; required: boolean };
  camera_integrity?: { mode: IdentityMode };
  verification_window_minutes?: number;
}

// GET /api/v1/proctoring/identity/status
export interface IdentityStatus {
  mode: IdentityMode;
  required: boolean;
  status: string;
  allowed: boolean;
  reason?: string | null;
  verification_id?: number | null;
  verified_at?: string | null;
  attempts_remaining?: number | null;
  captures_remaining?: number | null;
  retry_after?: number | null;
  liveness?: { mode: IdentityMode; status?: string | null } | null;
  consent?: { required: boolean; given: boolean; version: string } | null;
  // Set when the candidate is blocked: what they quote to support.
  reference_id?: string | null;
}

const REASON_MESSAGES: Record<string, string> = {
  no_face: "We couldn't find a face. Sit facing the camera with your whole face in the frame.",
  multiple_faces: 'More than one face is visible. Make sure only you are in the frame.',
  low_confidence: 'Your face was not clear enough. Face the camera in good light.',
  blurry: 'The photo was blurry. Hold still and try again.',
  too_dark: 'The photo was too dark. Move to a brighter place or face a light source.',
  turned_away: 'Look straight at the camera and try again.',
  mismatch: "The photo didn't match your reference photo. Remove anything covering your face and try again.",
  upload_missing: "Your photo didn't upload. Check your connection and try again.",
  no_reference_image: 'No reference photo is on file for you.',
  attempts_exhausted: 'Your photos did not match your reference photo.',
  captures_exhausted: 'You have used all your verification attempts.',
  engine_timeout: 'Verification is taking longer than expected.',
  liveness_failed: "We couldn't confirm a live person in front of the camera. Face the camera in good light and try again.",
  liveness_expired: "The liveness check didn't finish in time. Try again.",
  liveness_incomplete: "The liveness check didn't finish. Try again.",
  liveness_no_frame: "The liveness check couldn't capture your face. Face the camera and try again.",
  engine_capacity: 'Many candidates are verifying right now. Please try again in a moment.',
  engine_throttled: 'Many candidates are verifying right now. Please try again in a moment.',
  unreadable_image: "We couldn't read the photo from your camera. Please try again.",
  virtual_camera: 'A virtual camera is selected. Choose your physical webcam to continue.',
  liveness_in_progress: 'Another liveness check is already running for this test. Close it and try again.',
  liveness_not_enabled: 'This test does not use the liveness check.',
  engine_unavailable: 'The verification service is unavailable right now. Please try again in a moment.',
  unknown_liveness_session: 'This check expired. Start it again.',
  liveness_session_expired: 'This check expired. Start a new one.',
  already_verified: 'You are already verified for this test.',
  already_captured: 'Your check is already recorded for this test.',
  verification_in_progress: 'Your previous check is still being verified. Please wait for the result.',
  not_required: 'This test does not need identity verification.',
  consent_required: 'Agree to the face scan to continue.',
  consent_version_outdated: 'The consent text has changed. Reload the page and agree again.',
  service_unavailable: 'The verification service is unavailable right now.',
  request_failed: 'The request failed. Check your connection and try again.',
  upload_failed: "Your photo didn't upload. Check your connection and try again.",
};

// A candidate-facing message with the code support can match to the server logs.
export const errorText = (code: string, message?: string): string => (
  `${message || reasonMessage(code)} (Error code: ${code})`
);

export const isLivenessOn = (status: IdentityStatus | null | undefined): boolean => (
  Boolean(status?.liveness) && status!.liveness!.mode !== 'off'
);

export const reasonMessage = (reason?: string | null): string => {
  if (reason && REASON_MESSAGES[reason]) return REASON_MESSAGES[reason];
  if (reason?.startsWith('engine_')) return 'The verification service is unavailable right now.';
  return 'Please try again.';
};

// The host opts in per instance; the step only appears when the template also verifies.
export const isIdentityStepWanted = (
  hostEnabled: boolean | undefined,
  policy: IdentityPolicy | null | undefined,
): boolean => Boolean(hostEnabled) && Boolean(policy) && policy!.mode !== 'off';

const MIN_POLL_SECONDS = 1;
const MAX_POLL_SECONDS = 5;
const DEFAULT_POLL_SECONDS = 2;

// Milliseconds to wait before polling again, honouring the server's retry_after.
export const pollDelayMs = (status: IdentityStatus | null | undefined): number => {
  const seconds = status?.retry_after ?? DEFAULT_POLL_SECONDS;
  return Math.min(Math.max(seconds, MIN_POLL_SECONDS), MAX_POLL_SECONDS) * 1000;
};
