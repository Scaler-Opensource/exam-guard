import { STEP_ORDER, enabledStepKeys, stepNumberOf } from '@/utils/stepOrder';

describe('stepOrder', () => {
  const allEnabled = Object.fromEntries(STEP_ORDER.map((key) => [key, { enabled: true }]));

  it('puts identity verification second, after the desktop camera', () => {
    expect(STEP_ORDER.slice(0, 2)).toEqual(['cameraShare', 'identityVerification']);
    expect(stepNumberOf('identityVerification', allEnabled)).toBe(2);
    expect(stepNumberOf('compatibilityChecks', allEnabled)).toBe(5);
  });

  it('numbers only the enabled steps, so the panel heading matches the rail', () => {
    const steps = { ...allEnabled, identityVerification: { enabled: false }, mobileCameraShare: { enabled: false } };
    expect(enabledStepKeys(steps)).toEqual(['cameraShare', 'screenShare', 'compatibilityChecks']);
    expect(stepNumberOf('screenShare', steps)).toBe(2);
  });
});
