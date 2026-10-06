// Camera integrity signals collected before the identity step. They are hints for the proctoring
// service, which records them and decides: a modified browser can hide all of them.

const VIRTUAL_CAMERA_PATTERNS = [
  /\bobs\b/i, /manycam/i, /snap camera/i, /xsplit/i, /camtwist/i, /splitcam/i, /e2esoft/i, /\bvirtual\b/i,
];

export interface CameraSignals {
  camera_label: string;
  virtual_camera: boolean;
  webdriver: boolean;
  headless: boolean;
}

export const isVirtualCameraLabel = (label: string | undefined | null): boolean => (
  Boolean(label) && VIRTUAL_CAMERA_PATTERNS.some((pattern) => pattern.test(label!))
);

export const cameraSignals = (
  label: string | undefined | null,
  nav: Pick<Navigator, 'userAgent'> & { webdriver?: boolean } = navigator,
): CameraSignals => ({
  camera_label: label ?? '',
  virtual_camera: isVirtualCameraLabel(label),
  webdriver: nav.webdriver === true,
  headless: /HeadlessChrome/.test(nav.userAgent),
});
