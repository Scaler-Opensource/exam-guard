import { isOnDevice } from './webcamStream';

const streamOn = (deviceId?: string) => ({
  getVideoTracks: () => [{ getSettings: () => ({ deviceId }) }],
}) as unknown as MediaStream;

describe('isOnDevice', () => {
  it('reuses the open stream when no camera is requested', () => {
    expect(isOnDevice(streamOn('cam-a'), '')).toBe(true);
  });

  it('reuses the open stream for the same camera', () => {
    expect(isOnDevice(streamOn('cam-a'), 'cam-a')).toBe(true);
  });

  it('does not reuse it after the candidate picks another camera', () => {
    expect(isOnDevice(streamOn('cam-a'), 'cam-b')).toBe(false);
  });

  it('has nothing to reuse without a stream', () => {
    expect(isOnDevice(null, 'cam-a')).toBe(false);
  });
});
