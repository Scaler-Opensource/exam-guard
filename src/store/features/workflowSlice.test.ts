import reducer, {
  nextStep,
  setBulkStepEnabled,
  setActiveStep,
  setOnWorkflowComplete,
} from '@/store/features/workflowSlice';
import assessmentInfoReducer, { fetchToken } from '@/store/features/assessmentInfoSlice';
import { IdentityPolicy } from '@/utils/identityVerification';
import { WorkflowState } from '@/types/workflowTypes';

const tokenFetched = (identity: IdentityPolicy | null) => fetchToken.fulfilled(
  { token: 'jwt', identity },
  'request-id',
  { baseUrl: '', payload: {} },
);

const withSteps = (identityEnabled: boolean): WorkflowState => reducer(undefined, setBulkStepEnabled({
  cameraShare: { step: 'cameraShare', enabled: true },
  screenShare: { step: 'screenShare', enabled: false },
  mobileCameraShare: { step: 'mobileCameraShare', enabled: false },
  compatibilityChecks: { step: 'compatibilityChecks', enabled: true },
  identityVerification: { step: 'identityVerification', enabled: identityEnabled },
}));

describe('workflowSlice identity verification step', () => {
  it('runs right after the desktop camera, before the other steps', () => {
    let state = withSteps(true);
    expect(state.activeStep).toBe('cameraShare');
    state = reducer(state, nextStep());
    expect(state.activeStep).toBe('identityVerification');
    expect(state.steps.identityVerification.locked).toBe(false);

    state = reducer(state, nextStep());
    expect(state.activeStep).toBe('compatibilityChecks');
  });

  it('starts at the first enabled step in wizard order, whatever order the host lists them', () => {
    const state = reducer(undefined, setBulkStepEnabled({
      compatibilityChecks: { step: 'compatibilityChecks', enabled: true },
      screenShare: { step: 'screenShare', enabled: true },
      mobileCameraShare: { step: 'mobileCameraShare', enabled: false },
      identityVerification: { step: 'identityVerification', enabled: true },
      cameraShare: { step: 'cameraShare', enabled: false },
    }));
    expect(state.activeStep).toBe('identityVerification');
  });

  it('stays enabled when the template verifies identity', () => {
    const state = reducer(withSteps(true), tokenFetched({ mode: 'required', required: true }));
    expect(state.steps.identityVerification.enabled).toBe(true);
  });

  it('is dropped when the template does not verify identity', () => {
    const state = reducer(withSteps(true), tokenFetched({ mode: 'off', required: false }));
    expect(state.steps.identityVerification.enabled).toBe(false);
    expect(state.activeStep).toBe('cameraShare');
  });

  it('moves on to the next step when it is dropped while active', () => {
    const onComplete = jest.fn();
    let state = reducer(withSteps(true), setOnWorkflowComplete(onComplete));
    state = reducer({ ...state, modalOpen: true }, setActiveStep('identityVerification'));

    state = reducer(state, tokenFetched(null));

    expect(state.steps.identityVerification.enabled).toBe(false);
    expect(state.activeStep).toBe('compatibilityChecks');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('completes the workflow when the step dropped is the last one left', () => {
    const onComplete = jest.fn();
    let state = reducer(undefined, setBulkStepEnabled({
      cameraShare: { step: 'cameraShare', enabled: false },
      screenShare: { step: 'screenShare', enabled: false },
      mobileCameraShare: { step: 'mobileCameraShare', enabled: false },
      compatibilityChecks: { step: 'compatibilityChecks', enabled: false },
      identityVerification: { step: 'identityVerification', enabled: true },
    }));
    state = reducer({ ...state, modalOpen: true }, setOnWorkflowComplete(onComplete));

    state = reducer(state, tokenFetched(null));

    expect(state.modalOpen).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('never enables itself when the host did not opt in', () => {
    const state = reducer(withSteps(false), tokenFetched({ mode: 'required', required: true }));
    expect(state.steps.identityVerification.enabled).toBe(false);
  });
});

describe('assessmentInfoSlice', () => {
  it('stores the token and the identity policy from init', () => {
    const state = assessmentInfoReducer(undefined, tokenFetched({ mode: 'advisory', required: false }));
    expect(state.token).toBe('jwt');
    expect(state.identity).toEqual({ mode: 'advisory', required: false });
  });
});
