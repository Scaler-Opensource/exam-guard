import {
  createApi, fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';

const prepareHeaders = (headers, { getState }) => {
  const { token } = getState().assessmentInfo;
  if (token) {
    headers.set('X-User-Token', token);
  }
  return headers;
};

const baseMobilePairingQuery = fetchBaseQuery({
  baseUrl: window.location.origin,
  prepareHeaders,
});

const mobilePairingService = createApi({
  reducerPath: 'mobilePairing',
  tagTypes: [],
  baseQuery: baseMobilePairingQuery,
  endpoints: (build) => ({
    getQrCode: build.query({
      query: ({ endpoint }) => ({
        method: 'GET',
        url: endpoint || 'api/v1/proctoring/plugins/dual_camera/qr_code',
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
        url: endpoint || 'api/v1/proctoring/events',
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
