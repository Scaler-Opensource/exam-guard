import React, { useEffect, useRef } from 'react';

// The proctoring-hosted liveness page in an iframe. Exam-guard only hands it the nonce; the page
// gets the stream credentials from the proctoring service itself, and the result is read by the
// service from Rekognition, so these messages only drive the UI.
const PROTOCOL_VERSION = 1;

export type LivenessOutcome = { type: 'complete' } | { type: 'error'; code: string; message?: string } | { type: 'close' };

interface Props {
  url: string;
  nonce: string;
  traceparent?: string | null;
  onDone: (outcome: LivenessOutcome) => void;
  className?: string;
}

const LivenessFrame = ({
  url, nonce, traceparent, onDone, className = 'mt-8 w-full max-w-2xl h-[640px]',
}: Props) => {
  const frame = useRef<HTMLIFrameElement>(null);
  const origin = new URL(url).origin;

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data || {};
      if (data.source !== 'proctoring-liveness' || data.version !== PROTOCOL_VERSION) return;
      if (data.type === 'ready') {
        frame.current?.contentWindow?.postMessage({
          type: 'start', version: PROTOCOL_VERSION, nonce, traceparent: traceparent ?? undefined,
        }, origin);
      } else if (data.type === 'complete') {
        onDone({ type: 'complete' });
      } else if (data.type === 'error') {
        onDone({ type: 'error', code: String(data.code || 'liveness_error'), message: data.message ? String(data.message) : undefined });
      } else if (data.type === 'close') {
        onDone({ type: 'close' });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [origin, nonce, traceparent, onDone]);

  return (
    <iframe
      ref={frame}
      src={url}
      title='Liveness check'
      allow='camera'
      className={`${className} rounded-lg border border-base-200 bg-white`}
    />
  );
};

export default LivenessFrame;
