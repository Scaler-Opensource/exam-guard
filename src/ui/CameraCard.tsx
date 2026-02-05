import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Camera, ChevronDown, Video } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/hooks/reduxhooks';
import {
  selectSubStep,
  setSubStepError,
  setSubStepStatus,
} from '@/store/features/workflowSlice';
import { selectProctor } from '@/store/features/assessmentInfoSlice';

// Define optimal constraints for low resource usage
const LOW_QUALITY_CONSTRAINTS = {
  video: {
    width: { ideal: 160 },     // Using ideal instead of max
    height: { ideal: 120 },    // Using ideal instead of max
    frameRate: {
      ideal: 10    // Still keep ideal for browsers that respect it
    },  
    facingMode: 'user',
    advanced: [
      { aspectRatio: 4/3 },
      { resizeMode: 'crop-and-scale' },  // Helps with performance
    ]
  }
};

// Memoized video component with optimized settings
const WebcamVideo = memo(({ isVisible, onStreamReady }: { 
  isVisible: boolean;
  onStreamReady: (stream: MediaStream) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      // Optimize video playback
      videoElement.autoplay = true;
      videoElement.muted = true;
      videoElement.playsInline = true;
      videoElement.disablePictureInPicture = true;
      
      // Reduce video processing load
      videoElement.style.objectFit = 'cover';
      videoElement.style.transform = 'scale(-1, 1)'; // Mirror effect if needed
      
      // Listen for the loadedmetadata event to optimize initial render
      videoElement.addEventListener('loadedmetadata', () => {
        videoElement.play().catch(console.error);
      });

      return () => {
        if (videoElement.srcObject instanceof MediaStream) {
          const stream = videoElement.srcObject;
          stream.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, []);

  return (
    <video
      ref={videoRef}
      id="webcam-video"
      className={`w-full h-full object-cover rounded-lg ${
        isVisible ? 'block' : 'hidden'
      }`}
    />
  );
});

WebcamVideo.displayName = 'WebcamVideo';

// Memoized error component
const CameraError = memo(({ onClick }: { onClick: () => void }) => (
  <div
    className='flex flex-col items-center gap-4 p-6 text-center cursor-pointer'
    onClick={onClick}
  >
    <Camera className='w-16 h-16 text-red-400' strokeWidth={1.5} />
    <div className='space-y-2'>
      <p className='text-red-600 font-medium'>
        Camera access is blocked. Follow the steps below to fix it.
      </p>
    </div>
  </div>
));

CameraError.displayName = 'CameraError';

export default function CameraSelector() {
  const dispatch = useAppDispatch();
  const proctor = useAppSelector(selectProctor);
  const cameraState = useAppSelector((state) =>
    selectSubStep(state, 'cameraShare', 'cameraShare')
  );

  const { enableProctoring } = useAppSelector((state) => state.workflow);

  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  

  // Use ref to store mediaStream to properly cleanup
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Cleanup function to stop all tracks
  const cleanup = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      mediaStreamRef.current = null;
    }

  }, [enableProctoring]);

  const initializeCamera = useCallback(async () => {
    try {
      cleanup(); // Clean up previous stream

      // First check if we have permissions
      let hasPermission = false;
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        hasPermission = permissionStatus.state === 'granted';
      } catch (e) {
        // Firefox doesn't support permission query for camera, will handle in getUserMedia
        console.log('Permission query not supported, proceeding with getUserMedia');
      }

      // Get camera with optimized constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        ...LOW_QUALITY_CONSTRAINTS,
        video: {
          ...LOW_QUALITY_CONSTRAINTS.video,
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined
        }
      });

      mediaStreamRef.current = stream;
      
      const availableCameras = await proctor?.getWebcamDevices();

      if (availableCameras?.length) {
        setCameras(availableCameras);
        if (!selectedCamera) {
          setSelectedCamera(availableCameras[0].id);
          await proctor?.setWebcamDevice(availableCameras[0].id);
          await proctor?.handleWebcamRequest();
        }
      }

      // Connect stream to video element
      const videoElement = document.getElementById('webcam-video') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = stream;
      }

      dispatch(
        setSubStepStatus({
          step: 'cameraShare',
          subStep: 'cameraShare',
          status: 'completed',
        })
      );

    } catch (error: any) {
      console.error('Camera initialization error:', error);
      let errorMessage = 'Camera permission denied';
      
      // Provide more specific error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera access was denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera device found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application. Please close other apps using the camera.';
      }

      dispatch(
        setSubStepError({
          step: 'cameraShare',
          subStep: 'cameraShare',
          error: errorMessage,
        })
      );
    }
  }, [proctor, dispatch, cleanup, selectedCamera]);

  useEffect(() => {
    initializeCamera();
    
    // Optimization: Pause stream when tab is not visible
    const handleVisibilityChange = () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.enabled = !document.hidden;
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      cleanup();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [initializeCamera]);

  const handleCameraChange = useCallback(async (cameraId: string) => {
    setSelectedCamera(cameraId);
    if (proctor) {
      await proctor.setWebcamDevice(cameraId);
      await proctor.handleWebcamRequest();
    }
  }, [proctor]);

  // Debounced camera switch to prevent rapid switching
  const debouncedHandleCameraChange = useCallback((cameraId: string) => {
    const timeoutId = setTimeout(() => {
      handleCameraChange(cameraId);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [handleCameraChange]);

  return (
    <div className=' border-none w-[80%] flex flex-col items-center justify-between gap-10 shadow-[0_0_40px_10px_rgb(0,0,0,0.05)]'>
      <div className='overflow-hidden shadow-lg bg-white w-full pb-6 space-y-6 rounded-2xl'>
        <div className='aspect-video bg-gray-100 rounded-lg flex items-center justify-center'>
          {cameraState.status === 'error' && (
            <CameraError onClick={initializeCamera} />
          )}
          <WebcamVideo 
            isVisible={cameraState.status === 'completed'} 
            onStreamReady={(stream) => {
              mediaStreamRef.current = stream;
            }}
          />
        </div>

        <div className="relative mx-8">
          <select
            id="camera-select"
            value={selectedCamera}
            onChange={(e) => debouncedHandleCameraChange(e.target.value)}
            className="w-full text-sm appearance-none rounded-lg border border-gray-300 bg-white py-4 pl-16 pr-8 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="" disabled>
              Select Camera Input
            </option>
            {cameras?.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || 'Unnamed Camera'}
              </option>
            ))}
          </select>
          <Video className="w-8 h-8 fill-black absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <ChevronDown className="w-8 h-8 text-gray-500 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
