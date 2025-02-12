import React, { useState, useRef, useEffect } from 'react';

import { X } from 'lucide-react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';

const GUIDE_VIDEO_URL = 'https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/105/009/original/DCP_flow_segment.mp4';

function PositionGuideModal({ isOpen, onClose, onProceed }) {
  const [videoCompleted, setVideoCompleted] = useState(false);
  const videoRef = useRef(null);
  const hasPlayedOnceRef = useRef(false);

  useEffect(() => {
    if (isOpen && !videoCompleted) {
      const timeoutId = setTimeout(() => {
        setVideoCompleted(true);
        hasPlayedOnceRef.current = true;
      }, 15000);

      return () => clearTimeout(timeoutId);
    }
    return () => {};
  }, [isOpen, videoCompleted]);

  const handleTimeUpdate = () => {
    if (!hasPlayedOnceRef.current && videoRef.current) {
      const video = videoRef.current;
      // Mark as completed when we reach near the end of first playthrough
      if (video.currentTime >= video.duration - 0.5) {
        setVideoCompleted(true);
        hasPlayedOnceRef.current = true;
      }
    }
  };

  return (
    <Modal
      containerClassName='rounded-2xl'
      isOpen={isOpen}
      modalClassName='p-12 flex flex-col max-w-[700px] relative'>
      <heading className="text-2xl mb-1 font-bold">Mobile Camera Positioning Reference</heading>
      <article className="text-gray-500 text-sm/7 mb-4">
        Please watch the video and follow the steps to position your mobile correctly.
        Make sure your head, hands and workspace are clearly visible as shown
      </article>

      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 my-9">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          controls={false}
          onTimeUpdate={handleTimeUpdate}
          autoPlay
          loop
          playsInline>
          <source src={GUIDE_VIDEO_URL} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="flex-row">
        <Button
          type='button'
          className="mt-8 items-center py-8 px-10"
          variant="primary"
          onClick={onProceed}
          disabled={!videoCompleted}
        >
          Proceed to Camera Alignment
        </Button>
      </div>
      {videoCompleted && (
        <button
          className="absolute top-5 right-5 text-gray-500 hover:text-gray-800"
          onClick={onClose}
          aria-label="Close">
          <X />
        </button>
      )}
    </Modal>
  );
}

export default PositionGuideModal;
