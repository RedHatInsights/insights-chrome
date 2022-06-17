import { Location } from 'history';
import { NavigateFunction } from 'react-router-dom';
import { FlagTagsFilter, GroupItem, flatTags } from './globalFilterApi';

export const storeFilter = (tags: FlagTagsFilter, isEnabled: boolean, navigate: NavigateFunction, location: Location) => {
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
    navigate({
      ...location,
      hash: searchParams.toString(),
    });
  }
};
