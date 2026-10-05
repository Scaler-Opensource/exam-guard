let violationEvents = [];
let recordedViolationEvents = [];
let config = {};

function sendEvents() {
  console.log('sendEvents', config);
  if (!config.baseUrl || !config.endpoint) return;
  if (recordedViolationEvents.length === 0) return;

  const url = new URL(config.endpoint, config.baseUrl).toString();
  const payload = new URLSearchParams({
    events: JSON.stringify(recordedViolationEvents),
  });

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': config.contentType,
      'X-CSRF-TOKEN': config.csrfToken,
    },
    body: payload.toString(),
  })
    .then(() => {
      recordedViolationEvents = [];
    })
    .catch((error) => {
      console.error('Failed to send event:', error);
    });
}

function getViolationsCountForDisqualify() {
  return violationEvents.filter(
    (violation) => violation.disqualify === true,
  ).length;
}

function cleanup() {
  sendEvents();
  violationEvents = [];
  recordedViolationEvents = [];
}

function recordViolation(violation) {
  violationEvents.push(violation);

  recordedViolationEvents.push({
    event_type: violation.event_type,
    event_value: violation.event_value,
    timestamp: violation.timestamp,
  });

  if (recordedViolationEvents.length >= config.maxEventsBeforeSend) {
    sendEvents();
  }

  // Send both violation count and updated violations array back to main thread
  // eslint-disable-next-line no-restricted-globals
  self.postMessage({
    type: 'VIOLATION_UPDATE',
    data: {
      violationCount: getViolationsCountForDisqualify(),
      violations: violationEvents,
    },
  });
}

// eslint-disable-next-line no-restricted-globals
self.addEventListener('message', (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'INIT':
      config = data;
      break;

    case 'RECORD_VIOLATION':
      recordViolation(data);
      break;

    case 'SEND_EVENTS':
      sendEvents();
      break;

    case 'CLEANUP':
      cleanup();
      break;

    default:
      break;
  }
});
