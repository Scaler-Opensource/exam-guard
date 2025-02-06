import { Proctor } from '@/types/proctorTypes';

export interface RootState {
  user: {
    name: string;
  };
}

export interface AssessmentInfoState {
  userName: string;
  assessmentName: string;
  proctor: Proctor | null;
  token: string | null;
}
