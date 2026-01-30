import { atom } from 'jotai';
import { ChromeUserConfig } from '../../utils/initUserConfig';

export const userConfigAtom = atom<ChromeUserConfig>({
  data: {
    uiPreviewSeen: false,
    uiPreview: false,
  },
});
