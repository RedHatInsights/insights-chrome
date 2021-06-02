import isEqual from 'lodash/isEqual';

export const globalNavComparator = (a, b) =>
  isEqual(
    a?.map(({ id, active }) => ({ id, active })),
    b?.map(({ id, active }) => ({ id, active }))
  );

export const activeSectionComparator = (a, b) => a?.id === b?.id;
