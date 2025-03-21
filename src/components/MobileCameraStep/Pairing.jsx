import React, {
  useCallback, useMemo, useRef, useState,
} from 'react';
import classNames from 'classnames';
import { Copy } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetQrCodeQuery } from '@/services/mobilePairingService';
import Loader from '@/ui/Loader';
import useProctorPolling from '@/hooks/useProctorPolling';
import { nextSubStep, setStepSetupMode } from '@/store/features/workflowSlice';
import { selectProctor } from '@/store/features/assessmentInfoSlice';

import styles from './MobileCameraStep.module.scss';

const Pairing = React.memo(({ className }) => {
  const dispatch = useDispatch();
  const [copySuccess, setCopySuccess] = useState(false);
  const copyLinkBoxRef = useRef(null);
  const proctor = useSelector(selectProctor);

  const qrCodeConfig = useMemo(() => ({
    payload: proctor?.qrCodeConfig?.defaultPayload || {},
    endpoint: proctor?.qrCodeConfig?.endpoint,
  }), [proctor?.qrCodeConfig]);

  const {
    data,
    isFetching: isQrCodeLoading,
    isError: qrCodeError,
  } = useGetQrCodeQuery({
    endpoint: qrCodeConfig.endpoint,
  });

  const handleSetupSuccess = useCallback(() => {
    dispatch(nextSubStep());
    dispatch(setStepSetupMode({
      step: 'mobileCameraShare',
      setupMode: true,
    }));
  }, [dispatch]);

  const handleSetupFailure = useCallback(() => {
    // Do nothing
  }, []);

  const pollingCallbacks = useMemo(() => ({
    onSetupSuccess: handleSetupSuccess,
    onSetupFailure: handleSetupFailure,
  }), [handleSetupSuccess, handleSetupFailure]);

  useProctorPolling(pollingCallbacks, 5000);

  const handleCopyClick = useCallback(() => {
    const linkToCopy = copyLinkBoxRef.current ? copyLinkBoxRef.current.textContent : '';

    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy).then(
        () => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        },
        (err) => {
          console.error('Error copying text: ', err);
          setCopySuccess(false);
        },
      );
    }
  }, []);

  const qrCodeImage = useMemo(() => {
    if (isQrCodeLoading || qrCodeError || !data?.qrcode) {
      return <Loader size='md' />;
    }
    return <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(data?.qrcode)}`} alt="qr-code" />;
  }, [data?.qrcode, isQrCodeLoading, qrCodeError]);

  return (
    <div className={classNames({ [className]: className })}>
      <div className={styles.pairingContainer}>
        <section className={styles.qrCodeContainer}>
          {qrCodeImage}
        </section>
        <div className={styles.divider}>
          <div className={styles.dividerLine}></div>
          <div className={styles.dividerText}> OR </div>
          <div className={styles.dividerLine}></div>
        </div>
        <section className={styles.copyLinkContainer}>
          <header className={styles.copyLinkHeading}>
            Pair mobile via link
          </header>
          <article className={styles.copyLinkBody}>
            Copy link to open on your mobile. It might take few sec to load
          </article>
          <section className={styles.copyLinkOption}>
            <div className={styles.copyLinkBox} ref={copyLinkBoxRef}>{data?.link}</div>
            <span className={styles.copyLinkText} onClick={handleCopyClick}>
              <Copy className={styles.copyIcon} />
              {copySuccess ? (
                <div className={styles.copySuccessMessage}>
                  Copied!
                </div>
              ) : 'Copy'}
            </span>
          </section>
        </section>
      </div>
      <section className="mt-10">
          <article className={styles.orientationInstructions}>
            <heading className={styles.orientationInstructionHeading}>
              Instructions :
            </heading>
            <ul className={styles.orientationInstructionPoints}>
              <li>Scan the QR code using your Android/iOS device
               or use the link to open it on your mobile phone.</li>
              <li>
                Tap the link to open it in your default
                browser and follow the instructions to grant camera access
              </li>
              <li>
                Place your mobile device on a stable surface.
              </li>
              <li>
                Choose landscape or portrait orientation, ensuring your desktop,
                 hands, and workspace are clearly visible with proper lighting.
              </li>
            </ul>
          </article>
        </section>
    </div>
  );
});

Pairing.displayName = 'Pairing';

export default Pairing;
