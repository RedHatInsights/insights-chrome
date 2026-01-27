import { useCallback, useMemo, useState } from 'react';
import { AllQuickStartStates, ScopedControllerOptions, ScopedQuickStartController } from '../../@types/types';

/**
 * Hook for creating a scoped QuickStart controller with isolated state.
 * Use this when you need to render QuickStarts outside Chrome's managed drawer,
 * such as in a HelpPanel tab or custom UI component.
 *
 * @param options - Configuration options for the scoped controller
 * @returns A ScopedQuickStartController with isolated state management
 *
 * @example
 * ```tsx
 * const controller = useScopedQuickStart({ quickStarts: myQuickStarts });
 *
 * // Activate a specific QuickStart
 * controller.setActiveQuickStartID('my-quickstart-name');
 *
 * // Render the QuickStart content in your custom UI
 * if (controller.activeQuickStart) {
 *   return <QuickStartPanelContent quickStart={controller.activeQuickStart} ... />;
 * }
 * ```
 */
const useScopedQuickStart = (options: ScopedControllerOptions = {}): ScopedQuickStartController => {
  const { quickStarts = [] } = options;

  const [activeQuickStartID, setActiveQuickStartIDInternal] = useState<string>('');
  const [allQuickStartStates, setAllQuickStartStates] = useState<AllQuickStartStates>({});

  const setActiveQuickStartID = useCallback((id: string) => {
    setActiveQuickStartIDInternal(id);
  }, []);

  const activeQuickStart = useMemo(() => {
    if (!activeQuickStartID) {
      return null;
    }
    return quickStarts.find((qs) => qs.metadata.name === activeQuickStartID) || null;
  }, [activeQuickStartID, quickStarts]);

  const restartQuickStart = useCallback(() => {
    if (!activeQuickStartID) {
      return;
    }

    setAllQuickStartStates((prevStates) => ({
      ...prevStates,
      [activeQuickStartID]: {
        ...(prevStates[activeQuickStartID] || {}),
        taskNumber: 0,
        status: 'In Progress',
      } as AllQuickStartStates[string],
    }));
  }, [activeQuickStartID]);

  const controller: ScopedQuickStartController = useMemo(
    () => ({
      activeQuickStart,
      activeQuickStartID,
      allQuickStartStates,
      setActiveQuickStartID,
      setAllQuickStartStates,
      restartQuickStart,
    }),
    [activeQuickStart, activeQuickStartID, allQuickStartStates, setActiveQuickStartID, restartQuickStart]
  );

  return controller;
};

export default useScopedQuickStart;
