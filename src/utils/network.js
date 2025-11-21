// eslint-disable-next-line max-len
const imageLocation = 'https://dajh2p2mfq4ra.cloudfront.net/assets/icons/ib-logo-hire-8f3406787bc4241628bb7e5bea43d56a7ab275401134c297b6631c8b81cd3996.png';
const LINK_SPEED_THRESHOLD = 400;

export async function checkBandwidth() {
  return new Promise((resolve, reject) => {
    const download = new Image();
    const startTime = performance.now(); // More precise timing

    download.onload = function onload() {
      const duration = (performance.now() - startTime) / 1000;
      const imageSizeInBytes = download.width * download.height * 4;
      const imageSizeInKilobits = (imageSizeInBytes * 8) / 1024;
      const speedKbps = (imageSizeInKilobits) / duration;

      resolve(speedKbps < LINK_SPEED_THRESHOLD);
    };

    download.onerror = reject;
    download.src = `${imageLocation}?t=${Date.now()}`;
  });
}


export async function checkBandwidthV2(testResourceURL, timeoutMs) {
  if (navigator.onLine === false) {
    return { speedKbps: 0, error: 'NETWORK OFFLINE' };
  }

  const getNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  const cacheBuster = `?t=${Date.now()}&r=${Math.random()}`;
  const url = `${testResourceURL}${cacheBuster}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {

    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      signal: controller.signal
    });

    if (!response.ok) {
      return { speedKbps: 0, error: `Server Error: ${response.status}` };
    }

    const headerSize = response.headers.get('Content-Length');
    
    const startTime = getNow();
    const blob = await response.blob();
    const endTime = getNow();
    
    clearTimeout(timeoutId);

    const durationMs = (endTime - startTime); 
    const durationSeconds = (durationMs < 1 ? 1 : durationMs) / 1000;

    let sizeInBytes = 0;
    if (headerSize && !isNaN(parseInt(headerSize))) {
      sizeInBytes = parseInt(headerSize);
    } else {
      sizeInBytes = blob.size;
    }

    if (!sizeInBytes) {
      return { speedKbps: 0, error: 'Empty response or unknown size' };
    }

    const sizeInBits = sizeInBytes * 8;
    const speedKbps = (sizeInBits / 1024) / durationSeconds;

    return { speedKbps };

  } catch (error) {
    return { speedKbps: 0, error: error.message };
  }
}