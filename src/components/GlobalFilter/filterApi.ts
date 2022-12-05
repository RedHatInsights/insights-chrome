import { NavigateFunction } from 'react-router-dom';
import { FlagTagsFilter, GroupItem } from '../../@types/types';
import { flatTags } from './globalFilterApi';

export const storeFilter = (tags: FlagTagsFilter, isEnabled: boolean, navigate: NavigateFunction) => {
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
    setTimeout(() => {
      // needs to be in timeout to not override existing URLs caused by nested routers
      // FIXME: After router v6 migration can be removed and we can use router location instead of document location
      navigate({
        pathname: location.pathname.replace(/^\/beta\//, ''),
        search: location.search,
        hash: searchParams.toString(),
      });
    });
  }
};
