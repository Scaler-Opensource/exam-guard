import React from 'react'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import Certificate from '@/assets/images/prerequisite-consent.svg';
import { Checkbox } from '@/ui/Checkbox';
import { nextStep, selectStep, setActiveSubStep, setStepAcknowledged, setSubStepStatus } from '@/store/features/workflowSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxhooks';

const ImageChecksTab = () => {

    const dispatch = useAppDispatch();

    const { acknowledged } = useAppSelector((state) => (
        selectStep(state, 'cameraShare')
    ));

    const handleCheckboxChange = () => {
        dispatch(
            setStepAcknowledged({
                step: 'cameraShare',
                acknowledged: !acknowledged,
            }),
        );
    };

    const handleAgreeAndProceed = () => {
        // dispatch(
        //     setSubStepStatus({
        //         step: 'cameraShare',
        //         subStep: 'qualityCheck',
        //         status: 'completed',
        //     }),
        // );
        // dispatch(
        //     setSubStepStatus({
        //         step: 'cameraShare',
        //         subStep: 'visibilityCheck',
        //         status: 'completed',
        //     }),
        // );
        dispatch(nextStep());
    };

    const handleGoBack = () => {
        dispatch(
            setActiveSubStep({
                step: 'cameraShare',
                subStep: 'cameraShare',
            }),
        );
    };

    return (
        <div className=" h-full min-h-fit w-full flex flex-col justify-between gap-20 items-start">
            <Card className=" p-10 md:p-20 border-none w-full flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_0_40px_10px_rgb(0,0,0,0.05)]">
                <div className='w-full md:w-1/2 h-full flex justify-center items-center'>
                    <img src={Certificate} alt="ISO 27001 & SOC 2 certified" className='w-full max-w-[40rem]' />
                </div>

                <div className="space-y-6 w-full md:w-1/2 h-full text-left flex flex-col justify-center items-start">
                    <h2 className="text-lg md:text-xl font-semibold text-base-500">
                        Proctoring & Data Privacy
                    </h2>

                    <div className="space-y-4">
                        {[
                            <>Your camera, microphone, screen activity, and device info are recorded for exam security</>,
                            <>Scaler is <span className='font-bold'>ISO 27001 & SOC 2</span> certified. Your test feed will be reviewed by our internal audit team and AI. This data is  deleted within 90 days.</>,
                            <>We <span className='font-bold'>DO NOT</span> access personal files, passwords, or other apps</>
                        ].map((text, index) => (
                            <div key={index} className="flex items-start gap-4">
                                <div className='w-3 h-3 min-w-3 min-h-3 mt-3 rounded-full bg-base-200 shrink-0' />
                                <span className="text-xs md:text-sm text-base-200 leading-normal font-light">
                                    {text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <div className='mb-10'>
                <div className="text-xs text-base-200 flex items-start mb-8 gap-4">
                    <Checkbox
                        id='confirm'
                        className=' h-6 w-6 rounded-md mt-0.5'
                        checked={acknowledged}
                        onCheckedChange={handleCheckboxChange}
                        role="checkbox"
                    />
                    <div>
                        <label htmlFor='confirm' className=' cursor-pointer'>
                            By continuing, you consent to the recording and processing of your data. For more information, see our
                        </label>{" "}
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-scaler-500 hover:underline cursor-pointer"
                        >
                            privacy policy
                        </a>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <Button
                        variant="primary"
                        size="lg"
                        disabled={!acknowledged}
                        onClick={handleAgreeAndProceed}
                        className='px-20 text-sm font-normal disabled:bg-[#D6DEE5] disabled:opacity-100 disabled:text-[#91A1B7]'
                    >
                        Agree & Proceed
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handleGoBack}
                        className='px-8 font-normal text-sm'
                    >
                        Go back
                    </Button>
                </div>

            </div>
        </div>
    )
}

export default ImageChecksTab