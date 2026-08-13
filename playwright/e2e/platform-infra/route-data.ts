export interface RedirectRoute {
  oldPath: string;
  newPath: string;
}

export interface ReachabilityRoute {
  path: string;
  description: string;
}

export interface EnvironmentConfig {
  baseUrl: string;
  proxy?: string;
  redirects: RedirectRoute[];
  reachabilityRoutes: ReachabilityRoute[];
}

// Migrated from iqe-platform-ui-plugin conf/platform_ui.default.yaml
// Some routes may be stale -- run tests and prune failures
const stageRedirects: RedirectRoute[] = [
  { oldPath: '/cost-management/cost-models', newPath: '/openshift/cost-management/cost-models' },
  { oldPath: '/cost-management/infrastructure/gcp', newPath: '/openshift/cost-management/gcp' },
  { oldPath: '/cost-management/infrastructure/azure', newPath: '/openshift/cost-management/azure' },
  { oldPath: '/cost-management/infrastructure/aws', newPath: '/openshift/cost-management/aws' },
  { oldPath: '/cost-management/ocp', newPath: '/openshift/cost-management/ocp' },
  { oldPath: '/cost-management', newPath: '/openshift/cost-management' },
  { oldPath: '/ansible/automation-analytics', newPath: '/ansible/automation-analytics' },
  { oldPath: '/ansible/automation-analytics/automation-calculator', newPath: '/ansible/automation-analytics/automation-calculator' },
  { oldPath: '/ansible/automation-analytics/organization-statistics', newPath: '/ansible/automation-analytics/organization-statistics' },
  { oldPath: '/ansible/automation-analytics/job-explorer', newPath: '/ansible/automation-analytics/job-explorer' },
  { oldPath: '/ansible/automation-analytics/clusters', newPath: '/ansible/automation-analytics/clusters' },
  { oldPath: '/ansible/automation-analytics/notifications', newPath: '/ansible/automation-analytics/notifications' },
  { oldPath: '/preview/settings/sources', newPath: '/settings/integrations' },
  { oldPath: '/preview/openshift/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/preview/application-services/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/preview/business-services/hybrid-committed-spend', newPath: '/subscriptions/hybrid-committed-spend' },
  { oldPath: '/preview/insights/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/preview/insights/subscriptions/inventory', newPath: '/subscriptions/inventory' },
  { oldPath: '/preview/insights/subscriptions/manifests', newPath: '/subscriptions/manifests' },
  { oldPath: '/openshift/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/application-services/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/business-services/hybrid-committed-spend', newPath: '/subscriptions/hybrid-committed-spend' },
  { oldPath: '/insights/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/insights/subscriptions/inventory', newPath: '/subscriptions/inventory' },
  { oldPath: '/insights/subscriptions/manifests', newPath: '/subscriptions/manifests' },
  { oldPath: '/application-services/service-accounts', newPath: '/iam/service-accounts' },
];

const prodRedirects: RedirectRoute[] = [
  { oldPath: '/cost-management/cost-models', newPath: '/openshift/cost-management/cost-models' },
  { oldPath: '/cost-management/infrastructure/gcp', newPath: '/openshift/cost-management/gcp' },
  { oldPath: '/cost-management/infrastructure/azure', newPath: '/openshift/cost-management/azure' },
  { oldPath: '/cost-management/infrastructure/aws', newPath: '/openshift/cost-management/aws' },
  { oldPath: '/cost-management/ocp', newPath: '/openshift/cost-management/ocp' },
  { oldPath: '/cost-management', newPath: '/openshift/cost-management' },
  { oldPath: '/ansible/automation-analytics', newPath: '/ansible/automation-analytics' },
  { oldPath: '/ansible/automation-analytics/automation-calculator', newPath: '/ansible/automation-analytics/automation-calculator' },
  { oldPath: '/ansible/automation-analytics/organization-statistics', newPath: '/ansible/automation-analytics/organization-statistics' },
  { oldPath: '/ansible/automation-analytics/job-explorer', newPath: '/ansible/automation-analytics/job-explorer' },
  { oldPath: '/ansible/automation-analytics/clusters', newPath: '/ansible/automation-analytics/clusters' },
  { oldPath: '/ansible/automation-analytics/notifications', newPath: '/ansible/automation-analytics/notifications' },
  { oldPath: '/preview/settings/sources', newPath: '/settings/integrations' },
  { oldPath: '/preview/openshift/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/preview/application-services/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/preview/business-services/hybrid-committed-spend', newPath: '/subscriptions/hybrid-committed-spend' },
  { oldPath: '/preview/insights/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/preview/insights/subscriptions/inventory', newPath: '/subscriptions/inventory' },
  { oldPath: '/preview/insights/subscriptions/manifests', newPath: '/subscriptions/manifests' },
  { oldPath: '/openshift/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/application-services/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/business-services/hybrid-committed-spend', newPath: '/subscriptions/hybrid-committed-spend' },
  { oldPath: '/insights/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/insights/subscriptions/inventory', newPath: '/subscriptions/inventory' },
  { oldPath: '/insights/subscriptions/manifests', newPath: '/subscriptions/manifests' },
  { oldPath: '/application-services/service-accounts', newPath: '/iam/service-accounts' },
];

const stageReachabilityRoutes: ReachabilityRoute[] = [
  { path: '/insights/dashboard', description: 'Insights Dashboard' },
  { path: '/insights/advisor/recommendations', description: 'Advisor Recommendations' },
  { path: '/insights/vulnerability/cves', description: 'Vulnerability CVEs' },
  { path: '/insights/patch/advisories', description: 'Patch Advisories' },
  { path: '/insights/inventory', description: 'Inventory' },
  { path: '/openshift', description: 'OpenShift Overview' },
  { path: '/openshift/cost-management', description: 'Cost Management' },
  { path: '/ansible/automation-analytics', description: 'Automation Analytics' },
  { path: '/settings/integrations', description: 'Integrations' },
  { path: '/settings/notifications', description: 'Notifications' },
  { path: '/iam/user-access/roles', description: 'User Access Roles' },
  { path: '/iam/service-accounts', description: 'Service Accounts' },
  { path: '/subscriptions/usage', description: 'Subscriptions Usage' },
];

const prodReachabilityRoutes: ReachabilityRoute[] = [
  { path: '/insights/dashboard', description: 'Insights Dashboard' },
  { path: '/insights/advisor/recommendations', description: 'Advisor Recommendations' },
  { path: '/insights/vulnerability/cves', description: 'Vulnerability CVEs' },
  { path: '/insights/patch/advisories', description: 'Patch Advisories' },
  { path: '/insights/inventory', description: 'Inventory' },
  { path: '/openshift', description: 'OpenShift Overview' },
  { path: '/openshift/cost-management', description: 'Cost Management' },
  { path: '/ansible/automation-analytics', description: 'Automation Analytics' },
  { path: '/settings/integrations', description: 'Integrations' },
  { path: '/settings/notifications', description: 'Notifications' },
  { path: '/iam/user-access/roles', description: 'User Access Roles' },
  { path: '/iam/service-accounts', description: 'Service Accounts' },
  { path: '/subscriptions/usage', description: 'Subscriptions Usage' },
];

const STAGE_PROXY = 'http://squid.corp.redhat.com:3128';

const configs: Record<string, EnvironmentConfig> = {
  stage: {
    baseUrl: 'https://console.stage.redhat.com',
    proxy: STAGE_PROXY,
    redirects: stageRedirects,
    reachabilityRoutes: stageReachabilityRoutes,
  },
  prod: {
    baseUrl: 'https://console.redhat.com',
    redirects: prodRedirects,
    reachabilityRoutes: prodReachabilityRoutes,
  },
};

export function getConfig(env?: string): EnvironmentConfig {
  const environment = env || process.env.PLATFORM_INFRA_ENV || 'stage';
  const config = configs[environment];
  if (!config) {
    throw new Error(`Unknown environment: ${environment}. Expected 'stage' or 'prod'.`);
  }
  return config;
}
