import { atomWithReducer } from 'jotai/utils';
import { globalFilterDefaultState } from '../reducers/globalFilterReducers';
import { globalFilterDict } from '../reducers/index';
import { GlobalFilterState } from '../../@types/types';

type GlobalFilterActionType = keyof typeof globalFilterDict;

const globalFilterReducer = (prev: GlobalFilterState, action: { type: GlobalFilterActionType; [key: string]: any }): GlobalFilterState => {
  // check action var type
  if (action === null || typeof action !== 'object' || typeof action.type !== 'string') {
    throw new Error('action is improperly formatted');
  }
  if (globalFilterDict[action.type]) {
    return globalFilterDict[action.type](prev, action);
  }
  throw new Error('unknown action type');
};

export const globalFilterReducerAtom = atomWithReducer(globalFilterDefaultState, globalFilterReducer);
