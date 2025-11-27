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
};

const useBundle = () => {
  const bundleId = getUrl('bundle');
  return { bundleId, bundleTitle: bundleMapping[bundleId] || bundleId };
};

export default useBundle;
