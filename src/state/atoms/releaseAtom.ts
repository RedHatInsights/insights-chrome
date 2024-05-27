import { atomWithToggle } from './utils';

import { isBeta } from '../../utils/common';

export const isPreviewAtom = atomWithToggle(isBeta());
