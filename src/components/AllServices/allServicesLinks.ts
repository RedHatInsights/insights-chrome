import AllServicesIcons from './AllServicesIcons';

export type AllServicesLink = {
  href: string;
  title: string;
  description?: string;
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
        description: 'Create, import, edit, and manage API definitions and event schemas in a visual editor.',
      },
      {
        href: '/application-services/api-management',
        title: 'API Management',
        description: 'Manage API access, policy, and traffic controls for micorservice-based applications.',
      },
      {
        href: '/application-services/connectors',
        title: 'Connectors',
        description: 'Send data between event streams and third-party systems with pre-built integrations.',
      },
      {
        href: '/application-services/service-accounts',
        title: 'Service Accounts',
        description: 'Authenticate and connect securely to APIs from multiple services.',
      },
      {
        href: '/application-services/service-registry',
        title: 'Service Registry',
        description: 'Discover, publish, and reuse event schemas and API definitions in a shared repository.'
      },
      {
        href: '/application-services/streams',
        title: 'Streams for Apache Kafka',
        description: 'Create, discover, and connect to real-time events and data streams.',
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
        description: 'Plan, measure, and scale your automation using actionable data.',
      },
      {
        href: '/ansible/automation-hub/',
        title: 'Automation Hub',
        description: 'Find and download Ansible Content Collections from Red Hat and partners.',
      },
      {
        href: '/ansible/inventory',
        title: 'Insights',
        description: 'Get recommendations to prevent and resolve potential issues on your Ansible-managed ecosystem.',
      },
      {
        href: '/ansible/remediations',
        title: 'Remediations',
        description: 'Resolve issues with security, configuration, compliance, and policy recommendations.',
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
        description: 'Provision, monitor, and connect to cloud-hosted partner database services.',
      },
      {
        href: '/application-services/data-science',
        title: 'Data Science',
        description: 'Develop, train, and test artificial intelligence and machine learning (AI/ML) models.',
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
        description: 'Create an OpenShift cluster.',
      },
      {
        href: '/edge/fleet-management',
        title: 'Edge',
        description: 'Manage the lifecycle and enhance security of your RHEL systems at the edge.',
      },
      {
        href: '/insights/image-builder',
        title: 'Image Builder',
        description: 'Start building your images.',
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
        description: 'View your account permissions for Red Hat Hybrid Cloud Console services.',
      },
      {
        href: '/iam/user-access/users',
        title: 'User Access',
        description: 'Manage your organization\'s role-based access control (RBAC) to services.',
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
        description: 'View, Register, or Create a Openshift Cluster',
      },
      {
        href: '/openshift/overview',
        title: 'OpenShift',
        description: 'Overview of your Openshift Environment',
      },
      {
        href: '/openshift/releases',
        title: 'Releases',
        description: 'View general information on the most recent OpenShift Container Platform release versions that you can install',
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
        description: 'List your purchased subscriptions and view more information about each.',
      },
      {
        href: '/insights/inventory',
        title: 'Systems',
        description: 'View system facts about your RHEL hosts.',
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
            description: 'Get recommendations to optimize availability, performance, and security on your Ansible hosts.',
          },
          {
            href: '/ansible/drift',
            title: 'Drift',
            description: 'Create baselines and compare system profiles in your Ansible inventory over time.'
          },
          {
            href: '/ansible/policies',
            title: 'Policies',
            description: 'Define and monitor against your own policies to identify misalignment.',
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
            description: 'Get recommendations to prevent and resolve potential issues on your OpenShift clusters.',
          },
          {
            href: '/openshift/insights/vulnerability/',
            title: 'Vulnerability',
            description: 'Assess security vulnerabilities (CVEs) that could affect your clusters.',
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
            description: 'Get recommendations to optimize availability, performance, and security on your RHEL systems.',
          },
          {
            href: '/insights/drift',
            title: 'Drift',
            description: 'Create baselines and compare system profiles in your RHEL inventory over time.',
          },
          {
            href: '/insights/patch/advisories',
            title: 'Patch',
            description: 'Review applicable advisories and keep your RHEL systems up to date.',
          },
          {
            href: '/insights/policies/list',
            title: 'Policies',
            description: 'Define and monitor against your own policies to identify misalignment',
          },
          {
            href: '/insights/remediations',
            title: 'Remediations',
            description: 'Resolve issues with security, configuration, compliance, and policy recommendations.',
          },
          {
            href: '/insights/ros',
            title: 'Resource Optimization',
            description: 'Right-size your public cloud systems based on CPU, memory, and I/O performance metrics.',
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
            description: 'Resolve issues with security, configuration, compliance, and policy recommendations.',
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
            description: 'Securely build, deploy, and run your cloud applications using Kubernetes-native architecture.',
          },
          {
            href: '/openshift/insights/vulnerability/',
            title: 'Vulnerability',
            description: 'Assess security vulnerabilities (CVEs) that could affect your clusters.',
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
            description: 'Analyze the availability, performance, stability, and security risk for your systems.',
          },
          {
            href: '/insights/compliance/',
            title: 'Compliance',
            description: 'Deploy and monitor security compliance policies for your organization.',
          },
          {
            href: '/edge/fleet-management',
            title: 'Edge',
            description: 'Manage the lifecycle and enhance security of your RHEL systems at the edge.'
          },
          {
            href: '/insights/malware/',
            title: 'Malware',
            description: 'Identify potential malware on your RHEL hosts.',
          },
          {
            href: '/insights/patch/advisories',
            title: 'Patch',
            description: 'Review applicable advisories and keep your RHEL systems up to date.',
          },
          {
            href: '/insights/tasks',
            title: 'Tasks',
          },
          {
            href: '/insights/vulnerability/cves',
            title: 'Vulnerability',
            description: 'Assess security vulnerabilities (CVEs) that could affect your systems.'
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
        description: 'Understand and track costs for your OpenShift clusters and workloads.',
      },
      {
        href: '/insights/subscriptions/inventory',
        title: 'Subscription Inventory',
        description: 'List your purchased subscriptions and view more information about each.',
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
        description: 'Create keys to register systems and configure repositories without a username and password.',
      },
      {
        href: '/insights/subscriptions/manifests',
        title: 'Manifests',
        description: 'Download subscription manifests for Red Hat Satellite.',
      },
      {
        href: '/insights/registration',
        title: 'Register Systems',
        description: 'Guides you through the setup process for the Red Hat Insights Client.',
      },
      {
        href: '/settings/connector',
        title: 'Remote Host Configuration',
        description: 'Connect to Red Hat and automatically push ansible playbooks.',
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
        description: 'Learn and try developing in a private, pre-configured OpenShift environment.',
      },
      {
        isExternal: true,
        href: 'https://marketplace.redhat.com/en-us',
        title: 'Red Hat Marketplace',
        description: 'Find, try, purchase, and deploy your software across clouds.',
      },
      {
        isExternal: true,
        href: 'https://www.redhat.com/en/products/trials',
        title: 'Red Hat Product Trials',
        description: 'Gain hands-on experience and assess if a product is right for you in a no-cost trial.'
      },
    ],
  },
];

export default allServicesLinks;
