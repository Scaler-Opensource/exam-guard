import React from 'react'
import { useAppDispatch } from '@/hooks/reduxhooks';
import { nextSubStep, setSubStepStatus } from '@/store/features/workflowSlice';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { ArrowRight } from 'lucide-react';

import CameraSetup_1 from '@/assets/images/CameraSetup_1.svg';
import CameraSetup_2 from '@/assets/images/CameraSetup_2.svg';
import CameraSetup_3 from '@/assets/images/CameraSetup_3.svg';

const IntroTab = () => {
    const dispatch = useAppDispatch();

    const requirementCards = [
        {
            title: 'Face must be visible',
            description: 'Face must be  visible in the camera during the entire test',
            image: CameraSetup_1,
        },
        {
            title: 'Check Camera Access',
            description: 'If computer has a camera shutter or switch, turn it on',
            image: CameraSetup_2,
        },
        {
            title: 'Allow while visiting site ',
            description: 'Choose this option to prevent camera disconnect during test',
            image: CameraSetup_3,
        },
    ];

    const handleNext = () => {
        dispatch(
            setSubStepStatus({
                step: 'cameraShare',
                subStep: 'introduction',
                status: 'completed',
            }),
        );
        dispatch(nextSubStep());
    }

    return (
        <div className=" h-full min-h-fit w-full flex flex-col justify-between gap-20 items-start">

            <Card className=" p-10 md:p-20 border-none w-full flex flex-col items-center justify-between gap-10 shadow-[0_0_40px_10px_rgb(0,0,0,0.05)]">
                <h2 className="text-lg md:text-xl font-semibold text-base-500 text-center ">
                    Desktop Camera Instructions
                </h2>

                <div className="flex w-full justify-center items-center flex-col md:flex-row gap-10">
                    {requirementCards.map((card, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center text-center gap-10 w-full md:w-1/3 h-[-webkit-fill-available]"
                        >
                            <img
                                src={card.image}
                                alt={card.title}
                                className=" object-contain w-full max-w-[20rem] md:min-w-[10rem]"
                            />

                            <div className="space-y-2 max-w-[20rem]">
                                <h3 className="text-sm md:text-lg font-medium text-base-500">
                                    {card.title}
                                </h3>
                                <p className="text-xs md:text-sm text-base-200 leading-normal">
                                    {card.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                className="px-20 text-sm font-normal disabled:bg-[#D6DEE5] disabled:opacity-100 disabled:text-[#91A1B7]"
            >
                Next <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
        </div>
    )
}

export default IntroTab