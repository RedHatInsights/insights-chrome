import { ScalprumComponentProps } from '@scalprum/react-core';

/**
 * Pure function that computes the next drawer state based on current state and incoming content.
 * Used by both create-chrome.ts (production) and tests to avoid logic duplication.
 */
export function computeDrawerToggle(
  currentContent: ScalprumComponentProps | undefined,
  isOpened: boolean,
  data: ScalprumComponentProps
): { futureOpened: boolean; nextContent: ScalprumComponentProps | undefined } {
  const futureOpened = currentContent?.scope !== data.scope || currentContent?.module !== data.module || !isOpened;
  return {
    futureOpened,
    nextContent: futureOpened ? data : undefined,
  };
}
