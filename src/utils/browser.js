import { BROWSER_NAME } from '@/constants/system';

export const SUPPORTED_BROWSERS = {
  chrome: { name: BROWSER_NAME.CHROME, minVersion: 80 },
  firefox: { name: BROWSER_NAME.FIREFOX, minVersion: 78 },
  edge: { name: BROWSER_NAME.EDGE, minVersion: 80 },
  opera: { name: BROWSER_NAME.OPERA, minVersion: 70 },
  safari: { name: BROWSER_NAME.SAFARI, minVersion: 14 },
};

export const getBrowserInfo = () => {
  const ua = navigator.userAgent;

  const isOpera = (!!window.opr && !!window.opr.addons)
    || !!window.opera
    || ua.indexOf(' OPR/') >= 0;

  const isFirefox = ua.indexOf('Firefox') !== -1;

  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

  const isEdge = ua.indexOf('Edg') !== -1;

  const isChrome = !!window.chrome
    && /Chrome/.test(ua)
    && !isEdge && !isOpera;

  let browserName = BROWSER_NAME.UNKNOWN;
  let version = 0;

  const extractVersion = (regex) => {
    const match = ua.match(regex);
    return match ? parseInt(match[1], 10) : 0;
  };

  if (isEdge) {
    browserName = BROWSER_NAME.EDGE;
    version = extractVersion(/Edg\/(\d+)/);
  } else if (isFirefox) {
    browserName = BROWSER_NAME.FIREFOX;
    version = extractVersion(/Firefox\/(\d+)/);
  } else if (isOpera) {
    browserName = BROWSER_NAME.OPERA;
    version = extractVersion(/OPR\/(\d+)/);
  } else if (isSafari) {
    browserName = BROWSER_NAME.SAFARI;
    version = extractVersion(/Version\/(\d+)/);
  } else if (isChrome) {
    browserName = BROWSER_NAME.CHROME;
    version = extractVersion(/Chrome\/(\d+)/);
  }

  const isSupported = Object.values(SUPPORTED_BROWSERS).some(
    (browser) => browser.name === browserName && version >= browser.minVersion,
  );

  return {
    name: browserName,
    version,
    isSupported,
  };
};
