import webcamHtml from '../templates/webcam.html';
import resizeImage from './image';
import { getIndexDbBufferInstance } from './indexDbBuffer';

// Track active stream globally
let activeStream = null;

const LOW_QUALITY_CONSTRAINTS = {
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 4 }, // Reduced from typical 30fps
    facingMode: 'user',
    // Advanced constraints for supported browsers
    advanced: [
      { aspectRatio: 4 / 3 },
      { resizeMode: 'crop-and-scale' }, // Helps with performance
    ],
  },
};

export function getVideoElement() {
  const videoElement = document.getElementById('webcam');
  return videoElement;
}

export function captureSnapshot({
  onSnapshotFailure,
  resizeDimensions,
}) {
  const videoElement = getVideoElement();
  const queueManager = getIndexDbBufferInstance();

  if (videoElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Get the image source as a data URL
    const imageSrc = canvas.toDataURL('image/jpeg'); // Get base64 image data

    // Use the resizeImage function to resize and return a smaller blob
    resizeImage(imageSrc, resizeDimensions)
      .then((blob) => {
        queueManager.addSnapshot(blob, 'webcam')
          .catch((error) => {
            onSnapshotFailure?.({ error });
          });
      })
      .catch((error) => {
        onSnapshotFailure?.({ error });
      });
  } else {
    onSnapshotFailure?.({ error: new Error('No video element found') });
  }
}

// Start taking Snapshots at regular intervals
let snapshotIntervalId = null;

export function setupSnapshotCapture({
  onSnapshotFailure,
  frequency,
  resizeDimensions,
}) {
  // Clear any existing interval
  if (snapshotIntervalId) {
    clearInterval(snapshotIntervalId);
  }

  snapshotIntervalId = setInterval(() => {
    captureSnapshot({ onSnapshotFailure, resizeDimensions });
  }, frequency);

  // Return interval ID so it can be cleared on unmount if needed
  return snapshotIntervalId;
}

export function setupWebcam() {
  const webcamEl = document.getElementById('webcam-wrapper');
  if (webcamEl) return;
  const webcamContainer = document.createElement('div');
  document.body.appendChild(webcamContainer);

  // Create Webcam component
  const webcamElement = document.createElement('div');
  webcamElement.innerHTML = webcamHtml;
  webcamContainer.appendChild(webcamElement);
}

// Determines if a pixel is considered black (low RGB values)
function isBlackPixel(r, g, b) {
  return r < 10 && g < 10 && b < 10;
}

// Counts the number of black pixels in the frame
function countBlackPixels(frameData) {
  let blackPixelCount = 0;

  for (let i = 0; i < frameData.length; i += 4) {
    const r = frameData[i];
    const g = frameData[i + 1];
    const b = frameData[i + 2];

    if (isBlackPixel(r, g, b)) {
      blackPixelCount += 1;
    }
  }

  return blackPixelCount;
}

// Checks if the frame has a sufficient percentage of black pixels
function isMostlyBlackFrame(frameData, threshold) {
  const blackPixelCount = countBlackPixels(frameData);
  const totalPixels = frameData.length / 4;
  const blackPixelRatio = blackPixelCount / totalPixels;

  return blackPixelRatio >= threshold;
}

// Function to check for black frames
function checkForBlackFrame(
  videoElement,
  stream,
  blackPixelThreshold,
  onWebcamEnabled,
  onWebcamDisabled,
) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const checkBlackFrame = () => {
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height).data;

    if (isMostlyBlackFrame(frame, blackPixelThreshold)) {
      onWebcamDisabled?.({
        error: new Error('Mostly black video feed detected'),
      });
      // Don't stop the stream, just notify about black frame
    } else {
      onWebcamEnabled?.({ videoElement });
    }
  };

  setTimeout(checkBlackFrame, 1000); // Delay to allow video to start
}

export async function getAvailableCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((device) => device.kind === 'videoinput')
      .map((device) => ({
        id: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 4)}...`,
      }));
  } catch (error) {
    console.error('Error getting cameras:', error);
    return [];
  }
}

// Cleanup function to stop camera stream
export function cleanupWebcam() {
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
  }
  const videoElement = getVideoElement();
  if (videoElement) {
    videoElement.srcObject = null;
  }
}

export function detectWebcam({
  onWebcamEnabled,
  onWebcamDisabled,
  optional,
  blackPixelThreshold = 0.8,
  deviceId = null || '',
}) {
  // If there's already an active stream, reuse it
  if (activeStream) {
    const videoElement = getVideoElement();
    if (videoElement) {
      videoElement.srcObject = activeStream;
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        checkForBlackFrame(
          videoElement,
          activeStream,
          blackPixelThreshold,
          onWebcamEnabled,
          onWebcamDisabled,
        );
      };
      return;
    }
  }

  navigator.mediaDevices
    .getUserMedia({
      ...LOW_QUALITY_CONSTRAINTS,
      video: {
        ...LOW_QUALITY_CONSTRAINTS.video,
        deviceId: { exact: deviceId || undefined },
      },
    })
    .then((stream) => {
      activeStream = stream; // Store stream globally
      const videoElement = getVideoElement();
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          checkForBlackFrame(
            videoElement,
            stream,
            blackPixelThreshold,
            onWebcamEnabled,
            onWebcamDisabled,
          );
        };
      }
    })
    .catch((error) => {
      if (optional) {
        if (error.name !== 'NotFoundError') onWebcamDisabled?.({ error });
      } else {
        onWebcamDisabled?.({ error });
      }
    });
}
