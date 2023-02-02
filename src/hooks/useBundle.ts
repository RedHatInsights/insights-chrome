import { getUrl } from '../utils/common';

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
};

const useBundle = () => {
  const bundleId = getUrl('bundle');
  return { bundleId, bundleTitle: bundleMapping[bundleId] || bundleId };
};

export default useBundle;
