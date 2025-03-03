import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WorkflowStepKey } from '@/types/workflowTypes';
import { ClockIcon } from 'lucide-react';
import { selectProctor } from '@/store/features/assessmentInfoSlice';
import { useAppSelector } from '@/hooks/reduxhooks';

interface DisqualificationTimerBarProps {
  activeStep: WorkflowStepKey;
  modalOpen: boolean;
  failingSteps: WorkflowStepKey[];
  beepConfig?: {
    enabled: boolean;
    sounds: Record<WorkflowStepKey, string>;
  };
}

const STEP_VS_MESSAGE_MAPPING = {
  screenShare: {
    message: 'Disqualified in',
    time: 45,
  },
  cameraShare: {
    message: 'Disqualified in',
    time: 45,
  },
  mobileCameraShare: {
    message: 'Disqualified in',
    time: 120,
  },
  compatibilityChecks: {
    message: 'Disqualified in',
    time: 45,
  },
};

const DisqualificationTimerBar: React.FC<DisqualificationTimerBarProps> = ({
  activeStep,
  modalOpen,
  failingSteps,
  beepConfig,
}) => {
  const getMaxTime = useMemo(() => {
    if (!failingSteps.length) return STEP_VS_MESSAGE_MAPPING[activeStep].time;
    
    return Math.max(
      ...failingSteps.map(step => STEP_VS_MESSAGE_MAPPING[step].time) 
    );
  }, [failingSteps, activeStep]);

  const message = STEP_VS_MESSAGE_MAPPING[activeStep].message;
  const proctor = useAppSelector(selectProctor);

  const [timeLeft, setTimeLeft] = useState(getMaxTime);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setTimeLeft(getMaxTime);

    console.log("Reached here");

    if (beepConfig?.enabled && beepConfig.sounds[activeStep]) {
      
      if (!beepConfig.sounds[activeStep]) {
        console.error('Audio file path is empty or invalid');
        return;
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      try {
        audioRef.current = new Audio(beepConfig.sounds[activeStep]);
        audioRef.current.loop = true;
        
        // Add error handling for audio loading
        audioRef.current.addEventListener('error', (e) => {
          console.error('Audio loading error:', e);
        });
        
        audioRef.current.play().catch((e) => {
          console.error('Audio playback failed:', e);
        });
      } catch (e) {
        console.error('Error creating audio element:', e);
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [modalOpen, getMaxTime, activeStep, beepConfig]);

  useEffect(() => {
    if (timeLeft <= 0) {
      proctor?.disqualifyUser();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, proctor]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='relative rounded-t-lg w-full text-white flex flex-row items-center justify-center'>
      <div className='py-2 relative flex flex-row items-center uppercase font-bold text-center text-black text-sm z-40 tracking-widest'>
        {message}
        <span className='ml-4 inline-flex items-center gap-1 text-base font-bold'>
          <ClockIcon className='h-6 w-6 font-bold' />
          {formatTime(timeLeft)}
        </span>
      </div>
      <div className='absolute top-0 left-0 h-full w-full bg-[#FFEBEF] rounded-t-2xl overflow-hidden'>
        <div
          className='h-full bg-red-700 transition-all duration-1000 ease-linear'
          style={{ width: `${100 - (timeLeft / getMaxTime) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default DisqualificationTimerBar;
