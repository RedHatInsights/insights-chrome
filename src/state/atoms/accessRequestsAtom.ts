import { atom } from 'jotai';
import { REQUESTS_COUNT, REQUESTS_DATA } from '../../utils/consts';

export type AccessRequest = { request_id: string | number; created: string; seen: boolean };

export const accessReqeustsCountAtom = atom(0);
export const hasUnseenAccessRequestsAtom = atom(false);
export const accessRequestsDataAtom = atom<AccessRequest[]>([]);

export const setAccessRequestsDataAtom = atom(null, (get, set, { count, data }: { count: number; data: AccessRequest[] }) => {
  const accessRequestData = get(accessRequestsDataAtom);
  const newData = data.map(({ request_id, created, seen }) => ({
    request_id,
    created,
    seen: seen === true || !!accessRequestData.find((item) => request_id === item.request_id)?.seen || false,
  }));
  localStorage.setItem(REQUESTS_COUNT, newData.length.toString());
  localStorage.setItem(REQUESTS_DATA, JSON.stringify(newData));

  set(accessReqeustsCountAtom, count);
  set(hasUnseenAccessRequestsAtom, newData.length > 0);
  set(accessRequestsDataAtom, newData);
});

export const markAccessRequestsRequestAtom = atom(null, (get, set, payload: string | number) => {
  const accessRequestData = get(accessRequestsDataAtom);

  const newData = accessRequestData.map((item) => (item.request_id === payload ? { ...item, seen: true } : item));
  localStorage.setItem(REQUESTS_DATA, JSON.stringify(newData));
  set(hasUnseenAccessRequestsAtom, newData.length > 0);
  set(accessRequestsDataAtom, newData);
});
