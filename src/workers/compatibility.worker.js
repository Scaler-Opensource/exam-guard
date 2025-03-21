// Handle compatibility check events in the background
class CompatibilityWorker {
  constructor() {
    this.config = null;
  }

  init(config) {
    this.config = config;
  }

  // eslint-disable-next-line class-methods-use-this
  sendCompatibilityEvents(passedChecks, baseUrl, endpoint, defaultPayload = {}) {
    console.log('sendCompatibilityEvents', passedChecks, baseUrl, endpoint, defaultPayload);
    const events = Object.keys(passedChecks).map((key) => ({
      type: 'desktop_client',
      name: key,
      data: {
        value: passedChecks[key],
      },
    }));

    const payload = {
      ...defaultPayload,
      events,
    };

    // Use the URL class to construct the full URL
    const url = new URL(endpoint || 'api/v1/proctoring/events', baseUrl);

    fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to send compatibility events to ${url}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Compatibility events sent successfully:', data);
      })
      .catch((error) => {
        console.error('Error sending compatibility events:', error);
      });
  }

  handleMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case 'INIT':
        this.init(data);
        break;

      case 'SEND_COMPATIBILITY_EVENT':
        this.sendCompatibilityEvents(
          data.checks,
          data.baseUrl,
          data.endpoint,
          data.payload,
        );
        break;

      case 'CLEANUP':
        // Do cleanup here
        break;

      default:
        break;
    }
  }
}

// Initialize worker
const worker = new CompatibilityWorker();
// eslint-disable-next-line no-restricted-globals
self.addEventListener('message', (e) => worker.handleMessage(e));
