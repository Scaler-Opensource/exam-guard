import React, { useCallback, useState, useEffect } from 'react';
import classNames from 'classnames';
// import { toast } from 'react-toastify';

import { useDispatch } from 'react-redux';
import {
  ArrowRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import useProctorPolling from '@/hooks/useProctorPolling';
import { MIN_SNAPSHOT_COUNT } from '@/utils/constants';

import Loader from '@/ui/Loader';
import { nextSubStep, selectStep, setStepSetupMode } from '@/store/features/workflowSlice';
import { useAppSelector } from '@/hooks/reduxhooks';
import SnapshotFailed from './SnapshotFailed';
import Carousel from '@/ui/Carousel';
import ProgressBar from '@/ui/ProgressBar';
import RealTimeCheckResult from './RealTimeCheckResult';
import { useValidateImagePositionMutation } from '@/services/mobilePairingService';
import PositionGuideModal from './PositionGuideModal';
import CheckOrientationModal from './CheckOrientationModal';

import styles from './MobileCameraStep.module.scss';

function downloadImageAndConvertToFile(imageUrl, filename) {
  return new Promise((resolve, reject) => {
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        // Create a File object from the blob
        const file = new File([blob], filename, { type: blob.type });
        resolve(file);
      })
      .catch((error) => {
        console.error('Error downloading image:', error);
        reject(error);
      });
  });
}

function Orientation({
  className, setSwitchModalOpen,
}) {
  const {
    setupMode,
  } = useAppSelector((state) => (
    selectStep(state, 'mobileCameraShare')
  ));
  const dispatch = useDispatch();
  const [isChecked, setIsChecked] = useState(false);
  const [snapshotCollected, setSnapshotCollected] = useState(false);
  const [snapShotCount, setSnapshotCount] = useState(0);
  const [previousSnapshot, setPreviousSnapshot] = useState(null);
  const [realTimeCheckPassed, setRealTimeCheckPassed] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [positionCheckResult, setPositionCheckResult] = useState([]);
  const [isPositionGuideModalOpen, setPositionGuideModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isOrientationCheckModalOpen, setOrientationCheckModalOpen] = useState(false);
  const { enableProctoring } = useAppSelector((state) => state.workflow);
  const [validateImagePosition, {
    isLoading:
     isEvaluatingPosition,
  }] = useValidateImagePositionMutation();
  const [validationAttempts, setValidationAttempts] = useState(0);

  const handlePositionGuideModalClose = useCallback(() => {
    setPositionGuideModalOpen(false);
  }, []);

  const validatePosition = useCallback(async () => {
    if (isEvaluatingPosition || !snapshotCollected) return;

    try {
      // Increment attempt counter
      setValidationAttempts((prev) => prev + 1);

      const imageFile = await downloadImageAndConvertToFile(imageUrl, 'image.png');
      const response = await validateImagePosition({
        imageFile,
      });

      if (response?.data) {
        const {
          success,
          result,
        } = response.data;

        if (success) {
          setPositionCheckResult(result?.setup_validations || []);
        } else {
          throw new Error('Validation failed');
        }
        if (result?.is_valid) {
          setRealTimeCheckPassed(true);
        }
      } else {
        throw new Error('Validation failed');
      }
    } catch (error) {
      toast.error('Validation failed. Please try again');

      // If we've reached 3 attempts, automatically pass the check
      if (validationAttempts >= 2) { // Using 2 since we already incremented above
        setOrientationCheckModalOpen(true);
      }
    }
  }, [validateImagePosition,
    imageUrl,
    isEvaluatingPosition,
    snapshotCollected,
    validationAttempts,
  ]);

  useEffect(() => {
    const fetchImageUrl = async () => {
      if (previousSnapshot) {
        try {
          const response = await fetch(previousSnapshot, {
            headers: {
              Accept: 'application/json',
            },
          });
          const data = await response.json();
          setImageUrl(data.url);
        } catch (error) {
          console.error('Error fetching image URL:', error);
        }
      }
    };

    fetchImageUrl();
  }, [previousSnapshot]);

  const collectSnapshots = useCallback((snapShotData) => {
    const snapshotLength = snapShotData?.metadata?.length || 0;
    setSnapshotCount(snapshotLength);

    if (snapshotLength > 0) {
      const lastSnapshot = snapShotData?.metadata?.[snapShotData.metadata.length - 1]?.value;

      if (previousSnapshot !== lastSnapshot) setPreviousSnapshot(lastSnapshot);
    }
  }, [previousSnapshot]);

  const handleSnapshotSuccess = useCallback((snapShotData) => {
    collectSnapshots(snapShotData);
    if (!snapshotCollected) {
      setSnapshotCount(MIN_SNAPSHOT_COUNT);
      setSnapshotCollected(true);
      setPositionGuideModalOpen(true);
    }
  }, [collectSnapshots, snapshotCollected]);

  const handleSnapshotFailure = useCallback((snapShotData) => {
    collectSnapshots(snapShotData);
  }, [collectSnapshots]);

  const handleProceed = useCallback(() => {
    dispatch(nextSubStep());
    dispatch(setStepSetupMode({
      step: 'mobileCameraShare',
      setupMode: false,
    }));
  }, [dispatch]);

  useEffect(() => {
    setCountdown(5); // Reset countdown to 5 seconds
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [previousSnapshot]); // Dependency on snapshot updates

  useProctorPolling({
    onSnapshotSuccess: handleSnapshotSuccess,
    onSnapshotFailure: handleSnapshotFailure,
  });

  const proceedButtonUi = () => (
      <Button
        type="submit"
        className="mt-8 items-center py-8 px-10"
        disabled={!isChecked}
        variant="primary">
        Proceed to next step
        <ArrowRight className="w-6 h-6" />
      </Button>);

  const checkOrientationButtonUi = () => (
      <Button
        type="submit"
        className="mt-8 items-center py-8 px-10"
        disabled={isEvaluatingPosition || !snapshotCollected}
        variant="primary">
        Check orientation
        <ArrowRight className="w-6 h-6" />
      </Button>
  );

  const buttonUi = () => {
    if (snapshotCollected && realTimeCheckPassed) {
      return proceedButtonUi();
    }
    return checkOrientationButtonUi();
  };

  if (enableProctoring && !setupMode) {
    return (<SnapshotFailed setSwitchModalOpen={setSwitchModalOpen} />);
  }

  return (
    <div className="flex flex-col">
      <section className="py-4 px-10 text-xs text-center bg-[#E6F2FF] absolute top-0 left-0 w-full font-bold">
        Auto fetching next snapshot in <time>{countdown}</time> seconds...
      </section>
      <div className={classNames(
        styles.orientationContainer,
        'mt-10',
        { [className]: className },
      )}>
        {positionCheckResult.length === 0 && !isEvaluatingPosition && (
          <section className={styles.referenceImageContainer}>
            <Carousel items={[
              {
                image: 'https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/099/601/original/Dec_10_Screenshot_Rounded_Corner.png?1733823148',
                text: 'Position phone against a strong surface',
              },
              {
                image: 'https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/099/593/original/Iterations_Image_4936.png?1733821016',
                text: 'Adjust and verify your phone basis snapshot',
              },
              {
                image: 'https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/099/594/original/IMG_4940_1.png?1733821035',
                text: 'Once ready, click on proceed',
              },
            ]}/>
            </section>
        )}
        <section className={styles.snapshotPreviewContainer}>
          {/* Snapshot section */}
          <div className={styles.snapshotPreview}>
            <div className={styles.snapshotImageContainer}>
              {imageUrl
                ? <img className={styles.snapshotImage}
                  src={imageUrl} alt="snapshot"/>
                : (<div className="absolute top-1/2 right-1/2 transform translate-x-1/2 translate-y-[-50%]">
                    <Loader size='md'/>
                    <div className='text-xs text-center mt-2'>Collecting Snapshot...</div>
                  </div>)
              }
            </div>
          </div>
          <ProgressBar className='mt-4' value={parseInt((snapShotCount / MIN_SNAPSHOT_COUNT) * 100, 10)} />
          <div className="flex flex-col text-center mt-4">
            <div className="text-xs text-gray-500 mt-2">
            {snapShotCount === MIN_SNAPSHOT_COUNT ? (<>Snapshot covering you and your workspace?
            {' '}
            <b>If yes, proceed. If not, adjust and confirm with next snapshot</b></>)
              : (<><b>Capturing 3 mandatory snaps</b>
                ...adjust your phone to capture both hands, workspace and your head
              </>
              )}
            </div>
          </div>
        </section>
        {((positionCheckResult
        && Array.isArray(positionCheckResult)
         && positionCheckResult.length > 0)
        || isEvaluatingPosition) && <RealTimeCheckResult
          setPositionGuideModalOpen={setPositionGuideModalOpen}
          positionCheckResult={positionCheckResult}
          isLoading={isEvaluatingPosition}
        />}
      </div>
      <div className="mt-16">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (snapshotCollected) {
              ((realTimeCheckPassed && isChecked)
                ? handleProceed : validatePosition)();
            }
          }}
        >
          {realTimeCheckPassed && snapshotCollected ? (
            <div className="flex items-start gap-2 mt-6 text-sm">
              <Checkbox
                id="confirm"
                className='mr-2 mt-1 h-6 w-6'
                checked={isChecked}
                onCheckedChange={(checked) => setIsChecked(checked)}
                disabled={!snapshotCollected}
              role="checkbox"
              required={snapshotCollected}
            />
           <label htmlFor="confirm" className="text-sm text-gray-600">
              By clicking on this, you confirm that your mobile phone is paired
              and will remain charged during the test. If disconnected, you&apos;ll
              need to reconnect before being able to continue with the test.
            </label>
          </div>
          ) : null}
          <div className="flex items-center">
            {buttonUi()}
            <Button
              className='mt-8 items-center py-8 px-10 ml-6'
              variant='outline'
              onClick={() => setSwitchModalOpen(true)}
              type="button"
            >
              Scan QR Code again
            </Button>
          </div>
        </form>
      </div>
      <PositionGuideModal
        isOpen={isPositionGuideModalOpen}
        onProceed={() => {
          validatePosition();
          setPositionGuideModalOpen(false);
        }}
        onClose={handlePositionGuideModalClose}
      />
      <CheckOrientationModal
        isOpen={isOrientationCheckModalOpen}
        onClose={() => {
          setRealTimeCheckPassed(true);
          setOrientationCheckModalOpen(false);
        }}
      />
    </div>
  );
}

export default Orientation;
