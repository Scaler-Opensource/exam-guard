import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { ArrowRight } from 'lucide-react';

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
import {
  CAPTURE_COPY, CONSENT_COPY, CONSENT_VERSION, LIVENESS_TIPS, PHOTOSENSITIVITY_NOTE, VERIFIED_CONFIRMATION,
  identityScreen, startsLivenessAfterConsent,
} from '@/utils/identityScreen';
import { CameraSignals, cameraSignals } from '@/utils/cameraIntegrity';
import { WorkflowStepKey } from '@/types/workflowTypes';
import ConsentCard from './ConsentCard';
import LivenessFrame, { LivenessOutcome } from './LivenessFrame';
import PositioningModal from './PositioningModal';
import {
  CameraFrame, CheckRows, FixBox, HelpLine, IdentityCard, IdlePanel, IllustrationPanel, InfoRow, PanelHeading, Split, TwoColumns,
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
  const [agreed, setAgreed] = useState(false);
  const [declined, setDeclined] = useState(false);
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

  // The camera preview is only for the selfie path. With liveness, the liveness page opens the
  // camera itself, and some drivers won't open one camera twice.
  const capturing = state === 'capture' && !livenessOn;
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
    ...cameraSignals(streamRef.current?.getVideoTracks()[0]?.label ?? previousLabel),
    previous_camera_label: previousLabel || undefined,
  });

  const refreshStatus = useCallback(() => {
    if (token) fetchIdentityStatus({ baseUrl, token }).then(applyStatus).catch(() => setLoadAttempt((n) => n + 1));
  }, [baseUrl, token, applyStatus]);

  const handleConsent = async () => {
    if (!token) return;
    setBusy(true);
    setError('');
    let identity: IdentityStatus;
    try {
      identity = await recordConsent({ baseUrl, token, version: CONSENT_VERSION });
      applyStatus(identity);
    } catch (err) {
      setError(errorText(err instanceof IdentityApiError ? err.message : 'request_failed'));
      setBusy(false);
      return;
    }
    setBusy(false);
    // Start was the candidate's go-ahead, so the liveness check opens without another click.
    if (startsLivenessAfterConsent(identity, policy)) startLiveness();
  };

  async function startLiveness() {
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
  }

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
    if (livenessOn) startLiveness();
  };

  const handleContinue = () => dispatch(nextStep());
  const openGuide = () => setGuideOpen(true);
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

  const continueButton = (label = 'Continue') => screen.canProceed && !liveness && (
    <Button variant='outline' size='lg' className='items-center gap-3' onClick={handleContinue} disabled={busy}>
      {label}
      <ArrowRight className='w-6 h-6' />
    </Button>
  );
  const guideButton = <Button variant='outline' size='lg' onClick={openGuide}>See how to do it</Button>;
  const checkboxRow = (id: string, checked: boolean, onChange: (value: boolean) => void, label: string) => (
    <div className='flex items-start text-sm'>
      <Checkbox id={id} className='mt-1 mr-4 h-6 w-6' checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      <label htmlFor={id} className='cursor-pointer text-sm text-gray-600'>{label}</label>
    </div>
  );
  const rows = ['We saw your face', ...(livenessOn ? ['We know you are really there'] : []),
    ...(state === 'verified' ? ['Your face matches the photo on your record'] : [])];

  let card: React.ReactNode = null;
  let footer: React.ReactNode = null;
  if (state === 'consent') {
    card = <ConsentCard baseUrl={baseUrl} livenessOn={livenessOn} onOpenGuide={openGuide} />;
    footer = (
      <>
        {checkboxRow('identity-consent', agreed, setAgreed, CONSENT_COPY.checkbox)}
        <div className='mt-8 flex items-center gap-6'>
          <Button variant='primary' size='lg' className='items-center gap-3' disabled={!agreed || busy} onClick={handleConsent}>
            {busy ? 'Starting…' : 'Start face check'}
            <ArrowRight className='w-6 h-6' />
          </Button>
          <Button variant='outline' size='lg' onClick={() => setDeclined(true)}>I do not agree</Button>
        </div>
        {declined && !agreed && <p className='mt-4 text-sm text-red-500'>{CONSENT_COPY.declined}</p>}
        {error && <p className='mt-4 text-sm text-red-500'>{error}</p>}
      </>
    );
  } else if (state === 'capture' && livenessOn) {
    card = liveness ? (
      <IdentityCard banner={error}>
        <LivenessFrame url={liveness.url} nonce={liveness.nonce} onDone={handleLivenessDone} className='h-[60rem] w-full' />
        <p className='mt-3 text-center text-sm text-base-500'>{CAPTURE_COPY.caption}</p>
      </IdentityCard>
    ) : (
      <IdentityCard banner={error}>
        <Split>
          <IllustrationPanel tone='info' baseUrl={baseUrl} />
          <div>
            <PanelHeading title={busy ? 'Opening the face check…' : 'Ready for your face check'} />
            <ul className='mt-4 list-disc space-y-1 pl-5 text-base leading-relaxed text-base-500'>
              {LIVENESS_TIPS.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
            <p className='mt-4 rounded-md bg-scaler-100 px-4 py-3 text-sm text-base-700'>{PHOTOSENSITIVITY_NOTE}</p>
          </div>
        </Split>
      </IdentityCard>
    );
    footer = !liveness && (
      <div className='flex items-center gap-6'>
        <Button variant='primary' size='lg' className='items-center gap-3' disabled={busy} onClick={startLiveness}>
          {busy ? 'Starting…' : 'Start face check'}
          <ArrowRight className='w-6 h-6' />
        </Button>
        {guideButton}
        {continueButton('Continue without verifying')}
      </div>
    );
  } else if (state === 'capture') {
    card = (
      <IdentityCard banner={error}>
        <TwoColumns>
          <div>
            <CameraFrame ring={cameraReady ? 'framed' : 'searching'} pill={CAPTURE_COPY.pill} live>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onLoadedData={() => setCameraReady(true)}
                className='h-full w-full object-cover'
                style={{ transform: 'scale(-1, 1)' }}
              />
            </CameraFrame>
            <p className='mt-3 text-center text-sm text-base-500'>{CAPTURE_COPY.caption}</p>
          </div>
          <IdlePanel spinner={!cameraReady}>
            {cameraReady ? CAPTURE_COPY.ready : CAPTURE_COPY.waiting}
          </IdlePanel>
        </TwoColumns>
      </IdentityCard>
    );
    footer = capturing && (
      <div className='flex items-center gap-6'>
        <Button variant='primary' size='lg' className='items-center gap-3' disabled={!cameraReady || busy}
          onClick={handleCapture}>
          {busy ? 'Checking…' : 'Start face check'}
          <ArrowRight className='w-6 h-6' />
        </Button>
        {guideButton}
        {continueButton('Continue without verifying')}
      </div>
    );
  } else if (state === 'analysing') {
    card = (
      <IdentityCard>
        <Split>
          <IllustrationPanel tone='info' baseUrl={baseUrl} />
          <IdlePanel>{screen.title}</IdlePanel>
        </Split>
      </IdentityCard>
    );
  } else if (state === 'verified' || state === 'captured') {
    card = (
      <IdentityCard>
        <Split>
          <IllustrationPanel tone='success' baseUrl={baseUrl} />
          <div>
            <PanelHeading title={screen.title} sub={screen.body} done />
            <CheckRows rows={rows} />
          </div>
        </Split>
      </IdentityCard>
    );
    footer = (
      <>
        {checkboxRow('identity-confirm', confirmed, setConfirmed, VERIFIED_CONFIRMATION)}
        <Button variant='primary' size='lg' className='mt-8 items-center gap-3' disabled={!confirmed} onClick={handleContinue}>
          Next step
          <ArrowRight className='w-6 h-6' />
        </Button>
      </>
    );
  } else if (state === 'attempt_failed') {
    card = (
      <IdentityCard banner={error || screen.banner}>
        <Split>
          <IllustrationPanel tone='error' baseUrl={baseUrl} />
          <div>
            <PanelHeading title={screen.title} sub={screen.body} />
            <FixBox tip={screen.tip} onOpenGuide={openGuide} />
            {screen.attemptsLeft != null && <InfoRow label='Attempts left' value={screen.attemptsLeft} />}
          </div>
        </Split>
      </IdentityCard>
    );
    footer = (
      <div className='flex items-center gap-6'>
        {screen.canRetry && <Button variant='primary' size='lg' onClick={handleRetry}>Try again</Button>}
        {guideButton}
        {continueButton()}
      </div>
    );
  } else if (state === 'blocked') {
    card = (
      <IdentityCard banner={screen.banner}>
        <Split>
          <IllustrationPanel tone='error' baseUrl={baseUrl} />
          <div>
            <PanelHeading title={screen.title} sub={screen.body} />
            <ul className='mt-4 list-disc space-y-2 pl-5 text-base text-base-500'>
              {screen.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
            </ul>
            {screen.referenceId && <InfoRow label='Reference ID' value={screen.referenceId} />}
          </div>
        </Split>
      </IdentityCard>
    );
  } else if (state === 'service_error') {
    card = (
      <IdentityCard banner={screen.banner}>
        <Split>
          <IllustrationPanel tone='neutral' baseUrl={baseUrl} />
          <div>
            <PanelHeading title={screen.title} sub={screen.body} />
            {screen.attemptsUsed != null && <InfoRow label='Attempts used' value={screen.attemptsUsed} />}
          </div>
        </Split>
      </IdentityCard>
    );
    footer = (
      <div className='flex items-center gap-6'>
        <Button variant='primary' size='lg' onClick={handleRetry}>Try again</Button>
        {continueButton()}
      </div>
    );
  }

  return (
    <>
      {header}
      <div className='mt-16 w-full'>
        {card}
        <HelpLine onOpen={openGuide} />
        {footer && <div className='mt-16'>{footer}</div>}
      </div>
      <PositioningModal baseUrl={baseUrl} isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
};

export default IdentityVerificationStep;
