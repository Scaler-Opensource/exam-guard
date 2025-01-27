import React, { useCallback, useEffect, useState } from 'react';

import { ArrowRight } from 'lucide-react';
import PositionGuideModal from './PositionGuideModal';
import { Button } from '@/ui/Button';
import { Checkbox } from '@/ui/Checkbox';
import { evaluateParentStepStatus } from '@/utils/evaluateParentStepStatus';
import {
  nextStep,
  selectStep,
  setStepAcknowledged,
  setStepSetupMode,
} from '@/store/features/workflowSlice';
import { PAIRING_STEPS } from '@/utils/constants';
import { Tabs, Tab } from '@/ui/Tabs';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxhooks';
import MobileCompatibility from './MobileCompatibility';
import Orientation from './Orientation';
import Pairing from './Pairing';
import StepHeader from '@/ui/StepHeader';
import SwitchPhoneModal from './SwitchPhoneModal';

// At the top of MobileCameraStep.jsx
const MemoizedPairing = React.memo(Pairing);
const MemoizedOrientation = React.memo(Orientation);
const MemoizedMobileCompatibility = React.memo(MobileCompatibility);
const MemoizedSwitchPhoneModal = React.memo(SwitchPhoneModal);

const MobileCameraStep = () => {
  console.log('MobileCameraStep component rendered');
  const dispatch = useAppDispatch();
  const {
    acknowledged, subSteps, activeSubStep,
  } = useAppSelector((state) => (
    selectStep(state, 'mobileCameraShare')
  ));
  const { modalOpen } = useAppSelector((state) => state.workflow);

  const [isSwitchModalOpen, setSwitchModalOpen] = useState(false);
  const [isPositionGuideModalOpen, setPositionGuideModalOpen] = useState(false);
  const { enableProctoring } = useAppSelector((state) => state.workflow);

  const areAllSubstepsCompleted = Object.values(subSteps).every(
    (step) => step.status === 'completed',
  );

  useEffect(() => () => {
    if (!modalOpen) {
      dispatch(setStepSetupMode({
        step: 'mobileCameraShare',
        setupMode: false,
      }));
    }
  }, [modalOpen, dispatch]);

  const status = evaluateParentStepStatus(Object.values(subSteps));
  const canProceed = enableProctoring || (acknowledged && areAllSubstepsCompleted);

  const handleCheckboxChange = () => {
    dispatch(
      setStepAcknowledged({
        step: 'mobileCameraShare',
        acknowledged: !acknowledged,
      }),
    );
  };

  const handleModalClose = useCallback(() => {
    setSwitchModalOpen(false);
  }, []);

  const handlePositionGuideModalClose = useCallback(() => {
    setPositionGuideModalOpen(false);
  }, []);

  return (
    <>
      <StepHeader
        stepNumber='3'
        title='Mobile Camera Pairing Permissions'
        status={status}
      />
      <Tabs activeTab={activeSubStep} className='mt-20'>
        <Tab
          label='Scan Code & Pair Mobile'
          name={PAIRING_STEPS.pairing}
          isDisabled
          isCompleted={subSteps[PAIRING_STEPS.pairing].status === 'completed'}
        >
          <MemoizedPairing />
        </Tab>

        <Tab
          label='Camera Orientation'
          name={PAIRING_STEPS.orientation}
          isDisabled
          isCompleted={
            subSteps[PAIRING_STEPS.orientation].status === 'completed'
          }
        >
          <MemoizedOrientation
            setSwitchModalOpen={setSwitchModalOpen}
            setPositionGuideModalOpen={setPositionGuideModalOpen}
          />
        </Tab>
        <Tab
          label='Mobile System Check'
          name={PAIRING_STEPS.mobileCompatibility}
          isDisabled
          isCompleted={
            subSteps[PAIRING_STEPS.mobileCompatibility].status === 'completed'
          }
        >
          <MemoizedMobileCompatibility />
        </Tab>
      </Tabs>
      {!enableProctoring
        && [PAIRING_STEPS.mobileCompatibility].includes(
          activeSubStep,
        ) && (
          <div className='mt-8'>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canProceed) {
                  dispatch(nextStep());
                }
              }}
            >
              <div className='flex items-start mt-16 text-xs'>
                <Checkbox
                  id='confirm'
                  className='mt-1 mr-4 h-6 w-6'
                  checked={acknowledged}
                  onCheckedChange={handleCheckboxChange}
                  disabled={!areAllSubstepsCompleted}
                  role="checkbox"
                  required={areAllSubstepsCompleted}
                />
                <label htmlFor='confirm' className='text-sm text-gray-600 cursor-pointer'>
                  By clicking on this, you confirm that your mobile phone is paired
                  and will remain charged during the test. If disconnected,
                  you&apos;ll need to reconnect before being able to continue with
                  the test.
                </label>
              </div>
              <div className="flex items-center">
                <Button
                  type="submit"
                  className='mt-8 items-center'
                  size='lg'
                  variant='primary'
                  disabled={!areAllSubstepsCompleted}
                >
                  {enableProctoring ? 'Confirm Settings' : (
                    <>
                      Proceed to next step
                      <ArrowRight className='w-6 h-6' />
                    </>
                  )}
                </Button>
                {activeSubStep !== PAIRING_STEPS.pairing && (
                  <Button
                    className='mt-8 items-center py-8 px-10 ml-6'
                    variant='outline'
                    disabled={activeSubStep === PAIRING_STEPS.pairing}
                    onClick={() => setSwitchModalOpen(true)}
                  >
                    Scan QR Code again
                  </Button>
                )}
              </div>
            </form>
          </div>
      )}
      <MemoizedSwitchPhoneModal
        isOpen={isSwitchModalOpen}
        onClose={handleModalClose}
      />
      <PositionGuideModal
        isOpen={isPositionGuideModalOpen}
        onClose={handlePositionGuideModalClose}
      />
    </>
  );
};

export default MobileCameraStep;
