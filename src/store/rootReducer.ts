import { combineReducers } from '@reduxjs/toolkit';
import assessmentInfoReducer from '@/store/features/assessmentInfoSlice';
import workflowReducer from '@/store/features/workflowSlice';
import mobilePairingService from '@/services/mobilePairingService';

export const rootReducer = combineReducers({
  assessmentInfo: assessmentInfoReducer,
  workflow: workflowReducer,
  [mobilePairingService.reducerPath]: mobilePairingService.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
