// The proctoring snapshot stream is kept open and reused; it may only be reused for the camera that
// was asked for, or switching cameras would leave snapshots on the old one.
export const isOnDevice = (stream: MediaStream | null, deviceId?: string | null): boolean => {
  if (!stream) return false;
  if (!deviceId) return true;
  return stream.getVideoTracks()[0]?.getSettings().deviceId === deviceId;
};
