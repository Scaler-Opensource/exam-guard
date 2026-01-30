import React from 'react'
import Laptop from '@/assets/images/prerequisite-laptop.svg';
import Phone from '@/assets/images/prerequisite-phone.svg';
import QuietPlaceWithPhone from '@/assets/images/prerequisite-quiet-place-phone.svg';
import QuietPlace from '@/assets/images/prerequisite-quiet-place.svg';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxhooks';
import { nextSubStep, selectStep, setSubStepStatus } from '@/store/features/workflowSlice';
import { PREREQUISITE_STEPS } from '@/utils/constants';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';

const IntroTab = () => {
  const dispatch = useAppDispatch();

  const { enabled: isDCPEnabled } = useAppSelector((state) =>
    selectStep(state, 'mobileCameraShare'),
  );

  const requirementCards = [
    {
      title: 'Computer',
      description: 'With a camera, microphone and speakers',
      image: Laptop,
    },
    ...(isDCPEnabled ? [{
      title: 'Phone',
      description: 'It should be fully charged and kept in Do Not Disturb Mode',
      image: Phone,
    }] : []),
    {
      title: 'Quiet Environment',
      description: 'You should not be interrupted for the exam duration',
      image: isDCPEnabled ? QuietPlaceWithPhone : QuietPlace,
    },
  ];

  const handleStartSetup = () => {
    dispatch(
      setSubStepStatus({
        step: 'prerequisites',
        subStep: PREREQUISITE_STEPS.intro,
        status: 'completed',
      }),
    );
    dispatch(nextSubStep());
  }

  return (
    <div className=" h-full min-h-fit w-full flex flex-col justify-between gap-20 items-start">

      <Card className=" p-10 md:p-20 border-none w-full flex flex-col items-center justify-between gap-10 shadow-[0_0_40px_10px_rgb(0,0,0,0.05)]">
        <h2 className="text-lg md:text-xl font-semibold text-base-500 text-center ">
          Welcome! You will need the following for this test
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
        onClick={handleStartSetup}
        className='font-normal text-sm px-20 mb-10'
      >
        Start Setup
      </Button>
    </div>
  )
}

export default IntroTab