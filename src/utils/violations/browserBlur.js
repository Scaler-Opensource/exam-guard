import { VIOLATIONS } from '../constants';

export default function detectBrowserBlur(handleViolation) {
  window.addEventListener('blur', () => {
    handleViolation(VIOLATIONS.browserBlur, false);
  });
}
