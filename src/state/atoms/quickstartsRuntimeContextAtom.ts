import { atom } from 'jotai';
import { HelpTopicContextValues, QuickStartContextValues } from '@patternfly/quickstarts';

export type QuickstartsRuntimeContext = {
  quickStart: QuickStartContextValues;
  helpTopic: HelpTopicContextValues;
};

/**
 * Context values read from inside the learning-resources runtime providers.
 * The console tree is portalled next to (not under) those providers, so it gets
 * these values re-provided from here. `null` while the runtime is not mounted.
 */
export const quickstartsRuntimeContextAtom = atom<QuickstartsRuntimeContext | null>(null);
