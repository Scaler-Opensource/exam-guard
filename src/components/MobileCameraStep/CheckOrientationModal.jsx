import React from 'react';

import { TriangleAlert } from 'lucide-react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';

function CheckOrientationModal({ isOpen, onClose }) {
  return (
    <Modal
      containerClassName='rounded-2xl'
      isOpen={isOpen}
      modalClassName='p-12 flex flex-col justify-center text-center items-center max-w-[600px] relative'>
      <TriangleAlert className="h-[7.2rem] w-[7.2rem] pb-4 text-red-500" />
      <header className="text-2xl mb-1">Orientation Verification Failed</header>
      <article className="text-gray-500 text-sm">
        We are not able to verify your camera orientation.
        Please make sure that you adjust your phone according to the instructions.
        Incorrect camera positioning may lead to disqualification during the exam.
      </article>
      <section className="mt-8">
        <Button
          type="button"
          className="items-center py-8 px-10"
          variant='primary'
          onClick={onClose}
        >
          Proceed
        </Button>
      </section>
    </Modal>
  );
}

export default CheckOrientationModal;
