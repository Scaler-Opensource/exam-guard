import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { ToastContainer } from 'react-toastify';
import { configureService as configureMobilePairingService } from '@/services/mobilePairingService';

import { useAppDispatch, useAppSelector } from '@/hooks/reduxhooks';
import {
  setAssessmentInfo,
  setProctor,
  fetchToken,
} from '@/store/features/assessmentInfoSlice';

import {
  setBulkStepEnabled,
  setModalOpen,
  setEnableProctoring,
  setOnWorkflowComplete,
  setBeepConfig,
} from '@/store/features/workflowSlice';
import CompatibilityHandlers from '@/store/handlers/compatibility';
import CompatibilityModal from '@/components/CompatibilityModal';
import Proctor from '@/proctor';
import ScreenShareHandlers from '@/store/handlers/screenShare';
import WebcamHandlers from '@/store/handlers/webcam';

import 'react-toastify/dist/ReactToastify.css';

const App = ({
  baseUrl,
  eventsConfig,
  disqualificationConfig,
  config,
  snapshotConfig,
  screenshotConfig,
  compatibilityCheckConfig,
  mobilePairingConfig,
  callbacks,
  enableAllAlerts,
  headerOptions,
  mockModeEnabled,
  assessmentInfo,
  qrCodeConfig,
  initConfig,
  enableProctoring: enableProctoringProp = false,
  beepConfig,
}) => {
  const dispatch = useAppDispatch();
  const { enableProctoring: enableProctoringState } = useAppSelector(
    (state) => state.workflow,
  );
  const { token } = useAppSelector((state) => state.assessmentInfo);
  const [initialised, setInitialised] = useState(false);
  const enableProctoring = enableProctoringProp || enableProctoringState;
  const { enabled: enabledScreenshotConfig } = screenshotConfig;
  const { enabled: enabledSnapshotConfig } = snapshotConfig;
  const { enabled: enabledMobilePairingConfig } = mobilePairingConfig;
  const { enabled: enabledCompatibilityCheckConfig } = compatibilityCheckConfig;
  const { enabled: enabledFullScreenConfig } = config?.fullScreen ?? {
    enabled: true,
  };

  const steps = useMemo(
    () => ({
      screenShare: {
        step: 'screenShare',
        enabled: enabledScreenshotConfig ?? true,
      },
      cameraShare: {
        step: 'cameraShare',
        enabled: enabledSnapshotConfig ?? true,
      },
      mobileCameraShare: {
        step: 'mobileCameraShare',
        enabled: enabledMobilePairingConfig ?? true,
      },
      compatibilityChecks: {
        step: 'compatibilityChecks',
        enabled: enabledCompatibilityCheckConfig ?? true,
        subSteps: {
          fullScreenCheck: enabledFullScreenConfig ?? true,
        },
      },
    }),
    [
      enabledScreenshotConfig,
      enabledSnapshotConfig,
      enabledMobilePairingConfig,
      enabledCompatibilityCheckConfig,
      enabledFullScreenConfig,
    ],
  );

  const proctor = useMemo(() => {
    const screenShareHandlers = new ScreenShareHandlers(dispatch);
    const webcamHandlers = new WebcamHandlers(dispatch);
    const compatibilityHandlers = new CompatibilityHandlers(
      dispatch,
      steps,
    );

    return new Proctor({
      baseUrl,
      eventsConfig,
      disqualificationConfig,
      config,
      snapshotConfig,
      screenshotConfig,
      compatibilityCheckConfig,
      mobilePairingConfig,
      callbacks: {
        onScreenShareSuccess: (...args) => {
          callbacks?.onScreenShareSuccess?.(...args);
          screenShareHandlers.handleScreenShareSuccess(...args);
        },
        onScreenShareFailure: (...args) => {
          callbacks?.onScreenShareFailure?.(...args);
          screenShareHandlers.handleScreenShareFailure(...args);
        },
        onScreenShareEnd: (...args) => {
          callbacks?.onScreenShareEnd?.(...args);
          screenShareHandlers.handleScreenShareEnd(...args);
        },
        onScreenshotSuccess: (...args) => {
          callbacks?.onScreenshotSuccess?.(...args);
        },
        onScreenshotFailure: (...args) => {
          callbacks?.onScreenshotFailure?.(...args);
          screenShareHandlers.handleScreenshotFailure(...args);
        },
        onWebcamEnabled: (...args) => {
          callbacks?.onWebcamEnabled?.(...args);
          webcamHandlers.onWebcamEnabled(...args);
        },
        onWebcamDisabled: (...args) => {
          callbacks?.onWebcamDisabled?.(...args);
          webcamHandlers.onWebcamDisabled(...args);
        },
        onSnapshotSuccess: (...args) => {
          callbacks?.onSnapshotSuccess?.(...args);
        },
        onSnapshotFailure: (...args) => {
          callbacks?.onSnapshotFailure?.(...args);
          webcamHandlers.onSnapshotFailure(...args);
        },
        onFullScreenEnabled: (...args) => {
          callbacks?.onFullScreenEnabled?.(...args);
          compatibilityHandlers.handleFullScreenEnabled(...args);
        },
        onFullScreenDisabled: (...args) => {
          callbacks?.onFullScreenDisabled?.(...args);
        },
        onDisqualified: (...args) => {
          callbacks?.onDisqualified?.(...args);
          compatibilityHandlers.handleDisqualifyUser(...args);
        },
        onCompatibilityCheckSuccess: (...args) => {
          callbacks?.onCompatibilityCheckSuccess?.(...args);
          compatibilityHandlers.handleCompatibilityCheckSuccess(...args);
        },
        onCompatibilityCheckFail: (...args) => {
          callbacks?.onCompatibilityCheckFail?.(...args);
          compatibilityHandlers.handleCompatibilityCheckFail(...args);
        },
      },
      enableAllAlerts,
      headerOptions,
      mockModeEnabled,
      qrCodeConfig,
      beepConfig,
    });
  }, [
    baseUrl,
    callbacks,
    compatibilityCheckConfig,
    config,
    dispatch,
    disqualificationConfig,
    enableAllAlerts,
    eventsConfig,
    headerOptions,
    mobilePairingConfig,
    mockModeEnabled,
    qrCodeConfig,
    screenshotConfig,
    snapshotConfig,
    steps,
    beepConfig,
  ]);

  const handleWorkflowComplete = useCallback(() => {
    callbacks?.onWorkflowComplete?.();
  }, [callbacks]);

  const fetchAuthToken = useCallback(() => {
    dispatch(fetchToken({
      baseUrl: initConfig?.baseUrl,
      payload: initConfig?.payload,
    }));
  }, [dispatch, initConfig]);

  useEffect(() => {
    const initializeProctoring = async () => {
      try {
        // Configure mobile pairing service with the baseUrl from props
        if (baseUrl) {
          configureMobilePairingService({ baseUrl });
        }

        if (enableProctoring) {
          await proctor.initializeProctoring();
          dispatch(setModalOpen(false));
        } else {
          dispatch(setModalOpen(true));
        }
        dispatch(setAssessmentInfo(assessmentInfo));
        dispatch(setEnableProctoring(enableProctoring));
        dispatch(setBeepConfig(beepConfig));
        dispatch(setOnWorkflowComplete(handleWorkflowComplete));
        dispatch(setProctor(proctor));
        dispatch(setBulkStepEnabled(steps));
      } catch (error) {
        console.error('Proctoring initialization failed:', error);
      }
    };
    if (!initialised) {
      initializeProctoring();
      setInitialised(true);

      if (!token) {
        fetchAuthToken();
      }
    }
  }, [assessmentInfo, baseUrl, callbacks, compatibilityCheckConfig,
    config, dispatch, disqualificationConfig, enableAllAlerts,
    enableProctoring, enableProctoringState, eventsConfig,
    handleWorkflowComplete, headerOptions, initialised,
    mobilePairingConfig, mockModeEnabled, proctor, qrCodeConfig,
    screenshotConfig, snapshotConfig, steps, fetchAuthToken, token, beepConfig]);

  return (
    <>
      <CompatibilityModal />
      <ToastContainer
        position="top-center"
        toastClassName="text-base"
        autoClose={8000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
};

export default App;
