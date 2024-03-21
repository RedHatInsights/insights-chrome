import { atom } from 'jotai';
import { chromeModulesAtom } from './chromeModuleAtom';

export const activeModuleAtom = atom<string | undefined>(undefined);
export const activeModuleDefinitionReadAtom = atom((get) => {
  const activeModuleId = get(activeModuleAtom);
  const chromeModules = get(chromeModulesAtom);
  return activeModuleId ? chromeModules?.[activeModuleId] : undefined;
});
