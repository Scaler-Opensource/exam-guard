import { VIOLATIONS } from '../constants';
import { getIsBrowserBlurred } from './browserBlur';

export default function detectTabSwitch(handleViolation) {
  const visibilityChangeHandler = () => {
    const isBlurred = getIsBrowserBlurred();
    if (document.hidden && !!isBlurred) {
      handleViolation(VIOLATIONS.tabSwitch);
    }
  };
  document.addEventListener('visibilitychange', visibilityChangeHandler);
}
