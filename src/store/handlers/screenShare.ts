import { AppDispatch } from '@/store/store';
import { ERROR_MESSAGES } from '@/constants/screenshot';
import {
  setSubStepStatus,
  setSubStepError,
  setActiveStep,
} from '@/store/features/workflowSlice';

export default class ScreenShareHandlers {
  private dispatch: AppDispatch;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  handleScreenShareSuccess = () => {
    this.dispatch(
      setSubStepStatus({
        step: 'screenShare',
        subStep: 'screenShare',
        status: 'completed',
        clearError: true,
      })
    );
  };

  handleScreenShareFailure = (errorCode: string) => {
    const errorMessage =
      ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] ||
      'Screen share validation failed. Please try again.';

    this.dispatch(setActiveStep('screenShare'));
    this.dispatch(
      setSubStepError({
        step: 'screenShare',
        subStep: 'screenShare',
        error: errorMessage,
      })
    );
  };

  handleScreenShareEnd = () => {
    this.dispatch(
      setSubStepError({
        step: 'screenShare',
        subStep: 'screenShare',
        error: 'Screen share ended unexpectedly. Please try again.',
      })
    );
  };

  handleScreenshotFailure = (err: any) => {
    console.error('Screenshot capture failed', err);
  };
}
