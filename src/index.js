import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import '@/styles/globals.css';
import App from '@/App';
import store from '@/store/store';

class ProctorLibrary {
  static initialize(containerId, props = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    container.className = 'proctor-library-root';

    const defaultProps = {
      baseUrl: window.location.origin,
      initConfig: {},
      eventsConfig: {},
      disqualificationConfig: {},
      config: {},
      snapshotConfig: {},
      screenshotConfig: {},
      compatibilityCheckConfig: {},
      callbacks: {},
      enableAllAlerts: true,
      headerOptions: {},
      mockModeEnabled: false,
      additionalData: {},
    };

    const root = createRoot(container);
    root.render(
      <Provider store={store}>
        <div id='proctor-library-root-id'>
          <App {...defaultProps} {...props} />
        </div>
      </Provider>,
    );
  }
}

export default ProctorLibrary;
