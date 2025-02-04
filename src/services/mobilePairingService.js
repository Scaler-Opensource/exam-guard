import {
  createApi, fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';

const baseMobilePairingQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:3000',
});

const validateImagePositionQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:8080',
});

const mobilePairingService = createApi({
  reducerPath: 'mobilePairing',
  tagTypes: [],
  baseQuery: baseMobilePairingQuery,
  endpoints: (build) => ({
    getQrCode: build.query({
      query: ({ endpoint, payload }) => ({
        method: 'GET',
        url: endpoint || 'api/v3/proctoring/dual_camera/qr_code',
        params: {
          ...payload,
        },
      }),
    }),
    getPollingData: build.query({
      query: ({ endpoint, payload }) => ({
        method: 'GET',
        url: endpoint || 'api/v3/proctoring/dual_camera/poll',
        params: {
          ...payload,
        },
      }),
    }),
    validateImagePosition: build.mutation({
      queryFn: async (arg, queryApi, extraOptions) => {
        const {
          imageFile,
          headers = {
            'X-User-Token': 'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjb21wYW5pb246djEiLCJleHAiOjE3Mzg5MjA1MDIsImlkIjoyLCJ0eXBlIjoiVGVzdFNlc3Npb24ifQ.z17mIu9Fegf27lDB7Oix0-s7QymKuEPaUo754z9IsrE',
          },
        } = arg;

        const formData = new FormData();
        if (imageFile) {
          formData.append('image', imageFile);
        }

        return validateImagePositionQuery(
          {
            url: '/api/rt/orientation-check',
            method: 'POST',
            body: formData,
            headers: {
              ...headers,
            },
          },
          queryApi,
          extraOptions,
        );
      },
    }),
    sendProctorEvent: build.mutation({
      query: ({
        eventType,
        eventName,
        endpoint,
        payload,
        extraData = {},
      }) => ({
        url: endpoint || 'api/v3/proctoring/dual_camera/events',
        method: 'POST',
        params: {
          ...payload,
        },
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
