import { VIOLATIONS } from '../constants';

export default function detectTabSwitch(handleViolation) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      handleViolation(VIOLATIONS.tabSwitch);
    }
  });
}
