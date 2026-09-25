import { AppDispatch } from '@/store/store';
import {
  setSubStepStatus,
  setActiveStep,
  setActiveSubStep,
  setModalOpen,
  setIsDisqualified,
} from '@/store/features/workflowSlice';
import { StepState } from '@/types/workflowTypes';
import { store } from '@/store/store';

const CHECK_TO_STEP_MAP: Record<string, { step: string; subStep: string }> = {
  screenshare: { step: 'screenShare', subStep: 'screenShare' },
  webcam: { step: 'cameraShare', subStep: 'cameraShare' },
  mobileSetup: { step: 'mobileCameraShare', subStep: 'codeScan' },
  mobileSnapshot: { step: 'mobileCameraShare', subStep: 'cameraPairing' },
  mobileBattery: { step: 'mobileCameraShare', subStep: 'systemChecks' },
  browser: { step: 'compatibilityChecks', subStep: 'systemChecks' },
  networkSpeed: { step: 'compatibilityChecks', subStep: 'networkChecks' },
  fullscreen: { step: 'compatibilityChecks', subStep: 'fullScreenCheck' },
};

export default class CompatibilityHandlers {
  private dispatch: AppDispatch;
  private steps: Record<string, StepState>;
  private readonly CHECK_ORDER = [
    'screenshare',
    'webcam',
    'mobileSetup',
    'mobileSnapshot',
    'mobileBattery',
    'browser',
    'networkSpeed',
    'fullscreen',
  ];

  constructor(dispatch: AppDispatch, steps: Record<string, StepState>) {
    this.dispatch = dispatch;
    this.steps = steps;
  }

  handleFullScreenEnabled = () => {
    this.dispatch(
      setSubStepStatus({
        step: 'compatibilityChecks',
        subStep: 'fullScreenCheck',
        status: 'completed',
        clearError: true,
      }),
    );
  };

  handleFullScreenDisabled = () => {
    // this.dispatch(setActiveStep('compatibilityChecks'));
    // this.dispatch(
    //   setSubStepStatus({
    //     step: 'compatibilityChecks',
    //     subStep: 'fullScreenCheck',
    //     status: 'error',
    //   }),
    // );
  };

  handleDisqualifyUser = () => {
    store.getState().assessmentInfo?.proctor?.handleCleanup();
    this.dispatch(setModalOpen(false));
    this.dispatch(setIsDisqualified(true));
  };

  handleCompatibilityCheckSuccess = () => {
    const enableProctoring = store.getState().workflow.enableProctoring;
    Object.values(CHECK_TO_STEP_MAP).forEach((mapping) => {
      this.dispatch(
        setSubStepStatus({
          step: mapping.step as
            | 'compatibilityChecks'
            | 'cameraShare'
            | 'screenShare',
          subStep: mapping.subStep,
          status: 'completed',
          clearError: true,
        }),
      );
    });
    if (enableProctoring) {
      this.dispatch(setModalOpen(false));
    }
  };

  handleCompatibilityCheckFail = (errorCode: {
    passedChecks: Record<string, boolean>;
  }) => {
    let hasSetActiveStep = false;
    const hasSetActiveSubStepPerStep: Record<string, boolean> = {};
    const modalOpen = false;

    this.CHECK_ORDER.forEach((check) => {
      if (!(check in errorCode.passedChecks)) return;

      const passed = errorCode.passedChecks[check];
      const mapping = CHECK_TO_STEP_MAP[check];

      const isStepEnabled = this.steps[mapping.step]?.enabled;

      if (mapping && isStepEnabled) {
        this.dispatch(
          setSubStepStatus({
            step: mapping.step as
              | 'compatibilityChecks'
              | 'cameraShare'
              | 'screenShare',
            subStep: mapping.subStep,
            status: passed ? 'completed' : 'error',
            clearError: passed,
          }),
        );

        if (!passed && !hasSetActiveStep && !modalOpen) {
          this.dispatch(
            setActiveStep(
              mapping.step as
                | 'compatibilityChecks'
                | 'cameraShare'
                | 'screenShare',
            ),
          );
          this.dispatch(setModalOpen(true));
          hasSetActiveStep = true;
        }
        if (
          !passed &&
          !hasSetActiveSubStepPerStep[mapping.step] &&
          !modalOpen
        ) {
          this.dispatch(
            setActiveSubStep({
              step: mapping.step as
                | 'compatibilityChecks'
                | 'cameraShare'
                | 'screenShare',
              subStep: mapping.subStep,
            }),
          );
          hasSetActiveSubStepPerStep[mapping.step] = true;
        }
      }
    });
  };
}
