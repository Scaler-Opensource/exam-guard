import { cameraSignals, isVirtualCameraLabel } from './cameraIntegrity';

describe('isVirtualCameraLabel', () => {
  it('recognises common virtual cameras', () => {
    ['OBS Virtual Camera', 'ManyCam Virtual Webcam', 'Snap Camera', 'XSplit VCam', 'CamTwist', 'e2eSoft VCam']
      .forEach((label) => expect(isVirtualCameraLabel(label)).toBe(true));
  });

  it('does not flag physical cameras', () => {
    ['FaceTime HD Camera', 'Integrated Webcam (0bda:58f4)', 'Logitech C920', 'HP TrueVision HD Camera', '']
      .forEach((label) => expect(isVirtualCameraLabel(label)).toBe(false));
  });
});

describe('cameraSignals', () => {
  it('reports the label, virtual camera and automation flags', () => {
    const signals = cameraSignals('OBS Virtual Camera', { userAgent: 'Mozilla/5.0 HeadlessChrome/120', webdriver: true });

    expect(signals).toEqual({ camera_label: 'OBS Virtual Camera', virtual_camera: true, webdriver: true, headless: true });
  });

  it('reports a normal browser as clean', () => {
    expect(cameraSignals('FaceTime HD Camera', { userAgent: 'Mozilla/5.0 Chrome/120' }))
      .toEqual({ camera_label: 'FaceTime HD Camera', virtual_camera: false, webdriver: false, headless: false });
  });
});
