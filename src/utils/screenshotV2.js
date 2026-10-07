import {
  ENTIRE_SCREEN_DISPLAY_SURFACE,
  SCREEN_SHARE_READY_STATE,
  ERRORS,
  STRATEGIES,
} from '@/constants/screenshot';
import { getIndexDbBufferInstance } from '@/utils/indexDbBuffer';

class ScreenShareMonitor {
  constructor(strategy = STRATEGIES.INDEX_DB_BUFFER_STRATEGY) {
    this.capturedIntervals = [];
    this.mediaStream = null;
    this.strategy = strategy;
  }

  async requestScreenShare({ onFailure, onEnd }) {
    try {
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
      });
      this.listenScreenShareEnd({ onEnd });
      // TODO: Do we need this?
      // onSuccess?.({ stream: this.mediaStream });

      return true;
    } catch (err) {
      console.error('Screen sharing was denied or failed:', err);
      onFailure?.({ err });
      return false;
    }
  }

  async isScreenShareValid() {
    if (!this.mediaStream) return [false, ERRORS.SCREEN_SHARE_DENIED];

    const videoTracks = this.mediaStream.getVideoTracks();
    if (videoTracks.length === 0) return [false, ERRORS.SCREEN_SHARE_FAILED];

    const { readyState } = videoTracks[0];
    if (readyState !== SCREEN_SHARE_READY_STATE) {
      return [false, ERRORS.SCREEN_SHARE_STREAM_ENDED];
    }

    const settings = videoTracks[0].getSettings();

    if ('displaySurface' in settings) {
      // For Chromium based browsers
      if (settings?.displaySurface !== ENTIRE_SCREEN_DISPLAY_SURFACE) {
        this.stopScreenShare();
        return [false, ERRORS.FULL_MONITOR_NOT_SHARED];
      }
    } else {
      // For Mozilla based browsers
      const screenWidth = window.screen.width * window.devicePixelRatio;
      const screenHeight = window.screen.height * window.devicePixelRatio;
      const tolerance = 5;
      if (Math.abs(settings.width - screenWidth) > tolerance
          || Math.abs(settings.height - screenHeight) > tolerance) {
        this.stopScreenShare();
        return [false, ERRORS.FULL_MONITOR_NOT_SHARED];
      }
    }

    return [true, null];
  }

  async captureScreenshot({ resizeDimensions }) {
    // check if video, canvas need to be manually garbage collected!
    const video = document.createElement('video');
    video.srcObject = this.mediaStream;
    video.play();

    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve();
    });

    const canvas = document.createElement('canvas');

    if (resizeDimensions) {
      canvas.width = resizeDimensions.width;
      canvas.height = resizeDimensions.height;
    } else {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve);
    });

    return blob;
  }

  useRetryStrategy({
    onSuccess,
    onFailure,
    resizeDimensions,
    interval = 3000,
    maxRetries = 3,
    baseDelay = 1000,
  }) {
    if (!this.mediaStream) {
      console.warn('No media stream available. Start screen sharing first.');
      return;
    }

    this.capturedIntervals.push(
      setInterval(async () => {
        try {
          const blob = await this.captureScreenshot({ resizeDimensions });

          let attempt = 0;
          let success = false;
          let delay = baseDelay;

          while (attempt < maxRetries && !success) {
            try {
              // eslint-disable-next-line no-await-in-loop
              await onSuccess?.({ blob });
              success = true;
            } catch (err) {
              console.log(err);
              attempt += 1;
              if (attempt === maxRetries) {
                // eslint-disable-next-line no-await-in-loop
                await onFailure?.({ err });
              } else {
                console.warn(
                  `Retry attempt ${attempt} failed. Retrying in ${delay}ms.`,
                );
                // eslint-disable-next-line no-await-in-loop, no-loop-func
                await new Promise((resolve) => {
                  setTimeout(resolve, delay);
                });
                delay *= 2;
              }
            }
          }
        } catch (err) {
          await onFailure?.({ err });
        }
      }, interval),
    );
  }

  useRollingWindowStrategy({
    onSuccess,
    onFailure,
    resizeDimensions,
    windowSize = 100,
    interval,
  }) {
    if (!this.mediaStream) {
      console.warn('No media stream available. Start screen sharing first.');
      return;
    }
    this.rollingWindow = [];
    this.rollingWindowInProcess = false;

    const insertInWindow = async (blob) => {
      if (this.rollingWindow.length === windowSize) {
        this.rollingWindow.shift();
        await onFailure?.({
          err: ERRORS.ROLLING_WINDOW_STRATEGY_LENGTH_EXCEEDED,
        });
      }
      this.rollingWindow.push(blob);
    };

    const pushFromWindow = async () => {
      console.log(this.rollingWindow);
      if (this.rollingWindowInProcess) return;

      this.rollingWindowInProcess = true;

      for (let idx = 0; idx < this.rollingWindow.length; idx += 1) {
        const item = this.rollingWindow[idx];
        try {
          // eslint-disable-next-line no-await-in-loop
          await onSuccess?.({ blob: item });
          this.rollingWindow.splice(idx, 1);
          idx -= 1;
        } catch (err) {
          onFailure?.(err);
        }
      }

      this.rollingWindowInProcess = false;
    };

    this.capturedIntervals.push(
      setInterval(async () => {
        const blob = await this.captureScreenshot({ resizeDimensions });
        await insertInWindow(blob);
      }, interval),
    );

    this.capturedIntervals.push(
      setInterval(async () => {
        await pushFromWindow();
      }, interval / 2),
    );
  }

  useIndexDbBufferStrategy({
    onFailure,
    interval,
    resizeDimensions,
  }) {
    const queueManager = getIndexDbBufferInstance();

    this.capturedIntervals.push(
      setInterval(async () => {
        try {
          const blob = await this.captureScreenshot({ resizeDimensions });
          await queueManager.addSnapshot(blob, 'screenshot')
            .catch((error) => {
              onFailure?.({ err: error });
            });
        } catch (err) {
          await onFailure?.({ err });
        }
      }, interval),
    );
  }

  startScreenshotCapture({
    onSuccess,
    onFailure,
    interval,
    resizeDimensions,
  }) {
    switch (this.strategy) {
      case STRATEGIES.RETRY_STRATEGY:
        this.useRetryStrategy({
          onSuccess,
          onFailure,
          interval,
          maxRetries: 3,
          baseDelay: 1000,
          resizeDimensions,
        });
        break;
      case STRATEGIES.ROLLING_WINDOW_STRATEGY:
        this.useRollingWindowStrategy({
          onSuccess,
          onFailure,
          windowSize: 200,
          interval,
          resizeDimensions,
        });
        break;
      case STRATEGIES.INDEX_DB_BUFFER_STRATEGY:
        this.useIndexDbBufferStrategy({
          onFailure,
          interval,
          resizeDimensions,
        });
        break;
      default:
        this.useRollingWindowStrategy({
          onSuccess,
          onFailure,
          windowSize: 200,
          interval,
          resizeDimensions,
        });
        break;
    }
  }

  stopScreenShare() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.capturedIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.rollingWindow = [];
  }

  listenScreenShareEnd({ onEnd }) {
    if (!this.mediaStream) return;

    const videoTrack = this.mediaStream.getVideoTracks()[0];
    videoTrack.addEventListener('ended', () => {
      this.stopScreenShare();
      onEnd?.();
    });
  }
}

const screenShareMonitor = new ScreenShareMonitor();

export async function isScreenShareValid({ onSuccess, onFailure }) {
  const [success, error] = await screenShareMonitor.isScreenShareValid();
  if (success) {
    onSuccess?.();
  } else {
    onFailure?.(error);
  }
  return [success, error];
}

async function setupScreenshotCaptureFromScreenShareNew({
  onScreenShareEnabled,
  onScreenShareFailure,
  onScreenShareEnd,
  onScreenshotSuccess,
  onScreenshotFailure,
  frequency,
  resizeDimensions,
  disableScreenshot,
}) {
  if (window.isTestEnding) {
    return;
  }

  const [success] = await isScreenShareValid({});
  if (success) return;

  try {
    const resp = await screenShareMonitor.requestScreenShare({
      onSuccess: onScreenShareEnabled,
      onFailure: onScreenShareFailure,
      onEnd: onScreenShareEnd,
    });

    if (!resp) return;

    const [isValid, error] = await screenShareMonitor.isScreenShareValid();
    if (!isValid) {
      onScreenShareFailure?.(error);
      return;
    }

    onScreenShareEnabled?.();

    if (!disableScreenshot) {
      screenShareMonitor.startScreenshotCapture({
        onSuccess: onScreenshotSuccess,
        onFailure: onScreenshotFailure,
        interval: frequency,
        resizeDimensions,
      });
    }
  } catch (error) {
    onScreenShareFailure?.();
  }
}

export async function screenshareRequestHandler({ disableScreenshot = false }) {
  // Update this to use the new setupScreenshotCaptureFromScreenShareNew
  await setupScreenshotCaptureFromScreenShareNew({
    onScreenShareEnabled: this.handleScreenShareSuccess.bind(this),
    onScreenShareFailure: this.handleScreenShareFailure.bind(this),
    onScreenShareEnd: this.handleScreenShareEnd.bind(this),
    onScreenshotSuccess: this.handleScreenshotSuccess.bind(this),
    onScreenshotFailure: this.handleScreenshotFailure.bind(this),
    frequency: this.screenshotConfig.frequency,
    resizeDimensions: this.screenshotConfig.resizeTo,
    disableScreenshot,
  });
}

export function screenshareCleanup() {
  screenShareMonitor.stopScreenShare();
}
