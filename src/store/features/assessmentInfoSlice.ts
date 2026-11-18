import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AssessmentInfoState } from '@/types/common';

const initialState: AssessmentInfoState = {
  userName: '',
  assessmentName: '',
  logoUrl: null,
  screenShareMockUrl: null,
  proctor: null,
  token: null,
  identity: null,
};

export const fetchToken = createAsyncThunk(
  'assessmentInfo/fetchToken',
  async ({ baseUrl, payload }: { baseUrl: string, payload: any }) => {
    const response = await fetch(`${baseUrl}/api/v3/proctoring/dual_camera/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    const token = data?.token;
    (window as any).PROCTORING_SESSION_TOKEN = token;
    return { token, identity: data?.identity ?? null };
  }
);

const assessmentInfoSlice = createSlice({
  name: 'assessmentInfo',
  initialState,
  reducers: {
    setAssessmentInfo: (state, action) => {
      return {
        ...state,
        userName: action.payload.userName,
        assessmentName: action.payload.assessmentName,
        logoUrl: action.payload.logoUrl ?? null,
        screenShareMockUrl: action.payload.screenShareMockUrl ?? null,
      };
    },
    setProctor: (state, action) => {
      return {
        ...state,
        proctor: action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchToken.fulfilled, (state, action) => {
      state.token = action.payload.token;
      state.identity = action.payload.identity;
    });
  },
});

export const { setAssessmentInfo, setProctor } = assessmentInfoSlice.actions;

export default assessmentInfoSlice.reducer;

export const selectProctor = (state: { assessmentInfo: AssessmentInfoState }) =>
  state.assessmentInfo.proctor;

export const selectScreenShareMockUrl = (state: { assessmentInfo: AssessmentInfoState }) =>
  state.assessmentInfo.screenShareMockUrl;
