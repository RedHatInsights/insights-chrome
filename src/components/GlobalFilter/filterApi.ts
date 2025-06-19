import { NavigateFunction } from 'react-router-dom';
import { FlagTagsFilter, GroupItem } from '../../@types/types';
import { flatTags } from './globalFilterApi';

export const storeFilter = (tags: FlagTagsFilter, isEnabled: boolean, navigate: NavigateFunction) => {
  console.log('storeFilter: called with tags:', tags, 'isEnabled:', isEnabled);
  if (isEnabled) {
    const searchParams = new URLSearchParams();
    const [, SIDs, mappedTags] = flatTags(tags, false, true);
    console.log('storeFilter: flatTags result - SIDs:', SIDs, 'mappedTags:', mappedTags);

    if (tags?.Workloads) {
      const currWorkloads = Object.entries(tags?.Workloads || {})?.find(([, workload]) => (workload as GroupItem).isSelected)?.[0];
      if (currWorkloads) {
        console.log('storeFilter: adding workloads:', currWorkloads);
        searchParams.append('workloads', currWorkloads);
      }
    }

    if (SIDs && SIDs.length > 0) {
      console.log('storeFilter: adding SIDs:', SIDs);
      searchParams.append('SIDs', SIDs.join(','));
    }

    if (mappedTags && mappedTags.length > 0) {
      console.log('storeFilter: adding tags:', mappedTags);
      searchParams.append('tags', mappedTags.join(','));
    }

    const finalUrl = {
      pathname: location.pathname.replace(/^(\/beta\/|\/preview\/)/, ''),
      search: location.search,
      hash: searchParams.toString(),
    };
    console.log('storeFilter: navigating to:', finalUrl);

    setTimeout(() => {
      // needs to be in timeout to not override existing URLs caused by nested routers
      // FIXME: After router v6 migration can be removed and we can use router location instead of document location
      navigate(finalUrl);
    });
  }
};
