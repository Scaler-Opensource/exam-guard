import {
  createApi, fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';

let currentBaseUrl = window.location.origin;

export const configureService = (config) => {
  if (config?.baseUrl) {
    currentBaseUrl = config.baseUrl;
  }
};

const prepareHeaders = (headers, { getState }) => {
  const { token } = getState().assessmentInfo;
  if (token) {
    headers.set('X-User-Token', token);
  }
  return headers;
};

const baseMobilePairingQuery = fetchBaseQuery({
  baseUrl: '',
  prepareHeaders,
});

const dynamicBaseQuery = async (args, api, extraOptions) => {
  // Modify the URL to include the dynamic base URL
  const urlWithBase = `${currentBaseUrl}${args.url}`;
  const modifiedArgs = { ...args, url: urlWithBase };

  // Call the original query with modified URL
  return baseMobilePairingQuery(modifiedArgs, api, extraOptions);
};

const mobilePairingService = createApi({
  reducerPath: 'mobilePairing',
  tagTypes: [],
  baseQuery: dynamicBaseQuery,
  endpoints: (build) => ({
    getQrCode: build.query({
      query: ({ endpoint }) => ({
        method: 'GET',
        url: endpoint || '/api/v1/proctoring/plugins/dual_camera/qr_code',
      }),
    }),
    getPollingData: build.query({
      query: ({ endpoint }) => ({
        method: 'GET',
        url: endpoint || '/api/v1/proctoring/events',
      }),
    }),
    validateImagePosition: build.mutation({
      query: ({ imageFile }) => {
        const formData = new FormData();
        if (imageFile) {
          formData.append('image', imageFile);
        }

        return {
          url: '/api/rt/orientation-check',
          method: 'POST',
          body: formData,
        };
      },
    }),
    sendProctorEvent: build.mutation({
      query: ({
        eventType,
        eventName,
        endpoint,
        extraData = {},
      }) => ({
        url: endpoint || '/api/v1/proctoring/events',
        method: 'POST',
        body: {
          events: [{
            type: eventType,
            name: eventName,
            data: extraData,
          }],
        },
      }),
    }),
  }),
});

export const {
  useGetQrCodeQuery,
  useGetPollingDataQuery,
  util: mobilePairingEvent,
  useSendProctorEventMutation,
  useValidateImagePositionMutation,
} = mobilePairingService;

export default mobilePairingService;
