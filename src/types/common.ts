import { Proctor } from '@/types/proctorTypes';
import { IdentityPolicy } from '@/utils/identityVerification';

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
  // Pre-test identity verification policy returned with the token; null until init responds.
  identity: IdentityPolicy | null;
}
