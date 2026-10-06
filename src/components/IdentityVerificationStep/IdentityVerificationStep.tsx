import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { ArrowRight, Camera } from 'lucide-react';

import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import Loader from '@/ui/Loader';
import StepHeader from '@/ui/StepHeader';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxhooks';
import { useStepNumber } from '@/hooks/useStepNumber';
import { selectProctor } from '@/store/features/assessmentInfoSlice';
import { nextStep, setSubStepStatus } from '@/store/features/workflowSlice';
import {
  IdentityApiError, fetchIdentityStatus, recordConsent, requestLivenessNonce, verifySelfie,
} from '@/services/identityVerificationService';
import {
  IdentityStatus, errorText, isLivenessOn, pollDelayMs,
} from '@/utils/identityVerification';
import { CONSENT_VERSION, VERIFIED_CONFIRMATION, identityScreen } from '@/utils/identityScreen';
import { CameraSignals, cameraSignals } from '@/utils/cameraIntegrity';
import { WorkflowStepKey } from '@/types/workflowTypes';
import ConsentCard from './ConsentCard';
import LivenessFrame, { LivenessOutcome } from './LivenessFrame';
import PositioningModal from './PositioningModal';
import {
  AttemptChip, CheckRows, HelpLine, IdentityCard, identityMedia,
} from './IdentityCard';

const STEP: WorkflowStepKey = 'identityVerification';
const SUB_STEP = 'identityCapture';
const POLL_ERROR_DELAY_MS = 5000;

// Larger than the proctoring snapshot stream: face matching needs a usable face size. The camera
// chosen at the desktop camera step is preferred, so the face comes from the same device.
const captureConstraints = (deviceId?: string): MediaStreamConstraints => ({
  video: {
    width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user', ...(deviceId ? { deviceId: { ideal: deviceId } } : {}),
  },
  audio: false,
});

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

const deviceLabel = async (deviceId?: string): Promise<string> => {
  if (!deviceId || !navigator.mediaDevices?.enumerateDevices) return '';
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.find((device) => device.deviceId === deviceId)?.label ?? '';
};

const IdentityVerificationStep = () => {
  const dispatch = useAppDispatch();
  const proctor = useAppSelector(selectProctor);
  const token = useAppSelector((state) => state.assessmentInfo.token);
  const policy = useAppSelector((state) => state.assessmentInfo.identity);
  const baseUrl = proctor?.baseUrl ?? '';
  const stepDeviceId: string | undefined = proctor?.snapshotConfig?.deviceId;
  const stepNumber = useStepNumber(STEP);

  const [status, setStatus] = useState<IdentityStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [liveness, setLiveness] = useState<{ url: string; nonce: string } | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [previousLabel, setPreviousLabel] = useState('');
  const guideShown = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const applyStatus = useCallback((identity: IdentityStatus) => {
    setStatus(identity);
    setRetrying(false);
  }, []);

  const screen = identityScreen(status, policy);
  // Try again after a failure or an outage goes back to the camera.
  const state = retrying && ['attempt_failed', 'service_error'].includes(screen.state) ? 'capture' : screen.state;
  const tone = error && state === 'capture' ? 'error' : screen.tone;
  const livenessOn = isLivenessOn(status);

  useEffect(() => {
    if (!token || !baseUrl) return undefined;
    let cancelled = false;
    setError('');
    fetchIdentityStatus({ baseUrl, token })
      .then((identity) => { if (!cancelled) applyStatus(identity); })
      .catch(() => {
        if (!cancelled) setError('We could not load identity verification. Check your connection and try again.');
      });
    return () => { cancelled = true; };
  }, [baseUrl, token, loadAttempt, applyStatus]);

  // Poll while a capture is being verified; a failed poll just waits longer and tries again.
  useEffect(() => {
    if (status?.status !== 'pending' || !token) return undefined;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const poll = (delay: number) => {
      timer = setTimeout(() => {
        fetchIdentityStatus({ baseUrl, token })
          .then((identity) => { if (!cancelled) applyStatus(identity); })
          .catch(() => { if (!cancelled) poll(POLL_ERROR_DELAY_MS); });
      }, delay);
    };
    poll(pollDelayMs(status));
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [baseUrl, token, status, applyStatus]);

  useEffect(() => {
    dispatch(setSubStepStatus({
      step: STEP, subStep: SUB_STEP, status: tone, clearError: true,
    }));
  }, [dispatch, tone]);

  useEffect(() => {
    if (state === 'skip') dispatch(nextStep());
  }, [dispatch, state]);

  // The positioning guide opens by itself the first time the step is shown.
  useEffect(() => {
    if (guideShown.current || !['consent', 'capture'].includes(state)) return;
    guideShown.current = true;
    setGuideOpen(true);
  }, [state]);

  useEffect(() => {
    deviceLabel(stepDeviceId).then(setPreviousLabel).catch(() => setPreviousLabel(''));
  }, [stepDeviceId]);

  // The camera is held only while the candidate can capture, and released while the liveness
  // page has it: some drivers won't open one camera twice.
  const capturing = state === 'capture' && !liveness;
  useEffect(() => {
    if (!capturing) return undefined;
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices?.getUserMedia(captureConstraints(stepDeviceId))
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
  }, [capturing, stepDeviceId]);

  const currentSignals = (): CameraSignals => ({
    ...cameraSignals(streamRef.current?.getVideoTracks()[0]?.label),
    previous_camera_label: previousLabel || undefined,
  });

  const refreshStatus = useCallback(() => {
    if (token) fetchIdentityStatus({ baseUrl, token }).then(applyStatus).catch(() => setLoadAttempt((n) => n + 1));
  }, [baseUrl, token, applyStatus]);

  const handleConsent = async () => {
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      applyStatus(await recordConsent({ baseUrl, token, version: CONSENT_VERSION }));
    } catch (err) {
      setError(errorText(err instanceof IdentityApiError ? err.message : 'request_failed'));
    } finally {
      setBusy(false);
    }
  };

  const handleStartLiveness = async () => {
    if (!token) return;
    const signals = currentSignals();
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
      // An outage is recorded server-side; the fresh status shows whether the template lets them continue.
      refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  const handleLivenessDone = useCallback((outcome: LivenessOutcome) => {
    setLiveness(null);
    if (outcome.type === 'error') setError(errorText(outcome.code, outcome.message));
    refreshStatus();
  }, [refreshStatus]);

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || !token) return;
    setBusy(true);
    setError('');
    try {
      const image = await captureFrame(video);
      applyStatus(await verifySelfie({
        baseUrl, token, image, signals: currentSignals(),
      }));
    } catch (err) {
      setError(errorText(err instanceof IdentityApiError ? err.message : 'upload_failed'));
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = () => {
    setError('');
    setRetrying(true);
  };

  const handleContinue = () => dispatch(nextStep());
  const header = <StepHeader stepNumber={stepNumber} title='Identity Verification' status={tone} />;

  if (state === 'loading' || state === 'skip') {
    return (
      <>
        {header}
        <div className='mt-16'>
          {error ? (
            <>
              <p className='text-sm text-red-500'>{error}</p>
              <Button variant='primary' size='lg' className='mt-6' onClick={() => setLoadAttempt((n) => n + 1)}>Try again</Button>
            </>
          ) : <Loader size='md' />}
        </div>
      </>
    );
  }

  const verifiedRows = ['Face detected', ...(livenessOn ? ['Liveness passed'] : []),
    ...(state === 'verified' ? ['Matched with your Scaler record'] : [])];
  const continueButton = screen.canProceed && !liveness && (
    <Button variant={state === 'verified' ? 'primary' : 'outline'} size='lg' className='items-center gap-3' onClick={handleContinue} disabled={busy}>
      {state === 'capture' ? 'Continue without verifying' : 'Continue'}
      <ArrowRight className='w-6 h-6' />
    </Button>
  );

  return (
    <>
      {header}
      <div className='mt-12 max-w-5xl'>
        {state === 'consent' && <ConsentCard baseUrl={baseUrl} busy={busy} onAccept={handleConsent} />}
        {state === 'consent' && error && <p className='mt-4 text-sm text-red-500'>{error}</p>}

        {['capture', 'analysing', 'attempt_failed'].includes(state) && (
          <IdentityCard banner={error || (state === 'attempt_failed' ? screen.banner : '')}>
            <div className='flex gap-8'>
              <div className='flex-1 flex flex-col items-center'>
                {liveness && (
                  <LivenessFrame url={liveness.url} nonce={liveness.nonce} onDone={handleLivenessDone} className='w-full h-[560px]' />
                )}
                {capturing && (
                  <div className='relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-base-100'>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      onLoadedData={() => setCameraReady(true)}
                      className='w-full h-full object-cover'
                      style={{ transform: 'scale(-1, 1)' }}
                    />
                    <div className={`absolute inset-y-[10%] inset-x-[28%] rounded-[50%] border-4 ${cameraReady ? 'border-scaler-500' : 'border-base-200'}`} />
                  </div>
                )}
                {!liveness && !capturing && (
                  <img
                    src={identityMedia(baseUrl, 'illus-face.jpg')}
                    alt=''
                    className={`w-full rounded-lg border-4 ${state === 'attempt_failed' ? 'border-red-500' : 'border-transparent'}`}
                  />
                )}
                {capturing && <p className='mt-3 text-sm text-base-500'>Keep your face inside the oval.</p>}
              </div>
              <div className='w-80 flex flex-col justify-center rounded-lg bg-base-100 p-6'>
                {state === 'analysing' ? (
                  <div className='flex flex-col items-center gap-4'>
                    <Loader size='md' />
                    <p className='text-sm font-semibold text-base-700'>{screen.title}</p>
                  </div>
                ) : (
                  <>
                    <h3 className='text-xl font-bold text-base-700'>{state === 'attempt_failed' ? screen.title : "Verify it's you"}</h3>
                    {screen.attempt && <div className='mt-3'><AttemptChip current={screen.attempt.current} max={screen.attempt.max} /></div>}
                    <p className='mt-3 text-sm text-base-500'>
                      {liveness && 'Follow the prompts in the camera window. Keep your face inside the oval.'}
                      {capturing && (cameraReady ? 'You are in frame. Start when ready.' : 'Waiting for you to get in frame')}
                      {state === 'attempt_failed' && 'Check the positioning guide, then try again.'}
                    </p>
                  </>
                )}
              </div>
            </div>
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
                  {busy ? 'Starting…' : 'Start face scan'}
                </Button>
              )}
              {state === 'attempt_failed' && screen.canRetry && (
                <Button variant='primary' size='lg' onClick={handleRetry}>Try again</Button>
              )}
              {state === 'attempt_failed' && (
                <Button variant='outline' size='lg' onClick={() => setGuideOpen(true)}>View positioning guide</Button>
              )}
              {continueButton}
            </div>
          </IdentityCard>
        )}

        {(state === 'verified' || state === 'captured') && (
          <IdentityCard>
            <div className='flex gap-8 items-center'>
              <img src={identityMedia(baseUrl, 'illus-face.jpg')} alt='' className='w-72 rounded-lg border-4 border-green-600' />
              <div className='flex-1'>
                <h3 className='text-xl font-bold text-base-700'>{screen.title}</h3>
                {screen.body && <p className='mt-2 text-sm text-base-500'>{screen.body}</p>}
                <CheckRows rows={verifiedRows} />
              </div>
            </div>
            <label className='mt-6 flex items-start gap-3 text-sm text-base-500 cursor-pointer'>
              <Checkbox checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} className='mt-0.5' />
              {VERIFIED_CONFIRMATION}
            </label>
            <Button variant='primary' size='lg' className='mt-6 items-center gap-3' disabled={!confirmed} onClick={handleContinue}>
              Proceed to next step
              <ArrowRight className='w-6 h-6' />
            </Button>
          </IdentityCard>
        )}

        {state === 'blocked' && (
          <IdentityCard banner={screen.banner || screen.title}>
            <h3 className='text-xl font-bold text-base-700'>{screen.title}</h3>
            <p className='mt-3 text-base text-base-500'>{screen.body}</p>
            {screen.referenceId && (
              <p className='mt-6 text-base font-bold text-base-700'>Reference ID: {screen.referenceId}</p>
            )}
          </IdentityCard>
        )}

        {state === 'service_error' && (
          <IdentityCard>
            <h3 className='text-xl font-bold text-base-700'>{screen.title}</h3>
            <p className='mt-3 text-base text-base-500'>{screen.body}</p>
            <div className='mt-8 flex items-center gap-6'>
              <Button variant='primary' size='lg' onClick={handleRetry}>Try again</Button>
              {continueButton}
            </div>
          </IdentityCard>
        )}

        <HelpLine onOpen={() => setGuideOpen(true)} />
      </div>
      <PositioningModal baseUrl={baseUrl} isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
};

export default IdentityVerificationStep;
