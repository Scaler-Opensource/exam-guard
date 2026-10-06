import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/ui/Button';
import { ERROR_MESSAGES } from '@/constants/screenshot';
import { setSubStepError, selectSubStep } from '@/store/features/workflowSlice';
import { screenshareCleanup } from '@/utils/screenshotV2';
import { selectProctor } from '@/store/features/assessmentInfoSlice';
import { useAppSelector, useAppDispatch } from '@/hooks/reduxhooks';

export default function ScreenShareCard() {
  const dispatch = useAppDispatch();
  const proctor = useAppSelector((state) => selectProctor(state));
  const screenShareState = useAppSelector((state) =>
    selectSubStep(state, 'screenShare', 'screenShare'),
  );
  const { enableProctoring } = useAppSelector((state) => state.workflow);

  const handleShare = async () => {
    try {
      await proctor?.handleScreenshareRequest({ 
        disableScreenshot: !enableProctoring,
       });
    } catch (error) {
      console.error('Error initiating screen share:', error);
    }
  };

  const handleStop = () => {
    screenshareCleanup();
    dispatch(
      setSubStepError({
        step: 'screenShare',
        subStep: 'screenShare',
        error: ERROR_MESSAGES.SCREEN_SHARE_DENIED,
      }),
    );
  };

  return (
    <div className='mt-8 w-full max-w-ful'>
      {screenShareState.status === 'error' && screenShareState.error && (
        <div className='w-full bg-red-100 p-4 rounded-t-2xl flex items-center justify-center gap-2'>
          <AlertTriangle className='w-6 h-6 text-red-500' />
          <span className='text-red-700 text-sm'>{screenShareState.error}</span>
        </div>
      )}

      <div
        className={`${
          screenShareState.status === 'error' ? 'rounded-b-lg' : 'rounded-2xl'
        } overflow-hidden shadow-[0px_0px_24px_0px_rgba(0,0,0,0.08)] bg-white p-3`}
      >
        <div className='flex'>
          {screenShareState.status !== 'completed' && (
            <div className='flex-1 py-16 pl-16 max-w-xl'>
              <img
                src={'https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/099/662/original/screen-share-mock.png?1733837502'}
                alt='Screen Share Mock'
                className='w-full object-contain'
              />
            </div>
          )}
          <div className='flex-1 p-16 grow'>
            <h3 className='text-xl font-semibold mb-2'>
              {screenShareState.status === 'completed'
                ? 'Successfully shared your screen'
                : 'Start Screen Share'}
            </h3>
            <p className='text-base-500 mb-6 text-sm'>
              {screenShareState.status === 'completed' ? (
                'Sharing your entire screen is essential to make sure the assessment is happening in the fair manner'
              ) : (
                <>
                  Click below to begin sharing your entire screen.
                  <br />
                  <br />
                  You will need to set up screen sharing again when your test
                  begins, as the environment will refresh.
                </>
              )}
            </p>
            {screenShareState.status === 'completed' ? (
              <div className='flex items-center justify-between p-4 bg-gray-100 rounded-2xl text-sm'>
                <span>scaler.com is sharing your screen</span>
                <div className='flex gap-2'>
                  <Button onClick={handleStop} className='text-red-500' size='xs' variant='secondary'>
                    Stop Sharing
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className='text-sm'
                onClick={handleShare}
                variant='primary'
                size='lg'
              >
                Share Entire Screen
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
