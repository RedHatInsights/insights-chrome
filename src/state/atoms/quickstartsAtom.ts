import { QuickStart } from '@patternfly/quickstarts';
import { atom } from 'jotai';
import { atomWithToggle } from './utils';

export const quickstartsDisabledAtom = atomWithToggle(false);
export const quickstartsAtom = atom<{ [key: string]: QuickStart[] }>({});

export const populateQuickstartsAppAtom = atom(null, (_get, set, { app, quickstarts }: { app: string; quickstarts: QuickStart[] }) => {
  set(quickstartsAtom, (prev) => ({
    ...prev,
    [app]: quickstarts,
  }));
});

export const addQuickstartToAppAtom = atom(null, (_get, set, { app, quickstart }: { app: string; quickstart: QuickStart }) => {
  set(quickstartsAtom, (prev) => ({
    ...prev,
    [app]: [...(prev?.[app] ?? []), quickstart],
  }));
});

export const clearQuickstartsAtom = atom(null, (_get, set, activeQuickstart?: string) => {
  set(quickstartsAtom, (prev) => {
    // keep currently opened quickstart
    return Object.entries(prev).reduce<{ [key: string]: QuickStart[] }>((acc, [namespace, quickstarts]) => {
      const clearedQuickstarts = quickstarts.filter((qs) => {
        return qs?.metadata?.name === activeQuickstart;
      });
      if (clearedQuickstarts.length > 0) {
        acc[namespace] = clearedQuickstarts;
      }
      return acc;
    }, {});
  });
});
