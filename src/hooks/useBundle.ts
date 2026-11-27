import { useAtomValue } from 'jotai';
import { feoMessagesAtom } from '../state/atoms/feoLocaleAtom';
import { FeoMessages, localizeBundleTitle } from '../utils/feoLocalization';

export const isAnsible = (sections: string[]) => (sections.includes('ansible') && sections.includes('insights') ? 1 : 0);

export function getUrl(type?: string, pathname = window.location.pathname) {
  if (['/'].includes(pathname)) {
    return 'landing';
  }

  const sections = pathname.split('/');

  return type === 'bundle' ? sections[1] : sections[2 + isAnsible(sections)];
}

export const bundleMapping: {
  [bundleId: string]: string;
} = {
  'application-services': 'Application Services',
  openshift: 'OpenShift',
  ansible: 'Ansible Automation Platform',
  insights: 'RHEL',
  settings: 'Settings',
  landing: 'Home',
  allservices: 'Home',
  iam: 'Identity & Access Management',
  internal: 'Internal',
  quay: 'Quay.io',
  subscriptions: 'Subscription Services',
  docs: 'Documentation',
  'user-preferences': 'User Preferences',
  lightwell: 'Lightwell',
  support: 'Support',
};

/**
 * Bundle id and title for the current URL, localized with the given FEO
 * messages (English without them). Plain function, not a hook: it backs
 * chrome.getBundleData() and chrome.updateDocumentTitle(), which tenant apps
 * call from effects and callbacks outside a render.
 */
export function getBundleData(messages: FeoMessages = {}) {
  const bundleId = getUrl('bundle');
  const bundleTitle = localizeBundleTitle(bundleMapping[bundleId] || bundleId, bundleId, messages);
  return { bundleId, bundleTitle };
}

// Component variant: re-renders when the locale messages change.
const useBundle = () => getBundleData(useAtomValue(feoMessagesAtom));

export default useBundle;
