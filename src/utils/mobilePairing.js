const defaultEndpoint = '/api/v1/proctoring/events';

export const checkMobilePairingStatus = async ({
  baseUrl, endpoint, defaultPayload,
  onSuccess, onFailure,
}) => {
  try {
    const url = new URL(endpoint || defaultEndpoint, baseUrl);
    url.search = new URLSearchParams({ ...defaultPayload }).toString();

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const pollingData = await response.json(); // Await the JSON parsing
    onSuccess?.(pollingData);
  } catch (e) {
    onFailure?.(e);
  }
};
