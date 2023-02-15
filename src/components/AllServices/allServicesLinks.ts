import AllServicesIcons from './AllServicesIcons';

export type AllServicesLink = {
  href: string;
  title: string;
  isExternal?: boolean;
};
export type AllServicesGroup = {
  isGroup: true;
  title: string;
  links: AllServicesLink[];
};
export type AllServicesSection = {
  icon: keyof typeof AllServicesIcons;
  title: string;
  description: string;
  links: (AllServicesLink | AllServicesGroup)[];
};

const allServicesLinks: AllServicesSection[] = [
  {
    icon: 'CloudUploadAltIcon',
    title: 'Application Services',
    description: 'Streamline your hybrid cloud experience, reducing the operational cost and complexity of delivering cloud-native applications.',
    links: [
      {
        href: '/application-services/api-designer',
        title: 'API Designer',
      },
      {
        href: '/application-services/api-management',
        title: 'API Management',
      },
      {
        href: '/application-services/connectors',
        title: 'Connectors',
      },
      {
        href: '/application-services/service-accounts',
        title: 'Service Accounts',
      },
      {
        href: '/application-services/service-registry',
        title: 'Service Registry',
      },
      {
        href: '/application-services/streams',
        title: 'Streams for Apache Kafka',
      },
    ],
  },
  {
    icon: 'AutomationIcon',
    title: 'Automation',
    description: 'Solve problems once, in one place, and scale up.',
    links: [
      {
        href: '/ansible/automation-analytics/reports',
        title: 'Automation Analytics',
      },
      {
        href: '/ansible/automation-hub',
        title: 'Automation Hub',
      },
      {
        href: '/ansible/inventory',
        title: 'Insights',
      },
      {
        href: '/ansible/remediations',
        title: 'Remediations',
      },
    ],
  },
  {
    icon: 'DatabaseIcon',
    title: 'Data Services',
    description: 'Create, manage, and migrate relational and non-relational databases.',
    links: [
      {
        href: '/application-services/databases',
        title: 'Database Access',
      },
      {
        href: '/application-services/data-science',
        title: 'Data Science',
      },
    ],
  },
  {
    icon: 'RocketIcon',
    title: 'Deploy',
    description: 'Create RHEL images, systems at the Edge, and OpenShift clusters.',
    links: [
      {
        href: '/openshift/create',
        title: 'Clusters',
      },
      {
        href: '/edge/fleet-management',
        title: 'Edge',
      },
      {
        href: '/insights/image-builder',
        title: 'Image Builder',
      },
      {
        href: '/settings/content',
        title: 'Repositories',
      },
    ],
  },
  {
    icon: 'UsersIcon',
    title: 'Identity and Access Management',
    description: 'Ensure that the right users have the appropriate access to technology resources.',
    links: [
      {
        href: '/settings/my-user-access',
        title: 'My User Access',
      },
      {
        href: '/iam/user-access/users',
        title: 'User Access',
      },
    ],
  },
  {
    icon: 'InfrastructureIcon',
    title: 'Infrastructure',
    description: 'Manage your infrastructure across the hybrid cloud.',
    links: [
      {
        href: '/openshift',
        title: 'Clusters',
      },
      {
        href: '/openshift/overview',
        title: 'OpenShift',
      },
      {
        href: '/openshift/releases',
        title: 'Releases',
      },
    ],
  },
  {
    icon: 'BellIcon',
    title: 'Integrations and Notifications',
    description: 'Alerts users to events, using email and integrations such as webhooks.',
    links: [
      {
        href: '/settings/integrations',
        title: 'Integrations',
      },
      {
        href: '/settings/notifications/console',
        title: 'Notifications',
      },
      {
        href: '/settings/sources',
        title: 'Sources',
      },
    ],
  },
  {
    icon: 'InfrastructureIcon',
    title: 'Inventories',
    description: "View OpenShift clusters, Edge systems, RHEL hosts, and your organization's subscriptions.",
    links: [
      {
        href: '/openshift',
        title: 'Clusters',
      },
      {
        href: '/edge/fleet-management',
        title: 'Edge',
      },
      {
        href: '/insights/subscriptions/inventory',
        title: 'Subscriptions',
      },
      {
        href: '/insights/inventory',
        title: 'Systems',
      },
    ],
  },
  {
    icon: 'ChartLineIcon',
    title: 'Observe',
    description: 'Monitor, troubleshoot, and improve application performance.',
    links: [
      {
        isGroup: true,
        title: 'Ansible',
        links: [
          {
            href: '/ansible/advisor/recommendations#workloads=Ansible+Automation+Platform&SIDs=&tags=',
            title: 'Advisor',
          },
          {
            href: '/ansible/drift',
            title: 'Drift',
          },
          {
            href: '/ansible/policies',
            title: 'Policies',
          },
        ],
      },
      {
        isGroup: true,
        title: 'OpenShift',
        links: [
          {
            href: '/openshift/insights/advisor/recommendations',
            title: 'Advisor',
          },
          {
            href: '/openshift/insights/vulnerability',
            title: 'Vulnerability',
          },
        ],
      },
      {
        isGroup: true,
        title: 'RHEL',
        links: [
          {
            href: '/insights/advisor/recommendations',
            title: 'Advisor',
          },
          {
            href: '/insights/drift',
            title: 'Drift',
          },
          {
            href: '/insights/patch/advisories',
            title: 'Patch',
          },
          {
            href: '/insights/policies/list',
            title: 'Policies',
          },
          {
            href: '/insights/remediations',
            title: 'Remediations',
          },
          {
            href: '/insights/ros',
            title: 'Resource Optimization',
          },
        ],
      },
    ],
  },
  {
    icon: 'CloudSecurityIcon',
    title: 'Security',
    description: 'Meet your policy and compliance objectives.',
    links: [
      {
        isGroup: true,
        title: 'Ansible',
        links: [
          {
            href: '/ansible/remediations',
            title: 'Remediations',
          },
        ],
      },
      {
        isGroup: true,
        title: 'OpenShift',
        links: [
          {
            href: '/application-services/acs/overview',
            title: 'Advanced Cluster Security',
          },
          {
            href: '/openshift/insights/vulnerability',
            title: 'Vulnerability',
          },
        ],
      },
      {
        isGroup: true,
        title: 'RHEL',
        links: [
          {
            href: '/insights/advisor/recommendations',
            title: 'Advisor',
          },
          {
            href: '/insights/compliance',
            title: 'Compliance',
          },
          {
            href: '/edge/fleet-management',
            title: 'Edge',
          },
          {
            href: '/insights/malware',
            title: 'Malware',
          },
          {
            href: '/insights/patch/advisories',
            title: 'Patch',
          },
          {
            href: '/insights/tasks',
            title: 'Tasks',
          },
          {
            href: '/insights/vulnerability/cves',
            title: 'Vulnerability',
          },
        ],
      },
    ],
  },
  {
    icon: 'CreditCardIcon',
    title: 'Spend Management',
    description: 'Control costs and monitor committed spend.',
    links: [
      {
        href: '/openshift/cost-management',
        title: 'Cost Management',
      },
      {
        href: '/insights/subscriptions/inventory',
        title: 'Subscription Inventory',
      },
    ],
  },
  {
    icon: 'CogIcon',
    title: 'System Configuration',
    description: 'Connect your RHEL systems to Hybrid Cloud Console services.',
    links: [
      {
        href: '/settings/connector/activation-keys',
        title: 'Activation Keys',
      },
      {
        href: '/insights/subscriptions/manifests',
        title: 'Manifests',
      },
      {
        href: '/insights/registration',
        title: 'Register Systems',
      },
      {
        href: '/settings/connector',
        title: 'Remote Host Configuration',
      },
    ],
  },
  {
    icon: 'ShoppingCartIcon',
    title: 'Try and Buy',
    description:
      'Our no-cost trials help you gain hands-on experience, prepare for a certification, or assess if a product is right for your organization.',
    links: [
      {
        href: '/openshift/sandbox',
        title: 'Developer Sandbox',
      },
      {
        isExternal: true,
        href: 'https://marketplace.redhat.com/en-us',
        title: 'Red Hat Marketplace',
      },
      {
        isExternal: true,
        href: 'https://www.redhat.com/en/products/trials',
        title: 'Red Hat Product Trials',
      },
    ],
  },
];

export default allServicesLinks;
