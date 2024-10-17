// src/hooks/useGlobalFilterState.ts
import { useAtomValue } from 'jotai';
import { globalFilterReducerAtom } from '../state/atoms/globalFilterAtom';

const useGlobalFilterState = () => {
  const globalFilterState = useAtomValue(globalFilterReducerAtom);

  const { tags, sid, workloads } = globalFilterState;
  const count = (tags.count || 0) + (sid.count || 0) + (workloads.count || 0);
  const total = (tags.total || 0) + (sid.total || 0) + (workloads.total || 0);

  return {
    count,
    total,
    tags: tags.items || [],
    sid: sid.items || [],
    workloads,
    isLoaded: tags.isLoaded && sid.isLoaded && workloads.isLoaded,
  };
};

export default useGlobalFilterState;
