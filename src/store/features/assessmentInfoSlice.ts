import { createSlice } from '@reduxjs/toolkit';
import { AssessmentInfoState } from '@/types/common';

const initialState: AssessmentInfoState = {
  userName: '',
  assessmentName: '',
  logo: '',
  proctor: null,
};

const assessmentInfoSlice = createSlice({
  name: 'assessmentInfo',
  initialState,
  reducers: {
    setAssessmentInfo: (state, action) => {
      return {
        ...state,
        userName: action.payload.userName,
        assessmentName: action.payload.assessmentName,
        logo: action.payload.logo,
      };
    },
    setProctor: (state, action) => {
      return {
        ...state,
        proctor: action.payload,
      };
    },
  },
});


export const { setAssessmentInfo, setProctor } = assessmentInfoSlice.actions;

export default assessmentInfoSlice.reducer;

export const selectProctor = (state: { assessmentInfo: AssessmentInfoState }) =>
  state.assessmentInfo.proctor;
