export interface RedirectRoute {
  oldPath: string;
  newPath: string;
}

export interface ReachabilityRoute {
  path: string;
  description: string;
}

export interface CrossHostRedirectRoute {
  sourceUrl: string;
  expectedUrl: string;
}

export interface EnvironmentConfig {
  baseUrl: string;
  proxy?: string;
  redirects: RedirectRoute[];
  crossHostRedirects: CrossHostRedirectRoute[];
  reachabilityRoutes: ReachabilityRoute[];
}

// Sourced from Akamai Edge Redirector policy er_console (Policy 185335, Version 55)
// Rules redirecting to external destinations (sandbox.redhat.com, qualtrics,
// developers.redhat.com) are excluded.
const redirects: RedirectRoute[] = [
  // Settings to Insights
  { oldPath: '/settings/connector', newPath: '/insights/connector' },
  { oldPath: '/settings/connector/activation-keys', newPath: '/insights/connector/activation-keys' },
  { oldPath: '/settings/content', newPath: '/insights/content' },

  // Migration assessment to migration advisor
  { oldPath: '/openshift/migration-assessment', newPath: '/openshift/migration-advisor' },

  // Ansible Policies to Ansible Inventory
  { oldPath: '/ansible/policies', newPath: '/ansible/inventory' },

  // Insights Policies to Insights Dashboard
  { oldPath: '/insights/policies', newPath: '/insights/dashboard' },

  // Insights SAP to Dashboard
  { oldPath: '/insights/sap', newPath: '/insights/dashboard#workloads=SAP' },

  // Insights Drift to Dashboard
  { oldPath: '/insights/drift', newPath: '/insights/dashboard' },

  // Application Services ACS to OpenShift ACS
  { oldPath: '/application-services/acs', newPath: '/openshift/acs' },

  // Stonesoup to Application Pipeline
  { oldPath: '/stonesoup', newPath: '/application-pipeline' },

  // Settings Sources to Integrations
  { oldPath: '/settings/sources', newPath: '/settings/integrations' },

  // Subscriptions bundle redirects
  { oldPath: '/business-services/hybrid-committed-spend', newPath: '/subscriptions/hybrid-committed-spend' },
  { oldPath: '/insights/subscriptions/inventory', newPath: '/subscriptions/inventory' },
  { oldPath: '/insights/subscriptions/manifests', newPath: '/subscriptions/manifests' },
  { oldPath: '/subscriptions/rhel-sw', newPath: '/subscriptions/usage/rhel' },
  { oldPath: '/insights/subscriptions/rhel', newPath: '/subscriptions/usage/rhel' },
  { oldPath: '/openshift/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/application-services/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/insights/subscriptions', newPath: '/subscriptions/usage' },

  // Service Accounts
  { oldPath: '/application-services/service-accounts', newPath: '/iam/service-accounts' },

  // RBAC to User Access
  { oldPath: '/settings/rbac', newPath: '/iam/user-access' },

  // Ansible Insights to Automation Analytics
  { oldPath: '/ansible/insights/notifications', newPath: '/ansible/automation-analytics/notifications' },
  { oldPath: '/ansible/insights/clusters', newPath: '/ansible/automation-analytics/clusters' },
  { oldPath: '/ansible/insights/job-explorer', newPath: '/ansible/automation-analytics/job-explorer' },
  { oldPath: '/ansible/insights/organization-statistics', newPath: '/ansible/automation-analytics/organization-statistics' },
  { oldPath: '/ansible/insights/savings-planner', newPath: '/ansible/automation-analytics/savings-planner' },
  { oldPath: '/ansible/insights/reports', newPath: '/ansible/automation-analytics/reports' },
  { oldPath: '/ansible/insights/automation-calculator', newPath: '/ansible/automation-analytics/reports/automation_calculator' },
  { oldPath: '/ansible/insights', newPath: '/ansible/automation-analytics' },

  // Cost Management
  { oldPath: '/cost-management/cost-models', newPath: '/openshift/cost-management/cost-models' },
  { oldPath: '/cost-management/infrastructure/gcp', newPath: '/openshift/cost-management/gcp' },
  { oldPath: '/cost-management/infrastructure/azure', newPath: '/openshift/cost-management/azure' },
  { oldPath: '/cost-management/infrastructure/aws', newPath: '/openshift/cost-management/aws' },
  { oldPath: '/cost-management/ocp', newPath: '/openshift/cost-management/ocp' },
  { oldPath: '/cost-management', newPath: '/openshift/cost-management' },

  // Preview prefix stripping (chained with subsequent redirects)
  { oldPath: '/preview/settings/sources', newPath: '/settings/integrations' },
  { oldPath: '/preview/openshift/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/preview/application-services/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/preview/business-services/hybrid-committed-spend', newPath: '/subscriptions/hybrid-committed-spend' },
  { oldPath: '/preview/insights/subscriptions', newPath: '/subscriptions/usage' },
  { oldPath: '/preview/insights/subscriptions/inventory', newPath: '/subscriptions/inventory' },
  { oldPath: '/preview/insights/subscriptions/manifests', newPath: '/subscriptions/manifests' },
];

// OpenShift Google Cloud cross-host redirects
const crossHostRedirects: Record<string, CrossHostRedirectRoute[]> = {
  stage: [
    { sourceUrl: 'https://openshift.googlecloud.stage.redhat.com/overview', expectedUrl: 'https://console.stage.redhat.com/openshift/overview' },
    { sourceUrl: 'https://openshift.googlecloud.stage.redhat.com/osd/create', expectedUrl: 'https://console.stage.redhat.com/openshift/create/osdgcp' },
    { sourceUrl: 'https://openshift.googlecloud.stage.redhat.com/osd', expectedUrl: 'https://console.stage.redhat.com/openshift/overview/osd' },
    { sourceUrl: 'https://openshift.googlecloud.stage.redhat.com/ocp/create', expectedUrl: 'https://console.stage.redhat.com/openshift/install/gcp' },
    {
      sourceUrl: 'https://openshift.googlecloud.stage.redhat.com/list',
      expectedUrl: 'https://console.stage.redhat.com/openshift/cluster-list?plan_id=OSD,OCP',
    },
    { sourceUrl: 'https://openshift.googlecloud.stage.redhat.com/', expectedUrl: 'https://console.stage.redhat.com/openshift/' },
  ],
  prod: [
    { sourceUrl: 'https://openshift.googlecloud.redhat.com/overview', expectedUrl: 'https://console.redhat.com/openshift/overview' },
    { sourceUrl: 'https://openshift.googlecloud.redhat.com/osd/create', expectedUrl: 'https://console.redhat.com/openshift/create/osdgcp' },
    { sourceUrl: 'https://openshift.googlecloud.redhat.com/osd', expectedUrl: 'https://console.redhat.com/openshift/overview/osd' },
    { sourceUrl: 'https://openshift.googlecloud.redhat.com/ocp/create', expectedUrl: 'https://console.redhat.com/openshift/install/gcp' },
    { sourceUrl: 'https://openshift.googlecloud.redhat.com/list', expectedUrl: 'https://console.redhat.com/openshift/cluster-list?plan_id=OSD,OCP' },
    { sourceUrl: 'https://openshift.googlecloud.redhat.com/', expectedUrl: 'https://console.redhat.com/openshift/' },
  ],
};

const reachabilityRoutes: ReachabilityRoute[] = [
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

const STAGE_PROXY = process.env.CI ? undefined : 'http://squid.corp.redhat.com:3128';

const configs: Record<string, EnvironmentConfig> = {
  stage: {
    baseUrl: 'https://console.stage.redhat.com',
    ...(STAGE_PROXY && { proxy: STAGE_PROXY }),
    redirects,
    crossHostRedirects: crossHostRedirects.stage,
    reachabilityRoutes,
  },
  prod: {
    baseUrl: 'https://console.redhat.com',
    redirects,
    crossHostRedirects: crossHostRedirects.prod,
    reachabilityRoutes,
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
