import React, { useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks/reduxhooks';
import { selectProctor } from '@/store/features/assessmentInfoSlice';
import { Button } from '@/ui/Button'
import { ArrowRight } from 'lucide-react';
import LightBulb from '@/assets/images/light-bulb.svg';
import GuideModal from '@/ui/GuideModal';
import CameraShareGuide from '@/ui/CameraShareGuide';
import { nextSubStep, selectSubStep, setActiveSubStep, setSubStepStatus } from '@/store/features/workflowSlice';
import { getBrowserInfo } from '@/utils/browser';
import { getOperatingSystemInfo } from '@/utils/osInfo';
import CameraCard from '@/ui/CameraCard';


const CameraShareTab = () => {
    const dispatch = useAppDispatch();

    const proctor = useAppSelector(selectProctor);
    const { enableProctoring } = useAppSelector((state) => state.workflow);

    const cameraState = useAppSelector((state) =>
        selectSubStep(state, 'cameraShare', 'cameraShare'),
    );

    const browserInfo: any = useMemo(() => getBrowserInfo(), []);
    const osInfo: any = useMemo(() => getOperatingSystemInfo(), []);

    const [showGuideModal, setShowGuideModal] = useState(false);

    const handleNext = () => {
        if (enableProctoring) {
            proctor?.handleCompatibilityChecks({ forceRun: true });
        } else {
            proctor?.handleWebcamRequest();
            dispatch(
                setSubStepStatus({
                    step: 'cameraShare',
                    subStep: 'cameraShare',
                    status: 'completed',
                }),
            );
            dispatch(nextSubStep());
        }
    }


    const handleGoBack = () => {
        dispatch(setActiveSubStep({ step: 'cameraShare', subStep: 'introduction' }));
    };

    const renderGuideModal = useMemo(() => (
        <GuideModal
            open={showGuideModal}
            onOpenChange={setShowGuideModal}
            isError={cameraState.status === 'error'}
            title="It looks like you're having trouble accessing your camera"
        >
            <div className='space-y-6'>
                <p className='text-base-500 text-sm'>
                    Refer to the image below for steps to troubleshoot and grant camera
                    permissions
                </p>
                <div className='aspect-[16/9] w-full bg-muted rounded-lg overflow-y-auto p-8 shadow-sm'>
                    <CameraShareGuide browserName={browserInfo?.name} osName={osInfo?.osName} />
                </div>
            </div>
        </GuideModal>
    ), [showGuideModal, cameraState.status, browserInfo?.name, osInfo?.osName]);

    return (
        <div className=" h-full min-h-fit w-full flex flex-col justify-between gap-20 items-start">

            <CameraCard />

            <div className="mb-10">
                <div className="text-xs text-base-200 flex items-center mb-8 gap-2">
                    <img src={LightBulb} alt="Tip" className="w-7 h-7 opacity-60" />
                    Need more help? Click to view{' '}
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowGuideModal(true);
                        }}
                        className="text-scaler-500 hover:underline cursor-pointer"
                    >
                        setup guide
                    </a>
                </div>

                {!enableProctoring ? (
                    <div className="flex items-center gap-5">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleNext}
                            disabled={cameraState.status !== 'completed'}
                            className="px-20 text-sm font-normal disabled:bg-[#D6DEE5] disabled:opacity-100 disabled:text-[#91A1B7]"
                        >
                            Next <ArrowRight className="w-6 h-6 ml-2" />
                        </Button>
                        <Button variant="outline" size="lg" onClick={handleGoBack} className="px-8 font-normal text-sm">
                            Go back
                        </Button>
                    </div>
                ) : (
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleNext}
                        className="px-20 text-sm font-normal"
                    >
                        Confirm Settings
                    </Button>
                )}
            </div>
            {showGuideModal && renderGuideModal}
        </div>
    )
}

export default CameraShareTab