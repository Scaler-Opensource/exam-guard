/* eslint-disable no-restricted-globals */

import { checkBandwidthV2 } from '../utils/network';

let config = {
  // historySize: 5,  // Keep last 5 checks for smoothing (better stability)
};

let timer = null;
// const historyBuffer = [];

async function runCheck() {
  const rawMetric = await checkBandwidthV2(config.testResourceURL, config.timeoutMs);

  if (rawMetric.error) {
    self.postMessage({
      type: 'NETWORK_UPDATE',
      payload: {
        speedKbps: 0,
        timestamp: Date.now(),
        error: rawMetric.error
      }
    });
    return;
  }

  // historyBuffer.push(rawMetric.speedKbps);
  // if (historyBuffer.length > config.historySize) {
  //   historyBuffer.shift();
  // }

  // const avgSpeed = historyBuffer.reduce((a, b) => a + b, 0) / historyBuffer.length;

  self.postMessage({
    type: 'NETWORK_UPDATE',
    payload: {
      speedKbps: rawMetric.speedKbps,
      timestamp: Date.now(),
      error: null
    }
  });
}

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'START':
      if (payload) config = { ...config, ...payload };

      runCheck(); // first check immediately so that user does not wait for interval

      if (timer) clearInterval(timer);
      timer = setInterval(runCheck, config.interval);
      break;

    case 'STOP':
      if (timer) clearInterval(timer);
      timer = null;
      break;

    case 'CHECK_NOW':
      runCheck();
      break;

    default:
      console.warn('Worker received unknown message:', type);
  }
});