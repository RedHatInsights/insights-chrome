import { QuickStart } from '@patternfly/quickstarts';

const validateQuickstart = (key: string, qs: QuickStart) => {
  if (typeof key !== 'string') {
    throw new Error('"key" must be type of string.');
  } else if (typeof qs?.metadata?.name !== 'string') {
    throw new Error('"qs.metadata.name" must be type of string.');
  } else if (Array.isArray(qs?.spec?.tasks)) {
    throw new Error('qs.metadata.task must be array.');
  } else {
    return true;
  }
};

export default validateQuickstart;
