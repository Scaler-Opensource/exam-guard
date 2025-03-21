import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useGetPollingDataQuery } from '@/services/mobilePairingService';
import { selectProctor } from '@/store/features/assessmentInfoSlice';

const useProctorPolling = ({
  onSetupSuccess,
  onSetupFailure,
  onBatteryLow,
  onBatteryNormal,
  onSnapshotSuccess,
  onSnapshotFailure,
  onDataUpdate,
}, pollingInterval = 5000) => {
  const proctor = useSelector((state) => selectProctor(state));
  const pollingEndpoint = proctor?.mobilePairingConfig?.endpoint || null;
  const { data } = useGetPollingDataQuery({
    endpoint: pollingEndpoint,
  }, {
    pollingInterval,
    selectFromResult: ({ data: resultData }) => ({
      data: resultData,
    }),
  });

  const callbacksRef = useRef({
    onSetupSuccess,
    onSetupFailure,
    onBatteryLow,
    onBatteryNormal,
    onSnapshotSuccess,
    onSnapshotFailure,
    onDataUpdate,
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onSetupSuccess,
      onSetupFailure,
      onBatteryLow,
      onBatteryNormal,
      onSnapshotSuccess,
      onSnapshotFailure,
      onDataUpdate,
    };
  }, [
    onSetupSuccess,
    onSetupFailure,
    onBatteryLow,
    onBatteryNormal,
    onSnapshotSuccess,
    onSnapshotFailure,
    onDataUpdate,
  ]);

  useEffect(() => {
    if (!data) return;
    // Call the onDataUpdate callback
    callbacksRef.current.onDataUpdate?.(data);

    // Process secondary camera checks
    const secondaryCameraChecks = data.checks?.secondary_camera.checks || {};
    Object.keys(secondaryCameraChecks).forEach((check) => {
      const checkData = secondaryCameraChecks[check];
      const callbacks = callbacksRef.current;

      switch (check) {
        case 'setup':
          // eslint-disable-next-line no-unused-expressions
          checkData?.success
            ? callbacks.onSetupSuccess?.(checkData)
            : callbacks.onSetupFailure?.(checkData);
          break;
        case 'snapshot':
          // eslint-disable-next-line no-unused-expressions
          checkData?.success
            ? callbacks.onSnapshotSuccess?.(checkData)
            : callbacks.onSnapshotFailure?.(checkData);
          break;
        case 'battery':
          // eslint-disable-next-line no-unused-expressions
          checkData?.success
            ? callbacks.onBatteryNormal?.(checkData, data)
            : callbacks.onBatteryLow?.(checkData, data);
          break;
        default:
          break;
      }
    });
  }, [data]);
};

export default useProctorPolling;
