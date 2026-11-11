/** @jest-environment jsdom */
import { watchFullScreen } from '@/utils/fullScreenBlocker';

const setFullScreen = (element: Element | null) => {
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => element });
  document.dispatchEvent(new Event('fullscreenchange'));
};

describe('watchFullScreen', () => {
  afterEach(() => setFullScreen(null));

  it('reports entering and leaving full screen, so the pre-test row can follow it', () => {
    const seen: boolean[] = [];
    watchFullScreen((on) => seen.push(on));

    setFullScreen(document.documentElement);
    setFullScreen(null);

    expect(seen).toEqual([true, false]);
  });

  it('stops reporting once unsubscribed', () => {
    const seen: boolean[] = [];
    const stop = watchFullScreen((on) => seen.push(on));

    stop();
    setFullScreen(document.documentElement);

    expect(seen).toEqual([]);
  });
});
