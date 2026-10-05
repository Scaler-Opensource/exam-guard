import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

import { evaluateParentStepStatus } from '@/utils/evaluateParentStepStatus';
import { useAppSelector, useAppDispatch } from '@/hooks/reduxhooks';
import { setActiveStep } from '@/store/features/workflowSlice';
import { Step, WorkflowStepKey, Status } from '@/types/workflowTypes';
import styles from './CompatibilityModalStepsScreen.module.scss';

interface StepItemProps {
  icon: React.ElementType;
  title: string;
  step: number;
  active: boolean;
  onClick: () => void;
  isLast: boolean;
  status?: Status;
}

const StepItem: React.FC<StepItemProps> = ({
  icon: Icon,
  title,
  step,
  active,
  onClick,
  isLast,
  status,
}) => (
  <div
    className='relative flex items-start gap-4 cursor-pointer'
    onClick={onClick}
  >
    <div className='flex flex-col items-center'>
      <div
        className={`rounded-full p-5 ${
          status === 'completed'
            ? 'bg-scaler-900 text-white'
            : status === 'error'
              ? 'bg-red-500 text-white'
              : active
                ? 'bg-scaler-500 text-white'
                : 'bg-scaler-100 text-blue-400'
        }`}
      >
        {status === 'completed' ? (
          <Check className='w-8 h-8' />
        ) : status === 'error' ? (
          <AlertTriangle className='w-8 h-8' />
        ) : (
          <Icon className='w-8 h-8' />
        )}
      </div>
      {!isLast && <div className='w-1.5 h-28 bg-scaler-100'></div>}
    </div>
    <div className='md:mt-2'>
      <div className={`text-xs text-gray-400 ${styles.stepNumber}`}>
        STEP {step}
      </div>
      <div
        className={`text-base ${
          status === 'error'
            ? 'font-bold text-red-500'
            : active
              ? 'font-bold text-scaler-500'
              : 'font-medium text-base-700'
        }`}
      >
        {title}
      </div>
    </div>
  </div>
);

const CompatibilityModalStepsScreen: React.FC<{
  step_data: Record<string, Step>;
}> = ({ step_data }) => {
  const activeStep = useAppSelector((state) => state.workflow.activeStep);
  const steps = useAppSelector((state) => state.workflow.steps);
  const dispatch = useAppDispatch();

  return (
    <div className='mt-16'>
      {Object.entries(step_data).map(([key, item], index) => {
        const stepData = steps[key as WorkflowStepKey];
        const isClickable = !stepData.locked;
        const status = evaluateParentStepStatus(Object.values(stepData.subSteps));

        return (
          <StepItem
            key={key}
            icon={item.icon}
            title={item.title}
            step={index + 1}
            active={activeStep === key}
            onClick={() =>
              isClickable && dispatch(setActiveStep(key as WorkflowStepKey))
            }
            isLast={index === Object.keys(step_data).length - 1}
            status={status}
          />
        );
      })}
    </div>
  );
};

export default CompatibilityModalStepsScreen;
