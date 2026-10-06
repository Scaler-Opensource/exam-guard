import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { ArrowRight, Camera } from 'lucide-react';

import { Button } from '@/ui/Button';
import Loader from '@/ui/Loader';
import StepHeader from '@/ui/StepHeader';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxhooks';
import { selectProctor } from '@/store/features/assessmentInfoSlice';
import { nextStep, setSubStepStatus } from '@/store/features/workflowSlice';
import {
  IdentityApiError, fetchIdentityStatus, requestLivenessNonce, verifySelfie,
} from '@/services/identityVerificationService';
import {
  IdentityStatus, errorText, identityView, isLivenessOn, pollDelayMs,
} from '@/utils/identityVerification';
import { cameraSignals } from '@/utils/cameraIntegrity';
import LivenessFrame, { LivenessOutcome } from './LivenessFrame';
import { WorkflowStepKey } from '@/types/workflowTypes';

const STEP: WorkflowStepKey = 'identityVerification';
const SUB_STEP = 'identityCapture';

// Larger than the proctoring snapshot stream: face matching needs a usable face size.
const CAPTURE_CONSTRAINTS: MediaStreamConstraints = {
  video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
  audio: false,
};
const POLL_ERROR_DELAY_MS = 5000;

const captureFrame = (video: HTMLVideoElement): Promise<Blob> => new Promise((resolve, reject) => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(
    (blob) => (blob ? resolve(blob) : reject(new Error('capture_failed'))),
    'image/jpeg',
    0.9,
  );
});

const IdentityVerificationStep = () => {
  const dispatch = useAppDispatch();
  const proctor = useAppSelector(selectProctor);
  const token = useAppSelector((state) => state.assessmentInfo.token);
  const policy = useAppSelector((state) => state.assessmentInfo.identity);
  const steps = useAppSelector((state) => state.workflow.steps);
  const baseUrl = proctor?.baseUrl ?? '';

  const [status, setStatus] = useState<IdentityStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [liveness, setLiveness] = useState<{ url: string; nonce: string } | null>(null);

  const view = identityView(status);
  const stepNumber = useMemo(
    () => (Object.keys(steps) as WorkflowStepKey[])
      .filter((key) => steps[key].enabled)
      .indexOf(STEP) + 1,
    [steps],
  );

  useEffect(() => {
    if (!token || !baseUrl) return undefined;
    let cancelled = false;
    setError('');
    fetchIdentityStatus({ baseUrl, token })
      .then((identity) => { if (!cancelled) setStatus(identity); })
      .catch(() => {
        if (!cancelled) setError('We could not load identity verification. Check your connection and try again.');
      });
    return () => { cancelled = true; };
  }, [baseUrl, token, loadAttempt]);

  // Poll while a selfie is being verified; a failed poll just waits longer and tries again.
  useEffect(() => {
    if (status?.status !== 'pending' || !token) return undefined;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const poll = (delay: number) => {
      timer = setTimeout(() => {
        fetchIdentityStatus({ baseUrl, token })
          .then((identity) => { if (!cancelled) setStatus(identity); })
          .catch(() => { if (!cancelled) poll(POLL_ERROR_DELAY_MS); });
      }, delay);
    };
    poll(pollDelayMs(status));
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [baseUrl, token, status]);

  useEffect(() => {
    const subStepStatus = { completed: 'completed', error: 'error', pending: 'pending' } as const;
    dispatch(setSubStepStatus({
      step: STEP, subStep: SUB_STEP, status: subStepStatus[view.tone], clearError: true,
    }));
  }, [dispatch, view.tone]);

  useEffect(() => {
    if (view.phase === 'skip') dispatch(nextStep());
  }, [dispatch, view.phase]);

  // The camera is only held while the candidate can take a photo, and is released while the
  // liveness page has it: some drivers won't open one camera twice.
  const capturing = view.phase === 'capture' && !liveness;
  const livenessOn = isLivenessOn(status);
  useEffect(() => {
    if (!capturing) return undefined;
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices?.getUserMedia(CAPTURE_CONSTRAINTS)
      .then((mediaStream) => {
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = mediaStream;
        streamRef.current = mediaStream;
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      })
      .catch(() => {
        if (!cancelled) setError('We could not access your camera. Allow camera access and try again.');
      });
    return () => {
      cancelled = true;
      setCameraReady(false);
      stream?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [capturing]);

  const handleStartLiveness = useCallback(async () => {
    if (!token) return;
    const signals = cameraSignals(streamRef.current?.getVideoTracks()[0]?.label);
    if (signals.virtual_camera && policy?.camera_integrity?.mode === 'required') {
      setError(errorText('virtual_camera'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { nonce, livenessUrl } = await requestLivenessNonce({ baseUrl, token, signals });
      setLiveness({ url: livenessUrl, nonce });
    } catch (err) {
      setError(errorText(err instanceof IdentityApiError ? err.message : 'request_failed'));
    } finally {
      setBusy(false);
    }
  }, [baseUrl, token, policy]);

  const handleLivenessDone = useCallback((outcome: LivenessOutcome) => {
    setLiveness(null);
    if (outcome.type === 'error') setError(errorText(outcome.code, outcome.message));
    if (token) fetchIdentityStatus({ baseUrl, token }).then(setStatus).catch(() => setLoadAttempt((n) => n + 1));
  }, [baseUrl, token]);

  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !token) return;
    setBusy(true);
    setError('');
    try {
      const image = await captureFrame(video);
      const signals = cameraSignals(streamRef.current?.getVideoTracks()[0]?.label);
      setStatus(await verifySelfie({
        baseUrl, token, image, signals,
      }));
    } catch (err) {
      setError(errorText(err instanceof IdentityApiError ? err.message : 'upload_failed'));
    } finally {
      setBusy(false);
    }
  }, [baseUrl, token]);

  const handleContinue = () => dispatch(nextStep());
  const idleLabel = livenessOn ? 'Start liveness check' : 'Take photo';
  const captureLabel = busy ? 'Starting…' : idleLabel;

  return (
    <>
      <StepHeader stepNumber={String(stepNumber)} title={view.title} status={view.tone} />
      <div className='mt-16 max-w-3xl'>
        {view.message && <p className='text-base text-base-500'>{view.message}</p>}

        {capturing && (
          <div className='mt-8 aspect-[4/3] w-full max-w-2xl bg-base-100 rounded-lg overflow-hidden'>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onLoadedData={() => setCameraReady(true)}
              className='w-full h-full object-cover'
              style={{ transform: 'scale(-1, 1)' }}
            />
          </div>
        )}

        {liveness && <LivenessFrame url={liveness.url} nonce={liveness.nonce} onDone={handleLivenessDone} />}

        {(view.phase === 'loading' || view.phase === 'verifying') && !error && (
          <div className='mt-8'><Loader size='md' /></div>
        )}

        {error && <p className='mt-6 text-sm text-red-500'>{error}</p>}

        <div className='mt-8 flex items-center gap-6'>
          {capturing && (
            <Button
              variant='primary'
              size='lg'
              className='items-center gap-3'
              onClick={livenessOn ? handleStartLiveness : handleCapture}
              disabled={!cameraReady || busy}
            >
              <Camera className='w-6 h-6' />
              {captureLabel}
            </Button>
          )}
          {view.phase === 'loading' && error && (
            <Button variant='primary' size='lg' onClick={() => setLoadAttempt((n) => n + 1)}>
              Try again
            </Button>
          )}
          {view.canProceed && view.phase !== 'skip' && !liveness && (
            <Button
              variant={capturing ? 'outline' : 'primary'}
              size='lg'
              className='items-center gap-3'
              onClick={handleContinue}
              disabled={busy}
            >
              {capturing ? 'Continue without verifying' : 'Continue'}
              <ArrowRight className='w-6 h-6' />
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default IdentityVerificationStep;
