import React from 'react';
import { X } from 'lucide-react';

import { Button } from '@/ui/Button';
import { Modal } from '@/ui/Modal';
import { identityMedia } from './IdentityCard';

// Opens on first entry to the step and from "View positioning guide" or the help line.
const PositioningModal = ({
  baseUrl, isOpen, onClose,
}: { baseUrl: string; isOpen: boolean; onClose: () => void }) => (
  <Modal isOpen={isOpen} modalClassName='relative w-full max-w-xl p-8'>
    <button type='button' aria-label='Close' className='absolute top-4 right-4 text-base-500' onClick={onClose}>
      <X className='w-6 h-6' />
    </button>
    <h3 className='text-xl font-bold text-base-700'>How to position your face</h3>
    <p className='mt-2 text-base text-base-500'>
      Follow the steps shown. Make sure your face is centred, well lit, and fully visible.
    </p>
    <video
      className='mt-6 w-full rounded-lg'
      src={identityMedia(baseUrl, 'positioning-reference.mp4')}
      poster={identityMedia(baseUrl, 'positioning-reference.jpg')}
      autoPlay
      muted
      loop
      playsInline
    />
    <Button variant='primary' size='lg' className='mt-6 w-full' onClick={onClose}>Start face scan</Button>
  </Modal>
);

export default PositioningModal;
