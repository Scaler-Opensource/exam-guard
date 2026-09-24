import {
  IdentityApiError,
  fetchIdentityStatus,
  verifySelfie,
} from '@/services/identityVerificationService';

const BASE_URL = 'http://proctoring.test';
const TOKEN = 'session-token';

const json = (body: unknown, status = 200) => Promise.resolve(
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
);

const SIGNED_POST = {
  bucket_name: 'proctoring-bucket',
  s3_region_endpoint: 's3.ap-south-1.amazonaws.com',
  x_amz_algorithm: 'AWS4-HMAC-SHA256',
  x_amz_credential: 'AKIA/20260924/ap-south-1/s3/aws4_request',
  x_amz_date: '20260924T100000Z',
  x_amz_signature: 'sig',
  policy: 'policy',
  acl: 'private',
  key: 'development/1/test_sessions/2/identity/identity_1000.jpeg',
};

describe('identityVerificationService', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  it('fetches the session status with the session token', async () => {
    fetchMock.mockReturnValueOnce(json({ success: true, identity: { status: 'awaiting_capture' } }));

    await expect(fetchIdentityStatus({ baseUrl: BASE_URL, token: TOKEN })).resolves.toEqual({ status: 'awaiting_capture' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/api/v1/proctoring/identity/status`);
    expect(init.headers['X-Session-Token']).toBe(TOKEN);
  });

  it('uploads the selfie to S3 under the identity prefix, then submits it', async () => {
    fetchMock
      .mockReturnValueOnce(json({ signed_s3_post: SIGNED_POST }))
      .mockReturnValueOnce(Promise.resolve(new Response(null, { status: 204 })))
      .mockReturnValueOnce(json({ success: true, identity: { status: 'pending', retry_after: 1 } }, 202));

    const identity = await verifySelfie({
      baseUrl: BASE_URL, token: TOKEN, image: new Blob(['x'], { type: 'image/jpeg' }), now: 1000, idempotencyKey: 'key-1',
    });

    expect(identity).toEqual({ status: 'pending', retry_after: 1 });

    const [ppdUrl, ppdInit] = fetchMock.mock.calls[0];
    expect(ppdUrl).toBe(`${BASE_URL}/api/v1/proctoring/assets/ppd`);
    expect(JSON.parse(ppdInit.body)).toEqual({ record_type: 'identity', file_name: 'identity_1000.jpeg', file_type: 'image/jpeg' });

    const [s3Url, s3Init] = fetchMock.mock.calls[1];
    expect(s3Url).toBe('https://proctoring-bucket.s3.ap-south-1.amazonaws.com/');
    const fields = Array.from((s3Init.body as FormData).keys());
    expect(fields[fields.length - 1]).toBe('file');
    expect((s3Init.body as FormData).get('key')).toBe(SIGNED_POST.key);

    const [submitUrl, submitInit] = fetchMock.mock.calls[2];
    expect(submitUrl).toBe(`${BASE_URL}/api/v1/proctoring/identity/verifications`);
    expect(JSON.parse(submitInit.body)).toEqual({ file_name: 'identity_1000.jpeg', idempotency_key: 'key-1' });
  });

  it('does not submit when the S3 upload fails', async () => {
    fetchMock
      .mockReturnValueOnce(json({ signed_s3_post: SIGNED_POST }))
      .mockReturnValueOnce(Promise.resolve(new Response('denied', { status: 403 })));

    await expect(verifySelfie({ baseUrl: BASE_URL, token: TOKEN, image: new Blob(['x']) }))
      .rejects.toMatchObject({ message: 'upload_failed', status: 403 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns the current status when the submission is rejected with one', async () => {
    fetchMock
      .mockReturnValueOnce(json({ signed_s3_post: SIGNED_POST }))
      .mockReturnValueOnce(Promise.resolve(new Response(null, { status: 204 })))
      .mockReturnValueOnce(json({ success: false, error: 'already_verified', identity: { status: 'verified' } }, 409));

    await expect(verifySelfie({ baseUrl: BASE_URL, token: TOKEN, image: new Blob(['x']) }))
      .resolves.toEqual({ status: 'verified' });
  });

  it('raises API errors with the server error code', async () => {
    fetchMock.mockReturnValueOnce(json({}, 403));

    const error = await fetchIdentityStatus({ baseUrl: BASE_URL, token: TOKEN }).catch((e) => e);
    expect(error).toBeInstanceOf(IdentityApiError);
    expect(error).toMatchObject({ message: 'request_failed', status: 403 });
  });
});
