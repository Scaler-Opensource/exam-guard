// eslint-disable-next-line import/prefer-default-export
export const VIOLATIONS = {
  tabSwitch: 'tabSwitch',
  browserBlur: 'browserBlur',
  rightClick: 'rightClick',
  exitTab: 'exitTab',
  copyPasteCut: 'copyPasteCut',
  restrictedKeyEvent: 'restrictedKeyEvent',
  textSelection: 'textSelection',
  fullScreen: 'fullScreen',
  ctrlShiftI: 'ctrlShiftI',
  ctrlShiftC: 'ctrlShiftC',
  altTab: 'altTab',
  ctrlQ: 'ctrlQ',
  ctrlW: 'ctrlW',
  cmdM: 'cmdM',
  cmdH: 'cmdH',
  cmdW: 'cmdW',
  cmdQ: 'cmdQ',
  ctrlShiftJ: 'ctrlShiftJ',
  screenshareExit: 'screenshareExit',
};
export const SNAPSHOT_SCREENSHOT_FREQUENCY = 5000;
export const DEFAULT_SNAPSHOT_RESIZE_OPTIONS = { width: 480, height: 360 };
export const DEFAULT_SCREENSHOT_RESIZE_OPTIONS = { width: 480, height: 270 };
export const MAX_EVENTS_BEFORE_SEND = 5;
export const DEFAULT_HEADERS_CONTENT_TYPE = 'application/x-www-form-urlencoded';
export const COMPATIBILITY_CHECK_STATUSES = {
  success: 'success',
  default: 'default',
  failed: 'failed',
};

export const PAIRING_STEPS = {
  pairing: 'codeScan',
  orientation: 'cameraPairing',
  mobileCompatibility: 'systemChecks',
};

export const PREREQUISITE_STEPS = {
  intro: 'introduction',
  systemChecks: 'systemChecks',
  networkChecks: 'networkChecks', 
  fullScreenCheck: 'fullScreenCheck',
  consent: 'consent',
};

export const COMPATIBILITY_CHECK_SUBSTEPS = [
  'systemChecks', 
  'networkChecks', 
  'fullScreenCheck'
];

export const MIN_SNAPSHOT_COUNT = 3;
export const TOAST_AUTO_CLOSE_DURATION = 8000;

export const NETWORK_OPTIONS = {
  interval: 5000,
  testResourceURL: 'https://dajh2p2mfq4ra.cloudfront.net/assets/icons/ib-logo-hire-8f3406787bc4241628bb7e5bea43d56a7ab275401134c297b6631c8b81cd3996.png',
  timeoutMs: 10000,
  speedThresholdMbps: 1,
  alertCooldownSec: 60,
};
