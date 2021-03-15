import isEqual from 'lodash/isEqual';

export const globalNavComparator = (a, b) =>
  isEqual(
    a?.map(({ id }) => id),
    b?.map(({ id }) => id)
  );

export const activeSectionComparator = (a, b) => a.id === b.id;
