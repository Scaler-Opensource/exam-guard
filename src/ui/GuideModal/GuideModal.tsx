import { useMemo } from 'react';
import { Modal } from '@/ui/Modal';
import { getBrowserInfo } from '@/utils/browser';
import { X } from 'lucide-react';

interface GuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isError?: boolean;
  title: string;
  children: React.ReactNode;
}

export default function GuideModal({
  open,
  onOpenChange,
  title,
  children,
}: GuideModalProps) {
  const browserInfo: any = useMemo(() => getBrowserInfo(), []);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Modal
      isOpen={open}
      modalClassName='rounded-lg max-w-[90%] max-h-[95%]'
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleOpenChange(false);
        }
      }}
    >
      <div className={`rounded-lg w-full h-full p-16 z-[100] bg-white overflow-y-auto relative`}>
        <button
          className="absolute top-5 right-5 text-gray-500 hover:text-gray-800"
          onClick={() => handleOpenChange(false)}
          aria-label="Close"
        >
          <X />
        </button>
        <div className="mb-6">
          <h2 className='text-2xl font-bold'>{title}</h2>
        </div>
        {children}

        <div className='my-4 mt-6'>
          <div className='flex flex-wrap items-center text-sm'>
            <div className='flex flex-col mr-6'>
              <span className='font-bold text-base-500'>Browser</span>
              <span className='text-gray-900'>{browserInfo?.name}</span>
            </div>
            <div className='flex flex-col mr-6'>
              <span className='font-bold text-base-500'>Version</span>
              <span className='text-gray-900'>{browserInfo?.version}</span>
            </div>
            <div className='flex flex-col'>
              <span className='font-bold text-base-500'>Supported</span>
              <span
                className={`text-gray-900 ${browserInfo?.isSupported ? 'text-green-600' : 'text-red-600'}`}
              >
                {browserInfo?.isSupported ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
