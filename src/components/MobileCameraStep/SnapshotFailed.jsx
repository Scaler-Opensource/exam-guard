import React from 'react';

import { AlertTriangle, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/ui/Button';

export default function SnapshotFailed({ setSwitchModalOpen }) {
  return (
    <div className="bg-white  flex flex-col items-center">
      {/* Warning Icon */}
      <div className="text-red-500 mb-4">
        <AlertTriangle className="w-16 h-16" />
      </div>

      {/* Heading */}
      <h1 className="text-3xl font-bold mb-10">
        Mobile Phone Disconnected
      </h1>
      {/* Cases Section */}
      <div className="w-full mb-8">
        <h2 className="text-xs font-semibold mb-4">
          Please check the following cases :
        </h2>

        <div className="border border-dashed border-gray-200 rounded-lg p-6">
          <div className="max-h-60 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {[
                'Browser/tab closed',
                'Network disconnected',
                'Mobile Screen locked',
                'Low Power Mode',
                'Mobile accidentally switched off',
                'Incoming calls',
                'Mobile rendered unusable - overheated due to high system usage',
                'Using another application increasing the RAM usage',
              ].map((text, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="text-gray-600 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
       {/* Subheading */}
      <p className="text-gray-600 mb-8">
        Please scan the QR code again to proceed to the next step.
      </p>

      {/* Action Button */}
      <Button onClick={() => setSwitchModalOpen(true)}
        className="w-full max-w-2xl bg-scaler-500 hover:bg-blue-600 text-white py-6 rounded-lg text-lg font-medium">
        Scan QR Code Again
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}
