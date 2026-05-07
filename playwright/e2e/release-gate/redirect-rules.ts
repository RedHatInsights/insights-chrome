/**
 * Redirect rules for Akamai CDN and domain redirect testing.
 *
 * Migrated from: iqe-platform-ui-plugin/iqe_platform_ui/conf/platform_ui.default.yaml
 *
 * These rules verify that HTTP-level redirects (301/302) are correctly
 * configured in the Akamai CDN for the Hybrid Cloud Console.
 *
 * Two categories:
 * 1. Path redirects — old URL paths redirect to new paths on the same domain
 * 2. Domain redirects — cloud.redhat.com paths redirect to console.redhat.com
 *
 * To add new rules, append to the appropriate array below.
 */

export interface RedirectRule {
  /** Source path to request */
  from: string;
  /** Expected destination path (or full URL for domain redirects) */
  to: string;
  /** Human-readable description */
  description: string;
  /** Expected HTTP status code (301 or 302) */
  expectedStatus?: number;
}

/**
 * Akamai CDN path redirects.
 *
 * These test that old URL paths are redirected to their new locations
 * within the same domain (console.redhat.com or console.stage.redhat.com).
 *
 * Environment: stage and prod only (Akamai not configured in ephemeral/local).
 */
export const PATH_REDIRECTS: RedirectRule[] = [
  // Cost Management moved under OpenShift bundle
  {
    from: '/cost-management',
    to: '/openshift/cost-management',
    description: 'Cost Management root → OpenShift Cost Management',
  },
  {
    from: '/cost-management/',
    to: '/openshift/cost-management/',
    description: 'Cost Management root (trailing slash)',
  },
  {
    from: '/cost-management/overview',
    to: '/openshift/cost-management/overview',
    description: 'Cost Management overview',
  },
  // Subscription Watch / RHEL subscriptions path changes
  {
    from: '/openshift/subscriptions/openshift-container',
    to: '/subscriptions/usage',
    description: 'OpenShift subscriptions → Subscriptions usage',
  },
  {
    from: '/insights/subscriptions/rhel',
    to: '/subscriptions/usage',
    description: 'Insights RHEL subscriptions → Subscriptions usage',
  },
  {
    from: '/insights/subscriptions/rhel-arm',
    to: '/subscriptions/usage',
    description: 'Insights RHEL ARM subscriptions → Subscriptions usage',
  },
  {
    from: '/insights/subscriptions/rhel-ibmpower',
    to: '/subscriptions/usage',
    description: 'Insights RHEL IBM Power subscriptions → Subscriptions usage',
  },
  {
    from: '/insights/subscriptions/rhel-ibmz',
    to: '/subscriptions/usage',
    description: 'Insights RHEL IBM Z subscriptions → Subscriptions usage',
  },
  {
    from: '/insights/subscriptions/rhel-x86',
    to: '/subscriptions/usage',
    description: 'Insights RHEL x86 subscriptions → Subscriptions usage',
  },
  // Migration paths
  {
    from: '/migrations/migration-analytics',
    to: '/migrations',
    description: 'Migration analytics → Migrations root',
  },
  // Settings path changes
  {
    from: '/settings/sources',
    to: '/settings/integrations',
    description: 'Sources → Integrations',
  },
  // RBAC / IAM path changes
  {
    from: '/settings/rbac',
    to: '/iam/user-access/overview',
    description: 'Settings RBAC → IAM User Access overview',
  },
  {
    from: '/settings/my-user-access',
    to: '/iam/my-user-access',
    description: 'Settings My User Access → IAM My User Access',
  },
  // Insights path restructuring
  {
    from: '/insights/compliance',
    to: '/insights/compliance/reports',
    description: 'Compliance root → Compliance reports',
  },
  {
    from: '/insights/vulnerability',
    to: '/insights/vulnerability/cves',
    description: 'Vulnerability root → CVEs list',
  },
  {
    from: '/insights/advisor',
    to: '/insights/advisor/recommendations',
    description: 'Advisor root → Recommendations',
  },
  {
    from: '/insights/drift',
    to: '/insights/drift/comparison',
    description: 'Drift root → Comparison',
  },
  {
    from: '/insights/policies',
    to: '/insights/policies/list',
    description: 'Policies root → Policies list',
  },
  // Ansible bundle path changes
  {
    from: '/ansible/insights',
    to: '/ansible/advisor/recommendations',
    description: 'Ansible Insights → Ansible Advisor recommendations',
  },
  // Application Services restructuring
  {
    from: '/application-services/api-management',
    to: '/application-services/api-designer',
    description: 'API Management → API Designer',
  },
  // Quay.io
  {
    from: '/quay',
    to: '/quay/organization',
    description: 'Quay root → Quay organization',
  },
];

/**
 * Domain redirects — cloud.redhat.com → console.redhat.com.
 *
 * These verify that the old cloud.redhat.com domain correctly redirects
 * to console.redhat.com, preserving the path.
 *
 * In stage: cloud.stage.redhat.com → console.stage.redhat.com
 *
 * Note: These can only be tested against environments where the domain
 * redirect is configured (stage, prod). The test dynamically constructs
 * the source URL based on the target environment.
 */
export const DOMAIN_REDIRECTS: RedirectRule[] = [
  { from: '/', to: '/', description: 'Root page' },
  { from: '/insights', to: '/insights', description: 'Insights bundle' },
  { from: '/insights/dashboard', to: '/insights/dashboard', description: 'Insights dashboard' },
  { from: '/insights/advisor', to: '/insights/advisor', description: 'Advisor' },
  { from: '/insights/vulnerability', to: '/insights/vulnerability', description: 'Vulnerability' },
  { from: '/insights/compliance', to: '/insights/compliance', description: 'Compliance' },
  { from: '/insights/patch', to: '/insights/patch', description: 'Patch' },
  { from: '/insights/drift', to: '/insights/drift', description: 'Drift' },
  { from: '/insights/policies', to: '/insights/policies', description: 'Policies' },
  { from: '/insights/inventory', to: '/insights/inventory', description: 'Inventory' },
  { from: '/insights/remediations', to: '/insights/remediations', description: 'Remediations' },
  { from: '/openshift', to: '/openshift', description: 'OpenShift bundle' },
  { from: '/openshift/overview', to: '/openshift/overview', description: 'OpenShift overview' },
  { from: '/openshift/cost-management', to: '/openshift/cost-management', description: 'Cost Management' },
  { from: '/ansible', to: '/ansible', description: 'Ansible bundle' },
  { from: '/ansible/automation-hub', to: '/ansible/automation-hub', description: 'Automation Hub' },
  { from: '/ansible/automation-analytics', to: '/ansible/automation-analytics', description: 'Automation Analytics' },
  { from: '/settings', to: '/settings', description: 'Settings' },
  { from: '/settings/integrations', to: '/settings/integrations', description: 'Integrations' },
  { from: '/settings/notifications', to: '/settings/notifications', description: 'Notifications' },
  { from: '/iam/user-access/overview', to: '/iam/user-access/overview', description: 'User Access overview' },
  { from: '/iam/my-user-access', to: '/iam/my-user-access', description: 'My User Access' },
  { from: '/subscriptions/usage', to: '/subscriptions/usage', description: 'Subscriptions usage' },
  { from: '/allservices', to: '/allservices', description: 'All Services' },
  { from: '/favoritedservices', to: '/favoritedservices', description: 'Favorited Services' },
  { from: '/api', to: '/api', description: 'API docs' },
  { from: '/edge', to: '/edge', description: 'Edge bundle' },
  { from: '/quay/organization', to: '/quay/organization', description: 'Quay organization' },
  { from: '/application-services', to: '/application-services', description: 'Application Services' },
  { from: '/hac', to: '/hac', description: 'HAC' },
];
