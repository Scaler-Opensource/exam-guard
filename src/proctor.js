/* eslint-disable prefer-promise-reject-errors */
import 'remote-web-worker';
import { setupAlert, showViolationWarning, closeModal } from './utils/alert';
import {
  DEFAULT_SCREENSHOT_RESIZE_OPTIONS,
  DEFAULT_SNAPSHOT_RESIZE_OPTIONS,
  MAX_EVENTS_BEFORE_SEND,
  SNAPSHOT_SCREENSHOT_FREQUENCY,
  VIOLATIONS,
  DEFAULT_HEADERS_CONTENT_TYPE,
  NETWORK_OPTIONS,
} from './utils/constants';
import {
  dispatchGenericViolationEvent,
  dispatchViolationEvent,
} from './utils/events';
import {
  addFullscreenKeyboardListener,
  detectFullScreen,
  isFullScreen,
  requestFullScreen,
} from './utils/fullScreenBlocker';
import { checkBandwidth } from './utils/network';
import {
  screenshareRequestHandler,
  isScreenShareValid,
  screenshareCleanup,
} from './utils/screenshotV2';
import detectBrowserBlur from './utils/violations/browserBlur';
import detectCopyPasteCut from './utils/violations/copyPasteCut';
import detectExitTab from './utils/violations/exitTab';
import detectRestrictedKeyEvents from './utils/violations/restrictedKeyEvent';
import detectRightClickDisabled from './utils/violations/rightClick';
import detectTabSwitch from './utils/violations/tabSwitch';
import preventTextSelection from './utils/violations/textSelection';
import {
  detectCtrlShiftI,
  detectAltTab,
  detectCmdH,
  detectCmdM,
  detectCtrlW,
  detectCmdW,
  detectCtrlQ,
  detectCtrlShiftC,
  detectCtrlShiftJ,
  detectCmdQ,
} from './utils/violations/keyEvents';

import {
  detectWebcam,
  setupSnapshotCapture,
  setupWebcam,
  getAvailableCameras,
} from './utils/webcam';

import './assets/styles/alert.scss';
import { checkMobilePairingStatus } from './utils/mobilePairing';
import { getBrowserInfo } from './utils/browser';
import { getIndexDbBufferInstance } from './utils/indexDbBuffer';
import ViolationWorker from './workers/violation.worker';
import CompatibilityWorker from './workers/compatibility.worker';
import NetworkWorker from './workers/network.worker';

export default class Proctor {
  constructor({
    baseUrl = null,
    eventsConfig = {},
    disqualificationConfig = {},
    config = {},
    snapshotConfig = {},
    screenshotConfig = {},
    compatibilityCheckConfig = {},
    callbacks = {},
    enableAllAlerts = false,
    headerOptions = {},
    mobilePairingConfig = {},
    qrCodeConfig = {},
    workerConfig = {},
    networkConfig = {},
  }) {
    this.baseUrl = baseUrl;
    this.eventsConfig = {
      maxEventsBeforeSend: MAX_EVENTS_BEFORE_SEND,
      endpoint: eventsConfig.endpoint,
      ...eventsConfig,
    };
    this.headerOptions = {
      csrfToken: null,
      contentType: DEFAULT_HEADERS_CONTENT_TYPE,
      ...headerOptions,
    };
    this.compatibilityCheckConfig = {
      enable: true,
      showAlert: enableAllAlerts,
      frequency: 10000,
      maxFrequency: 60000,
      cpuThreshold: 30,
      disqualificationTimeout: 45000,
      memoryLimit: 200,
      showTimer: true,
      buttonText: 'Confirm Settings',
      headingText: 'System Check: Configure Required Settings',
      defaultPayload: {},
      endpoint: '',
      ...compatibilityCheckConfig,
    };
    this.disqualificationConfig = {
      enabled: true, // Enable when onDisqualify is added
      eventCountThreshold: 5, // Number of violations after which disqualification will occur
      showAlert: enableAllAlerts,
      alertHeading: 'Disqualification Alert',
      alertMessage: 'You have been disqualified from the contest',
      ...disqualificationConfig,
    };
    this.mobilePairingConfig = {
      enabled: false,
      defaultPayload: {},
      endpoint: '',
      ...mobilePairingConfig,
    };
    this.qrCodeConfig = {
      defaultPayload: {},
      endpoint: '',
      ...qrCodeConfig,
    };
    this.proctoringInitialised = false;
    this.config = {
      [VIOLATIONS.tabSwitch]: {
        name: VIOLATIONS.tabSwitch,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.tabSwitch,
      },
      [VIOLATIONS.browserBlur]: {
        name: VIOLATIONS.browserBlur,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.browserBlur,
      },
      [VIOLATIONS.rightClick]: {
        name: VIOLATIONS.rightClick,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.rightClick,
      },
      [VIOLATIONS.exitTab]: {
        name: VIOLATIONS.exitTab,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.exitTab,
      },
      [VIOLATIONS.copyPasteCut]: {
        name: VIOLATIONS.copyPasteCut,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.copyPasteCut,
      },
      [VIOLATIONS.restrictedKeyEvent]: {
        name: VIOLATIONS.restrictedKeyEvent,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.restrictedKeyEvent,
      },
      [VIOLATIONS.textSelection]: {
        name: VIOLATIONS.textSelection,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.textSelection,
      },
      [VIOLATIONS.fullScreen]: {
        name: VIOLATIONS.fullScreen,
        enabled: true,
        showAlert: false,
        recordViolation: true,
        disqualify: true,
        ...config.fullScreen,
      },
      [VIOLATIONS.ctrlShiftI]: {
        name: VIOLATIONS.ctrlShiftI,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.ctrlShiftI,
      },
      [VIOLATIONS.ctrlShiftC]: {
        name: VIOLATIONS.ctrlShiftC,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.ctrlShiftC,
      },
      [VIOLATIONS.ctrlShiftJ]: {
        name: VIOLATIONS.ctrlShiftJ,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.ctrlShiftJ,
      },
      [VIOLATIONS.altTab]: {
        name: VIOLATIONS.altTab,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.altTab,
      },
      [VIOLATIONS.ctrlQ]: {
        name: VIOLATIONS.ctrlQ,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.ctrlQ,
      },
      [VIOLATIONS.ctrlW]: {
        name: VIOLATIONS.ctrlW,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.ctrlW,
      },
      [VIOLATIONS.cmdH]: {
        name: VIOLATIONS.cmdH,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.cmdH,
      },
      [VIOLATIONS.cmdQ]: {
        name: VIOLATIONS.cmdQ,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.cmdQ,
      },
      [VIOLATIONS.cmdM]: {
        name: VIOLATIONS.cmdM,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.cmdM,
      },
      [VIOLATIONS.cmdW]: {
        name: VIOLATIONS.cmdW,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.cmdW,
      },
      [VIOLATIONS.screenshareExit]: {
        name: VIOLATIONS.screenshareExit,
        enabled: true,
        showAlert: enableAllAlerts,
        recordViolation: true,
        disqualify: true,
        ...config.screenshareExit,
      },
    };
    this.snapshotConfig = {
      enabled: false,
      frequency: SNAPSHOT_SCREENSHOT_FREQUENCY, // 5s by default
      resizeTo: DEFAULT_SNAPSHOT_RESIZE_OPTIONS,
      optional: false,
      deviceId: null,
      ...snapshotConfig,
    };
    this.screenshotConfig = {
      enabled: true,
      frequency: SNAPSHOT_SCREENSHOT_FREQUENCY,
      resizeTo: DEFAULT_SCREENSHOT_RESIZE_OPTIONS,
      ...screenshotConfig,
    };
    this.networkConfig = {
      enabled: false,
      interval: NETWORK_OPTIONS.interval,
      testResourceURL: NETWORK_OPTIONS.testResourceURL,
      timeoutMs: NETWORK_OPTIONS.timeoutMs,
      speedThresholdMbps: NETWORK_OPTIONS.speedThresholdMbps,
      alertCooldownSec: NETWORK_OPTIONS.alertCooldownSec,
      ...networkConfig,
    };
    this.callbacks = {
      onDisqualified: callbacks.onDisqualified || (() => { }),
      onWebcamDisabled: callbacks.onWebcamDisabled || (() => { }),
      onWebcamEnabled: callbacks.onWebcamEnabled || (() => { }),
      onSnapshotSuccess: callbacks.onSnapshotSuccess || (() => { }),
      onSnapshotFailure: callbacks.onSnapshotFailure || (() => { }),
      onScreenShareSuccess: callbacks.onScreenShareSuccess || (() => { }),
      onScreenShareFailure: callbacks.onScreenShareFailure || (() => { }),
      onScreenShareEnd: callbacks.onScreenShareEnd || (() => { }),
      onScreenshotFailure: callbacks.onScreenshotFailure || (() => { }),
      onScreenshotSuccess: callbacks.onScreenshotSuccess || (() => { }),
      onFullScreenEnabled: callbacks.onFullScreenEnabled || (() => { }),
      onFullScreenDisabled: callbacks.onFullScreenDisabled || (() => { }),
      onCompatibilityCheckSuccess:
        callbacks.onCompatibilityCheckSuccess || (() => { }),
      onCompatibilityCheckFail:
        callbacks.onCompatibilityCheckFail || (() => { }),
      onNetworkUpdate: callbacks.onNetworkUpdate || (() => { }),
    };
    this.violationEvents = [];
    this.recordedViolationEvents = []; // Store events for batch sending
    this.failedCompatibilityChecks = false; // To track if checks have failed
    this.compatibilityCheckInterval = null;
    this.initializeProctoring = this.initializeProctoring.bind(this);
    this.runCompatibilityChecks = this.runCompatibilityChecks.bind(this);
    this.startCompatibilityChecks = this.startCompatibilityChecks.bind(this);
    this.runAdaptiveCompatibilityChecks = this.runAdaptiveCompatibilityChecks.bind(this);
    this.initialFullScreen = false;
    window.isUserDisqualified = false;
    setupAlert();
    if (this.snapshotConfig.enabled) {
      setupWebcam();
    }
    addFullscreenKeyboardListener();
    this.queueManager = getIndexDbBufferInstance(
      {
        screenshot: (data) => this.callbacks.onScreenshotSuccess(data),
        webcam: (data) => this.callbacks.onSnapshotSuccess(data),
      },
      {
        networkCheckInterval: 5000,
      },
    );
    this.screenshotIntervalId = null;
    this.snapshotIntervalId = null;

    this.workerConfig = {
      violationWorkerUrl: null,
      compatibilityWorkerUrl: null,
      networkWorkerUrl: null,
      ...workerConfig,
    };

    // Initialize workers based on config
    this.violationWorker = this.workerConfig.violationWorkerUrl
      ? new Worker(this.workerConfig.violationWorkerUrl, { type: 'classic' })
      : new ViolationWorker();

    this.violationWorker.addEventListener('message', this.handleWorkerMessage.bind(this));

    // Initialize worker with config
    this.violationWorker.postMessage({
      type: 'INIT',
      data: {
        baseUrl: this.eventsConfig.baseUrl,
        endpoint: this.eventsConfig.endpoint,
        maxEventsBeforeSend: this.eventsConfig.maxEventsBeforeSend,
        contentType: this.headerOptions.contentType,
        csrfToken: this.headerOptions.csrfToken,
      },
    });

    this.networkCheckInterval = null;
    this.lastNetworkCheckResult = null;
    this.NETWORK_CHECK_FREQUENCY = 30000; // 30 seconds
    this.webcamStatus = {
      isEnabled: false,
      error: null,
    };

    // Initialize compatibility worker based on config
    this.compatibilityWorker = this.workerConfig.compatibilityWorkerUrl
      ? new Worker(this.workerConfig.compatibilityWorkerUrl, { type: 'classic' })
      : new CompatibilityWorker();

    // Initialize worker with config
    this.compatibilityWorker.postMessage({
      type: 'INIT',
      data: {
        baseUrl: this.baseUrl,
        frequency: this.compatibilityCheckConfig.frequency,
        maxFrequency: this.compatibilityCheckConfig.maxFrequency,
      },
    });

    this.networkWorker = null;
    this.lastNetworkAlertTimestamp = 0;
  }

  async initializeProctoring() {
    this.proctoringInitialised = true;

    // TODO: Enable network check once confident
    // Start periodic network checks if needed for screenshots or snapshots
    // if (this.screenshotConfig.enabled || this.snapshotConfig.enabled) {
    //   this.startPeriodicNetworkCheck();
    // }

    if (this.screenshotConfig.enabled) {
      await this.handleScreenshareRequest();
    }

    if (this.config.fullScreen.enabled) {
      detectFullScreen({
        onFullScreenDisabled: this.handleFullScreenDisabled.bind(this),
        onFullScreenEnabled: this.handleFullScreenEnabled.bind(this),
      });
    }

    if (this.config.tabSwitch.enabled) {
      detectTabSwitch(this.handleViolation.bind(this));
    }

    if (this.config.browserBlur.enabled) {
      detectBrowserBlur(this.handleViolation.bind(this));
    }

    if (this.config.rightClick.enabled) {
      detectRightClickDisabled(this.handleViolation.bind(this));
    }

    if (this.config.exitTab.enabled) {
      detectExitTab(this.handleViolation.bind(this));
    }

    if (this.config.copyPasteCut.enabled) {
      detectCopyPasteCut(this.handleViolation.bind(this));
    }

    if (this.config.ctrlShiftI.enabled) {
      detectCtrlShiftI(this.handleViolation.bind(this));
    }

    if (this.config.ctrlShiftC.enabled) {
      detectCtrlShiftC(this.handleViolation.bind(this));
    }

    if (this.config.ctrlShiftJ.enabled) {
      detectCtrlShiftJ(this.handleViolation.bind(this));
    }

    if (this.config.altTab.enabled) {
      detectAltTab(this.handleViolation.bind(this));
    }

    if (this.config.ctrlQ.enabled) {
      detectCtrlQ(this.handleViolation.bind(this));
    }

    if (this.config.ctrlW.enabled) {
      detectCtrlW(this.handleViolation.bind(this));
    }

    if (this.config.cmdH.enabled) {
      detectCmdH(this.handleViolation.bind(this));
    }

    if (this.config.cmdW.enabled) {
      detectCmdW(this.handleViolation.bind(this));
    }

    if (this.config.cmdM.enabled) {
      detectCmdM(this.handleViolation.bind(this));
    }

    if (this.config.cmdQ.enabled) {
      detectCmdQ(this.handleViolation.bind(this));
    }

    if (this.config.restrictedKeyEvent.enabled) {
      detectRestrictedKeyEvents(this.handleViolation.bind(this));
    }

    if (this.config.textSelection.enabled) {
      preventTextSelection();
    }

    // Setup webcam if snapshots are enabled
    if (this.snapshotConfig.enabled) {
      // Get the stored device ID from localStorage
      const storedDeviceId = localStorage.getItem('selectedWebcamDeviceId');
      detectWebcam({
        onWebcamEnabled: this.handleWebcamEnabled.bind(this),
        onWebcamDisabled: this.handleWebcamDisabled.bind(this),
        optional: this.snapshotConfig.optional,
        deviceId: storedDeviceId || this.snapshotConfig.deviceId,
      });
    }

    if (this.networkConfig.enabled) {
      this.startNetworkMonitoring();
    }

    // Listen to tab close or exit
    this.handleWindowUnload();
    this.startCompatibilityChecks();
  }

  startNetworkMonitoring() {
    if (this.networkWorker) return;

    this.networkWorker = this.workerConfig.networkWorkerUrl
      ? new Worker(this.workerConfig.networkWorkerUrl, { type: 'classic' })
      : new NetworkWorker();

    this.networkWorker.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'NETWORK_UPDATE') {
        this.handleNetworkUpdate(payload);
      }
    };

    this.networkWorker.postMessage({
      type: 'START',
      payload: {
        interval: this.networkConfig.interval,
        testResourceURL: this.networkConfig.testResourceURL,
        timeoutMs: this.networkConfig.timeoutMs,
        ...this.networkConfig,
      }
    });
  }

  handleNetworkUpdate(metric) {
    if (this.callbacks.onNetworkUpdate) {
      this.callbacks.onNetworkUpdate(metric);
    }

    const { speedThresholdMbps, alertCooldownSec } = this.networkConfig;
    const { speedKbps, error } = metric;
    const currentTime = Date.now();

    const isBadReading = error || (speedKbps < speedThresholdMbps * 1024);

    if (isBadReading) {
      const timeSinceLastAlert = (currentTime - this.lastNetworkAlertTimestamp) / 1000;

      if (timeSinceLastAlert >= alertCooldownSec) {
        this.lastNetworkAlertTimestamp = currentTime;
        showViolationWarning(
          'Weak Network Detected',
          'Connect to a stronger internet to avoid issues during your contest',
          false,
          true,
        );
      }
    } else {
      closeModal(true);
    }
  }

  stopNetworkMonitoring() {
    if (this.networkWorker) {
      this.networkWorker.postMessage({ type: 'STOP' });
      this.networkWorker.terminate();
      this.networkWorker = null;
    }
  }

  startCompatibilityChecks() {
    if (!this.compatibilityCheckConfig.enable) return;

    // this.compatibilityCheckInterval = setTimeout(() => {
    this.runAdaptiveCompatibilityChecks();
    // }, this.compatibilityCheckConfig.frequency);
  }

  runAdaptiveCompatibilityChecks() {
    const start = performance.now();
    // MB (adjust this as per your requirement)
    const { memoryLimit } = this.compatibilityCheckConfig;

    // Check memory usage via the browser's Performance API (for browsers that support it)
    const memoryUsage = window.performance && window.performance.memory
      ? window.performance.memory.usedJSHeapSize / 1024 / 1024 // in MB
      : 0; // If memory data is not available, assume 0 (safe fallback)

    if (memoryUsage < memoryLimit) {
      // Run compatibility checks (e.g., webcam, network speed, etc.)
      this.runCompatibilityChecks(
        this.handleCompatibilitySuccess.bind(this),
        this.handleCompatibilityFailure.bind(this),
      );
    }

    const duration = performance.now() - start;

    /* Debugging logs */
    console.log(
      '%c%s',
      'color: #ff2525',
      'Time take for running Compatibility checks (in ms):',
      duration,
    );

    console.log(
      '%c%s',
      'color: #ff2525',
      'Is CPU peformance fine ?: ',
      duration < this.compatibilityCheckConfig.cpuThreshold,
    );

    // Adjust frequency based on system load
    const delay = duration < this.compatibilityCheckConfig.cpuThreshold
      ? this.compatibilityCheckConfig.frequency
      : this.compatibilityCheckConfig.maxFrequency;

    // Set up a new interval with the updated frequency
    this.compatibilityCheckInterval = setTimeout(() => {
      this.runAdaptiveCompatibilityChecks();
    }, delay);
  }

  handleCompatibilitySuccess(passedChecks) {
    this.callbacks.onCompatibilityCheckSuccess({ passedChecks });

    if (!this.proctoringInitialised) return;

    this.compatibilityWorker.postMessage({
      type: 'SEND_COMPATIBILITY_EVENT',
      data: {
        checks: passedChecks,
        baseUrl: this.baseUrl,
        endpoint: this.compatibilityCheckConfig.endpoint,
        payload: {
          ...this.compatibilityCheckConfig.defaultPayload,
          token: window.PROCTORING_SESSION_TOKEN,
        },
      },
    });
  }

  handleCompatibilityFailure(passedChecks) {
    console.log('%c⧭', 'color: #d90000', 'Compatibility Failed, checks: ', passedChecks);
    this.callbacks.onCompatibilityCheckFail({ passedChecks });
    if (!this.proctoringInitialised) return;
    this.compatibilityWorker.postMessage({
      type: 'SEND_COMPATIBILITY_EVENT',
      data: {
        checks: passedChecks,
        baseUrl: this.baseUrl,
        endpoint: this.compatibilityCheckConfig.endpoint,
        payload: {
          ...this.compatibilityCheckConfig.defaultPayload,
          token: window.PROCTORING_SESSION_TOKEN,
        },
      },
    });
  }

  stopCompatibilityChecks() {
    if (this.compatibilityCheckInterval) {
      clearInterval(this.compatibilityCheckInterval);
    }
  }

  checkMobileCompatiblity({ onSuccess, onFailure }) {
    checkMobilePairingStatus({
      baseUrl: this.baseUrl,
      endpoint: this.mobilePairingConfig.endpoint,
      defaultPayload: {
        token: window.PROCTORING_SESSION_TOKEN,
        ...this.mobilePairingConfig.defaultPayload,
      },
      onSuccess,
      onFailure,
    });
  }

  runCompatibilityChecks(onSuccess, onFailure) {
    const compatibilityChecks = {
      screenshare: this.screenshotConfig.enabled,
      webcam: this.snapshotConfig.enabled,
      networkSpeed:
        this.snapshotConfig.enabled || this.screenshotConfig.enabled,
      fullscreen: this.config[VIOLATIONS.fullScreen].enabled,
      browser: true,
      mobileSnapshot: this.mobilePairingConfig.enabled,
      mobileBattery: this.mobilePairingConfig.enabled,
      mobileSetup: this.mobilePairingConfig.enabled,
    };

    // Initialize object to store the result of passed checks
    const passedChecks = {
      screenshare: true,
      webcam: true,
      mobileSnapshot: true,
      mobileBattery: true,
      mobileSetup: true,
      browser: true,
      networkSpeed: true,
      fullscreen: true,
    };

    // Array to store all compatibility promises
    const compatibilityPromises = [];

    // Webcam check
    if (compatibilityChecks.webcam) {
      const webcamCheck = new Promise((resolve, reject) => {
        // Get the stored device ID from localStorage
        const storedDeviceId = localStorage.getItem('selectedWebcamDeviceId');
        detectWebcam({
          onWebcamEnabled: () => resolve('webcam'),
          onWebcamDisabled: () => {
            passedChecks.webcam = false;
            reject('webcam');
          },
          optional: this.snapshotConfig.optional,
          deviceId: storedDeviceId || this.snapshotConfig.deviceId,
        });
      });
      compatibilityPromises.push(webcamCheck);
    }

    // Browser check
    const browserCheck = new Promise((resolve, reject) => {
      const browserInfo = getBrowserInfo();
      if (!browserInfo.isSupported) {
        passedChecks.browser = false;
        reject('browser');
      } else {
        resolve('browser');
      }
    });
    compatibilityPromises.push(browserCheck);

    // Network speed check
    if (compatibilityChecks.networkSpeed) {
      const networkCheck = new Promise((resolve, reject) => {
        if (compatibilityChecks.networkSpeed) {
          resolve('network_speed');
        } else {
          passedChecks.networkSpeed = false;
          reject('network_speed');
        }
      });
      compatibilityPromises.push(networkCheck);
    }

    // Full screen check
    if (compatibilityChecks.fullscreen) {
      const fullScreenCheck = new Promise((resolve, reject) => {
        if (!isFullScreen()) {
          passedChecks.fullscreen = false;
          reject('fullscreen');
        } else {
          resolve('fullscreen');
        }
      });
      compatibilityPromises.push(fullScreenCheck);
    }

    if (compatibilityChecks.screenshare) {
      const screenshareCheck = new Promise((resolve, reject) => {
        isScreenShareValid({
          onSuccess: () => {
            resolve('screenshare');
          },
          onFailure: (error) => {
            passedChecks.screenshare = false;
            reject('screenshare');
            console.warn(error);
          },
        });
      });
      compatibilityPromises.push(screenshareCheck);
    }

    if (compatibilityChecks.mobileBattery
      || compatibilityChecks.mobileSetup
      || compatibilityChecks.mobileSnapshot) {
      const mobilePairingCheck = new Promise((resolve, reject) => {
        this.checkMobileCompatiblity({
          onSuccess: (data) => {
            if (data.success) {
              resolve({ success: true, checks: passedChecks });
            } else {
              const secondaryCameraChecks = data.checks?.secondary_camera.checks;
              Object.keys(secondaryCameraChecks).forEach((check) => {
                const checkData = secondaryCameraChecks[check];
                switch (check) {
                  case 'setup':
                    if (!checkData?.success) passedChecks.mobileSetup = false;
                    break;
                  case 'snapshot':
                    if (!checkData?.success) passedChecks.mobileSnapshot = false;
                    break;
                  case 'battery':
                    if (!checkData?.success) passedChecks.mobileBattery = false;
                    break;
                  default:
                    break;
                }
              });
              reject({ success: false, checks: passedChecks });
            }
          },
          onFailure: () => {
            passedChecks.mobileBattery = false;
            passedChecks.mobileSnapshot = false;
            passedChecks.mobileSetup = false;
            reject({ success: false, checks: passedChecks });
          },
        });
      });
      compatibilityPromises.push(mobilePairingCheck);
    }

    // Wait for all compatibility checks to complete
    Promise.allSettled(compatibilityPromises)
      .then((results) => {
        // If any check fails, handle failure and return the updated object
        const failedCheck = results.find(
          (result) => result.status === 'rejected',
        );

        if (failedCheck) {
          onFailure?.(passedChecks);
        } else {
          closeModal();
          this.failedCompatibilityChecks = false;
          onSuccess?.(passedChecks);
        }
      })
      .catch(() => {
        onFailure?.(passedChecks);
      });
  }

  handleWebcamDisabled({ error }) {
    this.callbacks.onWebcamDisabled({ error });
  }

  handleScreenshotDisabled() {
    this.callbacks.onScreenshotDisabled();
  }

  handleWebcamEnabled() {
    if (this.proctoringInitialised) {
      this.snapshotIntervalId = setupSnapshotCapture({
        onSnapshotFailure: this.handleSnapshotFailure.bind(this),
        frequency: this.snapshotConfig.frequency,
        resizeDimensions: this.snapshotConfig.resizeTo,
      });
    }

    this.callbacks.onWebcamEnabled();
  }

  handleScreenShareSuccess() {
    this.callbacks.onScreenShareSuccess();
    this.enableFullScreen();
  }

  handleScreenShareFailure(errorCode) {
    this.callbacks.onScreenShareFailure(errorCode);
  }

  handleScreenShareEnd() {
    this.handleViolation(VIOLATIONS.screenshareExit);
    this.callbacks.onScreenShareEnd();
  }

  handleScreenshotSuccess({ blob }) {
    this.callbacks.onScreenshotSuccess({ blob });
  }

  async handleScreenshareRequest({ disableScreenshot } = {}) {
    await screenshareRequestHandler.bind(this)({ disableScreenshot });
  }

  handleWebcamRequest() {
    // Get the stored device ID from localStorage
    const storedDeviceId = localStorage.getItem('selectedWebcamDeviceId');
    detectWebcam({
      onWebcamEnabled: this.handleWebcamEnabled.bind(this),
      onWebcamDisabled: this.handleWebcamDisabled.bind(this),
      optional: this.snapshotConfig.optional,
      deviceId: storedDeviceId || this.snapshotConfig.deviceId,
    });
  }

  async getWebcamDevices() {
    return getAvailableCameras.bind(this)();
  }

  setWebcamDevice(deviceId) {
    this.snapshotConfig.deviceId = deviceId;
    // Store the selected device ID in localStorage
    localStorage.setItem('selectedWebcamDeviceId', deviceId);
  }

  handleScreenshotFailure() {
    this.callbacks.onScreenshotFailure();
  }

  handleSnapshotFailure() {
    this.callbacks.onSnapshotFailure();
  }

  handleFullScreenDisabled() {
    if (!this.initialFullScreen) {
      // requestFullScreen(); // can not request without user interaction
      this.initialFullScreen = true;
    } else {
      this.handleViolation(VIOLATIONS.fullScreen);
      this.callbacks.onFullScreenDisabled();
    }
  }

  handleFullScreenEnabled() {
    this.callbacks.onFullScreenEnabled();
    this.runCompatibilityChecks(
      this.handleCompatibilitySuccess.bind(this),
      this.handleCompatibilityFailure.bind(this),
    );
  }

  handleCompatibilityChecks({ forceRun = false } = {}) {
    if (!this.proctoringInitialised || forceRun) {
      this.runCompatibilityChecks(
        this.handleCompatibilitySuccess.bind(this),
        this.handleCompatibilityFailure.bind(this),
      );
    }
  }

  handleViolation(type, value = null, forceDisqualify = false) {
    if (!VIOLATIONS[type]) return;
    const violation = {
      event_type: this.config[type].name,
      event_value: value,
      timestamp: `${new Date().toJSON().slice(0, 19).replace('T', ' ')} UTC`,
      disqualify: this.config[type].disqualify,
    };

    if (this.config[type].showAlert) {
      showViolationWarning(
        'Warning',
        `You performed a violation during the test. 
         Repeating this action may result in disqualification 
         and a failed test attempt.`,
        false,
      );
    }
    if (this.config[type].recordViolation) {
      this.recordViolation(violation);
    }

    dispatchViolationEvent(type, violation);
    dispatchGenericViolationEvent(violation);

    if (forceDisqualify) {
      this.disqualifyUser();
    }
  }

  disqualifyUser() {
    if (!this.disqualificationConfig.enabled) return;

    window.isUserDisqualified = true;
    this.sendEvents(); // To send any events before disqualifying the user
    // Show disqualification warning before calling the disqualified callback
    if (this.disqualificationConfig.showAlert) {
      showViolationWarning(
        this.disqualificationConfig.alertHeading,
        this.disqualificationConfig.alertMessage,
        true,
      );
    }
    this.callbacks.onDisqualified(); // Trigger disqualification callback
  }

  recordViolation(violation) {
    this.violationWorker.postMessage({
      type: 'RECORD_VIOLATION',
      data: violation,
    });
  }

  sendEvents() {
    this.violationWorker.postMessage({ type: 'SEND_EVENTS' });
  }

  handleWindowUnload() {
    // Send events when the user tries to exit or close the window/tab
    window.addEventListener('beforeunload', this._cleanup.bind(this));
    window.addEventListener('unload', this._cleanup.bind(this));
  }

  // eslint-disable-next-line class-methods-use-this
  enableFullScreen() {
    if (!isFullScreen()) {
      requestFullScreen();
    }
  }

  on(violationType, callback) {
    document.addEventListener(violationType, (event) => {
      callback(this.violationEvents, event);
    });
  }

  getTotalViolationsCountByType(type) {
    return this.violationEvents.filter((violation) => violation.type === type)
      .length;
  }

  getTotalViolationsCount() {
    return this.violationEvents.length;
  }

  getAllViolations() {
    return this.violationEvents;
  }

  getViolationsCountForDisqualify() {
    return this.violationEvents.filter(
      (violation) => violation.disqualify === true,
    ).length;
  }

  _cleanup() {
    this.violationWorker.postMessage({ type: 'CLEANUP' });
    this.violationWorker.terminate();
    this.stopNetworkMonitoring();
    this.stopCompatibilityChecks();
    screenshareCleanup();
    this.queueManager.cleanup();
    clearInterval(this.snapshotIntervalId);

    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }
    this.compatibilityWorker.postMessage({ type: 'CLEANUP' });
    this.compatibilityWorker.terminate();
  }

  handleCleanup() {
    console.log('cleanup');
    this._cleanup();
  }

  handleWorkerMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case 'VIOLATION_UPDATE':
        // Update local violations array
        this.violationEvents = data.violations;

        // Check for disqualification
        if (data.violationCount >= this.disqualificationConfig.eventCountThreshold) {
          this.disqualifyUser();
        }
        break;
      default:
        break;
    }
  }

  startPeriodicNetworkCheck() {
    // Run initial check
    this.runNetworkCheck();

    // Set up interval
    this.networkCheckInterval = setInterval(() => {
      this.runNetworkCheck();
    }, this.NETWORK_CHECK_FREQUENCY);
  }

  async runNetworkCheck() {
    try {
      const isLowBandwidth = await checkBandwidth();
      this.lastNetworkCheckResult = !isLowBandwidth; // true if network is good
      console.log('Network check result:', this.lastNetworkCheckResult);
    } catch (error) {
      this.lastNetworkCheckResult = false;
      console.warn('Network check failed:', error);
    }
  }
}
