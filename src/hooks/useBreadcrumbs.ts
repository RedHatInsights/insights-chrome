import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { activeModuleAtom } from '../state/atoms/activeModuleAtom';

export interface BreadcrumbData {
  pathname: string;
  title: string;
}

interface BreadcrumbsState {
  applications: BreadcrumbData[];
}

const useBreadcrumbs = () => {
  const activeModule = useAtomValue(activeModuleAtom);
  const previousActiveModule = useRef<string | undefined>(activeModule);

  const [breadcrumbsState, setBreadcrumbsState] = useState<BreadcrumbsState>({
    applications: [],
  });

  useEffect(() => {
    if (previousActiveModule.current !== activeModule) {
      setBreadcrumbsState((prev) => ({
        ...prev,
        applications: [],
      }));
      previousActiveModule.current = activeModule;
    }
  }, [activeModule]);

  const setApplicationData = (data: BreadcrumbData | BreadcrumbData[]) => {
    setBreadcrumbsState((prev) => {
      const newApplications = [...prev.applications];

      if (Array.isArray(data)) {
        data.forEach(({ pathname, title }) => {
          const existingIndex = newApplications.findIndex((b) => b.pathname === pathname);
          if (existingIndex >= 0) {
            newApplications[existingIndex] = { pathname, title };
          } else {
            newApplications.push({ pathname, title });
          }
        });
      } else {
        const existingIndex = newApplications.findIndex((b) => b.pathname === data.pathname);
        if (existingIndex >= 0) {
          newApplications[existingIndex] = data;
        } else {
          newApplications.push(data);
        }
      }

      return { ...prev, applications: newApplications };
    });
  };

  const clearApplicationData = () => {
    setBreadcrumbsState((prev) => ({
      ...prev,
      applications: [],
    }));
  };

  return {
    applicationData: breadcrumbsState.applications,
    setApplicationData,
    clearApplicationData,
  };
};

export default useBreadcrumbs;
