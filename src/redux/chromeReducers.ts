import { ChromeUser } from '@redhat-cloud-services/types';
import { ITLess } from '../utils/common';
import { ChromeState } from './store';

export function loginReducer(state: ChromeState, { payload }: { payload: ChromeUser }): ChromeState {
  const missingIDP = ITLess() && !Object.prototype.hasOwnProperty.call(payload?.identity, 'idp');
  return {
    ...state,
    missingIDP,
  };
}

export function onPageAction(state: ChromeState, { payload }: { payload: string }): ChromeState {
  return {
    ...state,
    pageAction: payload,
  };
}

export function onPageObjectId(state: ChromeState, { payload }: { payload: string }): ChromeState {
  return {
    ...state,
    pageObjectId: payload,
  };
}
