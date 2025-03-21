import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Status,
  SubStepState,
  StepState,
  WorkflowState,
  WorkflowStepKey,
  StepEnableConfig,
} from '@/types/workflowTypes';

const createSubStep = (): SubStepState => ({
  status: 'locked',
  error: '',
  enabled: true,
});

const createStep = (subSteps: string[], locked = true): StepState => ({
  locked,
  acknowledged: false,
  activeSubStep: subSteps.length > 0 ? subSteps[0] : '',
  enabled: true,
  setupMode: false,
  subSteps: subSteps.reduce(
    (acc, step) => ({
      ...acc,
      [step]: createSubStep(),
    }),
    {}
  ),
});

const initialState: WorkflowState = {
  enableProctoring: false,
  modalOpen: false,
  isDisqualified: false,
  activeStep: 'screenShare',
  steps: {
    screenShare: createStep(['screenShare'], false),
    cameraShare: createStep(['cameraShare']),
    mobileCameraShare: createStep([
      'codeScan',
      'cameraPairing',
      'systemChecks',
    ]),
    compatibilityChecks: createStep([
      'systemChecks',
      'networkChecks',
      'fullScreenCheck',
    ]),
  },
  onWorkflowComplete: () => {},
  beepConfig: {
    enabled: false,
    sounds: {
      screenShare: '',
      cameraShare: '',
      mobileCameraShare: '',
      compatibilityChecks: '',
    },
  },
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setActiveStep(state, action: PayloadAction<WorkflowStepKey>) {
      state.activeStep = action.payload;
      state.steps[action.payload].locked = false;
    },

    setActiveSubStep(state, action: PayloadAction<{
      step: WorkflowStepKey;
      subStep: string
    }>) {
      const { step, subStep } = action.payload
      const currentStep = state.steps[step];
      currentStep.activeSubStep = subStep;
    },

    nextStep(state) {
      const steps = Object.keys(state.steps) as WorkflowStepKey[];
      const currentIndex = steps.indexOf(state.activeStep);
      
      const nextEnabledStepIndex = steps.findIndex((step, index) => 
        index > currentIndex && state.steps[step].enabled
      );

      if (nextEnabledStepIndex !== -1) {
        const nextStepKey = steps[nextEnabledStepIndex];
        if (state.steps[nextStepKey].locked) {
          state.steps[nextStepKey].locked = false;
        }
        state.activeStep = nextStepKey;
      } else {
        state.modalOpen = false;
        if (state.onWorkflowComplete) {
          state.onWorkflowComplete();
        }
      }
    },

    nextSubStep(state) {
      const currentStep = state.steps[state.activeStep];
      const currentSubSteps = currentStep.subSteps;
      if (!currentSubSteps || Object.keys(currentSubSteps).length <= 0) {
        return;
      }
    
      const subSteps = Object.keys(currentSubSteps);
      const currentSubStepIndex = subSteps.indexOf(currentStep.activeSubStep);
    
      if (currentSubStepIndex < subSteps.length - 1) {
        // Update the status of the current active sub-step to "completed"
        const currentSubStepKey = subSteps[currentSubStepIndex];
        currentSubSteps[currentSubStepKey].status = 'completed';
    
        // Move to the next sub-step
        const nextSubStepKey = subSteps[currentSubStepIndex + 1];
        currentSubSteps[nextSubStepKey].status = 'pending';
        currentStep.activeSubStep = nextSubStepKey;
      }
    },

    setStepLocked(
      state,
      action: PayloadAction<{
        step: WorkflowStepKey;
        locked: boolean;
      }>
    ) {
      const { step, locked } = action.payload;
      state.steps[step].locked = locked;
    },

    setStepSetupMode(
      state,
      action: PayloadAction<{
        step: WorkflowStepKey;
        setupMode: boolean;
      }>
    ) {
      const { step, setupMode } = action.payload;
      state.steps[step].setupMode = setupMode;
    },

    setStepAcknowledged(
      state,
      action: PayloadAction<{
        step: WorkflowStepKey;
        acknowledged: boolean;
      }>
    ) {
      const { step, acknowledged } = action.payload;
      state.steps[step].acknowledged = acknowledged;
    },

    setSubStepStatus(
      state,
      action: PayloadAction<{
        step: WorkflowStepKey;
        subStep: string;
        status: Status;
        clearError?: boolean;
      }>
    ) {
      const { step, subStep, status, clearError } = action.payload;
      state.steps[step].subSteps[subStep].status = status;
      if (clearError) {
        state.steps[step].subSteps[subStep].error = '';
      }

      if (state.enableProctoring) {
        const allCompleted = Object.entries(state.steps).every(([_, stepState]) => {
          if (!stepState.enabled) return true;
          
          return Object.values(stepState.subSteps).every(
            subStep => subStep.enabled && subStep.status === 'completed'
          );
        });

        if (allCompleted) {
          state.modalOpen = false;
        }
      }
    },

    setSubStepError(
      state,
      action: PayloadAction<{
        step: WorkflowStepKey;
        subStep: string;
        error: string;
      }>
    ) {
      const { step, subStep, error } = action.payload;
      state.steps[step].subSteps[subStep].status = 'error';
      state.steps[step].subSteps[subStep].error = error;
    },

    resetStep(
      state,
      action: PayloadAction<{
        step: WorkflowStepKey;
      }>
    ) {
      const { step } = action.payload;
      const subStepKeys = Object.keys(state.steps[step].subSteps);
      state.steps[step] = createStep(subStepKeys);
    },

    setBulkStepEnabled(
      state,
      action: PayloadAction<Record<WorkflowStepKey, StepEnableConfig>>
    ) {
      Object.values(action.payload).forEach(({ step, enabled, subSteps }) => {
        state.steps[step].enabled = enabled;
        
        if (subSteps) {
          Object.entries(subSteps).forEach(([subStep, isEnabled]) => {
            state.steps[step].subSteps[subStep].enabled = isEnabled;
          });
        }
      });

      const firstEnabledStep = Object.values(action.payload).find(
        ({ enabled }) => enabled
      )?.step;
      if (firstEnabledStep) {
        state.activeStep = firstEnabledStep;
      }
    },

    setModalOpen(state, action: PayloadAction<boolean>) {
      state.modalOpen = action.payload;
    },

    setEnableProctoring(
      state,
      action: PayloadAction<boolean>
    ) {
      state.enableProctoring = action.payload;

      if (action.payload) {
        Object.keys(state.steps).forEach((step) => {
          state.steps[step as WorkflowStepKey].locked = false;
        });
      }
    },

    setBeepConfig(state, action: PayloadAction<{
      enabled: boolean;
      sounds: Record<WorkflowStepKey, string>;
    }>) {
      state.beepConfig = action.payload;
    },

    setOnWorkflowComplete(
      state,
      action: PayloadAction<() => void>
    ) {
      state.onWorkflowComplete = action.payload;
    },

    setIsDisqualified(state, action: PayloadAction<boolean>) {
      state.isDisqualified = action.payload;
    },

    resetAll: () => initialState,
  },
});

export const {
  setActiveStep,
  nextStep,
  nextSubStep,
  setStepLocked,
  setStepAcknowledged,
  setSubStepStatus,
  setSubStepError,
  setBulkStepEnabled,
  setModalOpen,
  resetStep,
  resetAll,
  setEnableProctoring,
  setOnWorkflowComplete,
  setActiveSubStep,
  setStepSetupMode,
  setIsDisqualified,
  setBeepConfig,
} = workflowSlice.actions;

export default workflowSlice.reducer;

export const selectStep = (
  state: { workflow: WorkflowState },
  step: WorkflowStepKey
) => state.workflow.steps[step];

export const selectSubStep = (
  state: { workflow: WorkflowState },
  step: WorkflowStepKey,
  subStep: string
) => state.workflow.steps[step].subSteps[subStep];

export const selectActiveStep = (state: { workflow: WorkflowState }) =>
  state.workflow.steps[state.workflow.activeStep];
