export const isAnsible = (sections: string[]) => (sections.includes('ansible') && sections.includes('insights') ? 1 : 0);

export function getUrl(type?: string) {
  if (['/', '/beta', '/beta/', '/preview', '/preview/'].includes(window.location.pathname)) {
    return 'landing';
  }

  const sections = window.location.pathname.split('/');
  if (['beta', 'preview'].includes(sections[1])) {
    return type === 'bundle' ? sections[2] : sections[3 + isAnsible(sections)];
  }

  return type === 'bundle' ? sections[1] : sections[2 + isAnsible(sections)];
}

export const bundleMapping: {
  [bundleId: string]: string;
} = {
  'application-services': 'Application and Data Services',
  openshift: 'OpenShift',
  ansible: 'Ansible Automation Platform',
  insights: 'Red Hat Insights',
  edge: 'Edge management',
  settings: 'Settings',
  landing: 'Home',
  allservices: 'Home',
  iam: 'Identity & Access Management',
  internal: 'Internal',
  quay: 'Quay.io',
};

const useBundle = () => {
  const bundleId = getUrl('bundle');
  return { bundleId, bundleTitle: bundleMapping[bundleId] || bundleId };
};

export default useBundle;
