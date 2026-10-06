import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';

import { CircleCheck, Loader2 } from 'lucide-react';
import { COMPATIBILITY_CHECK_STATUSES } from '@/utils/constants';

import { setSubStepStatus } from '@/store/features/workflowSlice';
import { useAppDispatch } from '@/hooks/reduxhooks';
import styles from './MobileCameraStep.module.scss';
import useProctorPolling from '@/hooks/useProctorPolling';
import warningIcon from '@/assets/images/red-warning.svg';

const COMPATIBILITY_CHECK_DATA = {
  battery: {
    default: {
      title: 'Battery Check in progress...',
      description: 'Checking your battery level to ensure the session isn\'t interrupted',
    },
    success: {
      title: 'Battery Check successfully done',
      description: 'Battery level looks good. You\'re ready to go',
    },
    failed: {
      title: 'Battery Check',
      description: 'Connect the phone to a charger or use a different phone',
    },
    alert: 'Your battery is very low. Less than 10%. Please charge your phone to avoid any interruption',
  },
};

const DEFAULT_STATUS_MAP = {
  battery: 'default',
};

/* Creating separate UI as the designs can be different in the future */
const successUi = ({ title, description }) => (
    <section className="flex flex-row">
      <CircleCheck className='w-12 h-12 text-white fill-green-600' />
      <section className="flex flex-col ml-6">
        <heading className={styles.compatibilityTitle}>{title}</heading>
        <p className={styles.compatibilityBody}>{description}</p>
      </section>
    </section>
);

const defaultUi = ({ title, description }) => (
    <section className="flex flex-row items-start">
      <Loader2 className='w-12 h-12 text-scaler-500 animate-spin' />
      <section className="flex flex-col ml-6">
        <heading className={styles.compatibilityTitle}>{title}</heading>
        <p className={styles.compatibilityBody}>{description}</p>
      </section>
    </section>
);

const failedUi = ({ title, description }) => (
    <section className="flex flex-row items-start">
      <img className={styles.compatibilityWarningIcon} src={warningIcon} alt="red-warning"/>
      <section className="flex flex-col ml-6">
        <heading className={styles.compatibilityTitle}>{title}</heading>
        <p className={styles.compatibilityBody}>{description}</p>
      </section>
    </section>
);

function MobileCompatibility({
  className,
}) {
  const [statusMap, setStatusMap] = useState(DEFAULT_STATUS_MAP);
  const dispatch = useAppDispatch();

  const setBatteryCheckFailed = useCallback(() => {
    if (statusMap.battery === COMPATIBILITY_CHECK_STATUSES.default) {
      setStatusMap({
        battery: 'failed',
      });
    }
  }, [statusMap]);

  useEffect(() => {
    let batteryCheckTimeout = null;
    batteryCheckTimeout = setTimeout(() => {
      setBatteryCheckFailed();
    }, 10000);
    return () => {
      if (batteryCheckTimeout) clearTimeout(batteryCheckTimeout);
    };
  }, [setBatteryCheckFailed]);

  const handleBatteryLow = useCallback(() => {
    dispatch(setSubStepStatus({
      step: 'mobileCameraShare',
      subStep: 'systemChecks',
      status: 'pending',
    }));
  }, [dispatch]);

  const handleBatteryNormal = useCallback(() => {
    setStatusMap({
      battery: 'success',
    });
    dispatch(setSubStepStatus({
      step: 'mobileCameraShare',
      subStep: 'systemChecks',
      status: 'completed',
    }));
  }, [dispatch]);

  const handleDataUpdate = useCallback((data) => {
    if (data.success) {
      // dispatch(setStepStatus({
      //   step: 'mobileCameraShare',
      //   status: 'completed',
      // }));
      console.log('Update status to completed');
    }
  }, []);

  useProctorPolling({
    onBatteryLow: handleBatteryLow,
    onBatteryNormal: handleBatteryNormal,
    onDataUpdate: handleDataUpdate,
  });
  return (
    <div className={classNames('flex flex-col justify-between', { [className]: className })}>
      <section>
      {Object.keys(statusMap).map((check) => {
        const checkStatus = statusMap[check];
        const checkData = COMPATIBILITY_CHECK_DATA?.[check]?.[checkStatus];
        if (checkData) {
          switch (checkStatus) {
            case COMPATIBILITY_CHECK_STATUSES.success:
              return successUi({ ...checkData });
            case COMPATIBILITY_CHECK_STATUSES.failed:
              return failedUi({ ...checkData });
            default:
              return defaultUi({ ...checkData });
          }
        }
        return null;
      })}
      </section>
      {statusMap.battery === COMPATIBILITY_CHECK_STATUSES.failed
      && <section className={styles.compatibilityAlert}>
        <b>Your battery is very low. </b>
        <i>Less than 10%. Please charge your phone to avoid any interruption.</i>
      </section>}
    </div>
  );
}

export default MobileCompatibility;
