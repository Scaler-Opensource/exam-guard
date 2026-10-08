import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/ui/Card';

const Modal = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    containerClassName?: string;
    modalClassName?: string;
    isOpen: boolean;
  }
>(({ containerClassName, modalClassName, isOpen, children, ...props }, ref) => {
  if (isOpen) {
    return (
      <div
        ref={ref} // Ensure the ref is attached here
        className={cn(
          'fixed inset-0 bg-black/50 flex items-center justify-center z-50',
          containerClassName
        )}
        {...props}
      >
        <Card className={modalClassName}>{children}</Card>
      </div>
    );
  } else {
    return null;
  }
});

Modal.displayName = 'Modal';

export { Modal };
