import { History } from 'history';
import { FlagTagsFilter, GroupItem, flatTags } from './globalFilterApi';

export const storeFilter = (tags: FlagTagsFilter, isEnabled: boolean, history: History) => {
  if (isEnabled) {
    const searchParams = new URLSearchParams();
    const [, SIDs, mappedTags] = flatTags(tags, false, true);
    if (tags?.Workloads) {
      const currWorkloads = Object.entries(tags?.Workloads || {})?.find(([, workload]) => (workload as GroupItem).isSelected)?.[0];
      if (currWorkloads) {
        searchParams.append('workloads', currWorkloads);
      }
    }
    searchParams.append('SIDs', SIDs);
    searchParams.append('tags', mappedTags);

    history.push({
      ...history.location,
      hash: searchParams.toString(),
    });
  }
};
