import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { matchPath, useLocation } from 'react-router-dom';
import { chromeModulesAtom } from '../state/atoms/chromeModuleAtom';
import { ModuleRoute, SupportCaseConfig } from '../@types/types';
import { activeModuleAtom } from '../state/atoms/activeModuleAtom';

function findRouteSupportCaseData(routes: ModuleRoute[], currentPathname: string): SupportCaseConfig | undefined {
  const sortedModules = routes.sort((a, b) => b.pathname.length - a.pathname.length);
  const matchedRoute = sortedModules.find(({ pathname }) => {
    return matchPath(
      {
        path: pathname,
        end: false,
      },
      currentPathname
    );
  });

  return matchedRoute?.supportCaseData;
}

const useSupportCaseData = (): SupportCaseConfig | undefined => {
  const scope = useAtomValue(activeModuleAtom);
  const location = useLocation();
  const modules = useAtomValue(chromeModulesAtom);
  const moduleConfig = useMemo(() => (scope ? modules[scope] : undefined), [modules, scope]);
  const supportCaseData = useMemo(() => {
    if (!moduleConfig?.modules) {
      return undefined;
    }
    const routeCaseData = findRouteSupportCaseData(
      moduleConfig.modules.flatMap(({ routes }) => routes),
      location.pathname
    );
    return routeCaseData ?? moduleConfig?.config?.supportCaseData;
  }, [moduleConfig, location]);

  return supportCaseData;
};

export default useSupportCaseData;
