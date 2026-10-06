export function requestFullScreen() {
  const docElm = document.documentElement;
  if (docElm.requestFullscreen) {
    docElm.requestFullscreen();
  } else if (docElm.mozRequestFullScreen) {
    docElm.mozRequestFullScreen();
  } else if (docElm.webkitRequestFullScreen) {
    docElm.webkitRequestFullScreen();
  } else if (docElm.msRequestFullscreen) {
    docElm.msRequestFullscreen();
  }
}

export function isFullScreen() {
  return document.fullscreenElement
    || document.webkitFullscreenElement
    || document.mozFullScreenElement
    || document.msFullscreenElement;
}

export function addFullscreenKeyboardListener() {
  document.addEventListener('keydown', (event) => {
    if (!isFullScreen() && (event.key === 'Enter' || event.key === 'Return')) {
      requestFullScreen();
      const fullScreenBlocker = document.getElementById('fullscreenBlocker');

      if (fullScreenBlocker) {
        fullScreenBlocker.style.display = 'none';
      }
    }
  });
}

// Detect fullscreen state changes and call appropriate callbacks
export function detectFullScreen({ onFullScreenEnabled, onFullScreenDisabled }) {
  if (!isFullScreen()) {
    onFullScreenDisabled();
  } else {
    onFullScreenEnabled();
  }

  function handleFullScreenChange() {
    if (!isFullScreen()) {
      onFullScreenDisabled();
    } else {
      onFullScreenEnabled();
    }
  }

  document.addEventListener('fullscreenchange', handleFullScreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
  document.addEventListener('mozfullscreenchange', handleFullScreenChange);
  document.addEventListener('MSFullscreenChange', handleFullScreenChange);
}
