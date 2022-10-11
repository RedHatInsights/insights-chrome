import { Group } from '@redhat-cloud-services/frontend-components/ConditionalFilter';
import { History } from 'history';
import { FlagTagsFilter, flatTags } from './constants';

export const storeFilter = (tags: FlagTagsFilter, isEnabled: boolean, history: History) => {
  if (isEnabled) {
    const searchParams = new URLSearchParams();
    const [, SIDs, mappedTags] = flatTags(tags, false, true);
    if (tags?.Workloads) {
      const currWorkloads = Object.entries(tags?.Workloads || {})?.find(([, workload]) => (workload as Group).isSelected)?.[0];
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
