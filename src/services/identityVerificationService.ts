// Candidate-side client for pre-test identity verification against the proctoring service. All
// calls authenticate with the session token from the host's init endpoint.
//
//   1. POST {baseUrl}/api/v1/proctoring/assets/ppd          presigned S3 POST (record_type=identity)
//   2. POST https://{bucket}.{s3_region_endpoint}/           upload the selfie
//   3. POST {baseUrl}/api/v1/proctoring/identity/verifications  submit it -> 202, status pending
//   4. GET  {baseUrl}/api/v1/proctoring/identity/status      poll until it settles
import { IdentityStatus } from '@/utils/identityVerification';

export class IdentityApiError extends Error {
  status: number;

  identity: IdentityStatus | null;

  constructor(code: string, status: number, identity: IdentityStatus | null = null) {
    super(code);
    this.name = 'IdentityApiError';
    this.status = status;
    this.identity = identity;
  }
}

interface Session {
  baseUrl: string;
  token: string;
}

const request = async (
  url: string,
  { token, method = 'GET', body }: { token: string; method?: string; body?: unknown },
) => {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Session-Token': token },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new IdentityApiError(data?.error || 'request_failed', response.status, data?.identity ?? null);
  }
  return data;
};

export const fetchIdentityStatus = async ({ baseUrl, token }: Session): Promise<IdentityStatus> => {
  const data = await request(`${baseUrl}/api/v1/proctoring/identity/status`, { token });
  return data.identity;
};

export const uploadSelfie = async ({
  baseUrl, token, image, fileName,
}: Session & { image: Blob; fileName: string }): Promise<void> => {
  const fileType = image.type || 'image/jpeg';
  const { signed_s3_post: post } = await request(`${baseUrl}/api/v1/proctoring/assets/ppd`, {
    token,
    method: 'POST',
    body: { record_type: 'identity', file_name: fileName, file_type: fileType },
  });

  // S3 requires `file` to be the last field.
  const form = new FormData();
  form.append('key', post.key);
  form.append('acl', post.acl);
  form.append('x-amz-algorithm', post.x_amz_algorithm);
  form.append('x-amz-credential', post.x_amz_credential);
  form.append('x-amz-date', post.x_amz_date);
  form.append('x-amz-signature', post.x_amz_signature);
  form.append('policy', post.policy);
  form.append('Content-Type', fileType);
  form.append('file', image, fileName);

  const response = await fetch(`https://${post.bucket_name}.${post.s3_region_endpoint}/`, {
    method: 'POST',
    body: form,
  });
  if (!response.ok) throw new IdentityApiError('upload_failed', response.status);
};

export const submitSelfie = async ({
  baseUrl, token, fileName, idempotencyKey,
}: Session & { fileName: string; idempotencyKey: string }): Promise<IdentityStatus> => {
  const data = await request(`${baseUrl}/api/v1/proctoring/identity/verifications`, {
    token,
    method: 'POST',
    body: { file_name: fileName, idempotency_key: idempotencyKey },
  });
  return data.identity;
};

const newIdempotencyKey = (): string => (
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
);

// Uploads a selfie and submits it for verification, returning the session's identity status.
// A rejected submission (already verified, one in progress, attempts exhausted) still carries
// the current status, which is what the step should render.
export const verifySelfie = async ({
  baseUrl, token, image, now = Date.now(), idempotencyKey = newIdempotencyKey(),
}: Session & { image: Blob; now?: number; idempotencyKey?: string }): Promise<IdentityStatus> => {
  const fileName = `identity_${now}.jpeg`;
  await uploadSelfie({
    baseUrl, token, image, fileName,
  });
  try {
    return await submitSelfie({
      baseUrl, token, fileName, idempotencyKey,
    });
  } catch (error) {
    if (error instanceof IdentityApiError && error.identity) return error.identity;
    throw error;
  }
};
