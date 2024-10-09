import { atomWithReducer } from 'jotai/utils';
import { globalFilterDefaultState } from '../reducers/globalFilterReducers';

const countReducer = (prev, action) => {
  if (action.type === 'inc') return prev + 1;
  if (action.type === 'dec') return prev - 1;
  throw new Error('unknown action type');
}

const countReducerAtom = atomWithReducer(globalFilterDefaultState, globalFilterReducer);
