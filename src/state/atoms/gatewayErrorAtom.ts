import { atom } from 'jotai';
import { ThreeScaleError } from '../../utils/responseInterceptors';

export const gatewayErrorAtom = atom<ThreeScaleError | undefined>(undefined);

export const clearGatewayErrorAtom = atom(null, (_get, set) => {
  set(gatewayErrorAtom, undefined);
});
