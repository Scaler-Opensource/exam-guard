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
  // Host-supplied onboarding logo; falls back to the bundled logo when absent.
  logoUrl: string | null;
  // Host-supplied screen-share demo image; falls back to the bundled mock when absent.
  screenShareMockUrl: string | null;
  proctor: Proctor | null;
  token: string | null;
  // Pre-test identity verification policy returned with the token; null until init responds.
  identity: IdentityPolicy | null;
}
