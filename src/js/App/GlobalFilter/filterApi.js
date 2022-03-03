import { GLOBAL_FILTER_KEY } from '../../jwt/jwt';
import { spinUpStore } from '../../redux-config';
import { storeInitialHash } from '../../redux/actions';
import { deleteLocalStorageItems } from '../../utils';
import { flatTags } from './constants';

export const storeFilter = (tags, token, isEnabled, history, firstLoad) => {
  deleteLocalStorageItems(Object.keys(localStorage).filter((key) => key.startsWith(GLOBAL_FILTER_KEY)));
  if (isEnabled) {
    const searchParams = new URLSearchParams();
    const [, SIDs, mappedTags] = flatTags(tags, false, true);
    if (tags?.Workloads) {
      const currWorkloads = Object.entries(tags?.Workloads || {})?.find(([, { isSelected }]) => isSelected)?.[0];
      if (currWorkloads) {
        searchParams.append('workloads', currWorkloads);
      }
    }
    searchParams.append('SIDs', SIDs);
    searchParams.append('tags', mappedTags);

    if (firstLoad && window.location.hash.length > 0) {
      const { store } = spinUpStore();
      store.dispatch(storeInitialHash(window.location.hash));
    }
    history.push({
      ...history.location,
      hash: searchParams.toString(),
    });
  }

  localStorage.setItem(
    `${GLOBAL_FILTER_KEY}/${token}`,
    JSON.stringify(
      Object.entries(tags).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: {
            ...Object.entries(value || {}).reduce(
              (
                currValue,
                // eslint-disable-next-line no-unused-vars
                [itemKey, { item, value: tagValue, group: { items, ...group } = {}, ...rest }]
              ) => ({
                ...currValue,
                [itemKey]: {
                  ...rest,
                  item: { tagValue: item?.tagValue || tagValue, tagKey: item?.tagKey || itemKey },
                  group,
                },
              }),
              {}
            ),
          },
        }),
        {}
      )
    )
  );
};
