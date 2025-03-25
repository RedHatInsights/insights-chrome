import { ChromeUser } from '@redhat-cloud-services/types';
import { useEffect } from 'react';
import { DeepRequired } from 'utility-types';

import { getPendoConf } from '../analytics';
import { useAtomValue } from 'jotai';
import { isPreviewAtom } from '../state/atoms/releaseAtom';

const useHandlePendoScopeUpdate = (user: ChromeUser, scope?: string) => {
  const isPreview = useAtomValue(isPreviewAtom);
  useEffect(() => {
    if (window.pendo) {
      try {
        window.pendo.updateOptions(getPendoConf(user as DeepRequired<ChromeUser>, isPreview));
      } catch (error) {
        console.error('Unable to update pendo options');
        console.error(error);
      }
    }
  }, [scope]);
};

export default useHandlePendoScopeUpdate;
