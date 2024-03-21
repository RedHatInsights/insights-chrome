import { atom } from 'jotai';
import { ChromeModule, RouteDefinition } from '../../@types/types';
import { generateRoutesList } from '../../utils/common';

export const chromeModulesAtom = atom<{ [moduleName: string]: ChromeModule }>({});
export const moduleRoutesAtom = atom<RouteDefinition[]>([]);

export type RegisterModulePayload = {
  module: string;
  manifestLocation?: string;
  manifest?: string;
};

export const onRegisterModuleWriteAtom = atom(null, (get, set, payload: RegisterModulePayload) => {
  const modules = get(chromeModulesAtom);
  const isModuleLoaded = modules?.[payload.module];
  if (!isModuleLoaded && typeof payload.manifestLocation === 'string') {
    set(chromeModulesAtom, {
      ...modules,
      [payload.module]: {
        manifestLocation: payload.manifestLocation,
      },
    });
  }
});

export const loadModulesSchemaWriteAtom = atom(null, (get, set, schema: { [key: string]: ChromeModule }) => {
  const moduleRoutes = generateRoutesList(schema);
  set(moduleRoutesAtom, moduleRoutes);
  set(chromeModulesAtom, schema);
});
