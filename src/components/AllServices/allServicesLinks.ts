import AllServicesIcons from './AllServicesIcons';

export type AllServicesLink = {
  href: string;
  title: string;
  description?: string;
  isExternal?: boolean;
  prod?: boolean;
  ITLess?: boolean;
};
export type AllServicesGroup = {
  isGroup: true;
  title: string;
  ITLess?: boolean;
  links: AllServicesLink[];
  description?: string;
};
export type AllServicesSection = {
  icon: keyof typeof AllServicesIcons;
  ITLess?: boolean;
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
        description: 'Manage API access, policy, and traffic controls for microservice-based applications.',
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
        description: 'Discover, publish, and reuse event schemas and API definitions in a shared repository.',
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
        href: '/ansible/automation-hub',
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
        title: 'Images',
        description: 'Build and manage Red Hat Enterprise Linux images and environments.',
      },
      {
        // not in production
        prod: false,
        href: '/settings/content',
        title: 'Repositories',
      },
    ],
  },
  {
    icon: 'UsersIcon',
    title: 'Identity and Access Management',
    ITLess: true,
    description: 'Ensure that the right users have the appropriate access to technology resources.',
    links: [
      {
        href: '/iam/authentication-policy/authentication-factors',
        title: 'Authentication Policy',
        description: 'Manage how your organization authenticates to Red Hat services.',
      },
      {
        href: '/settings/my-user-access',
        title: 'My User Access',
        ITLess: true,
        description: 'View your account permissions for Red Hat Hybrid Cloud Console services.',
      },
      {
        href: '/iam/user-access/users',
        title: 'User Access',
        ITLess: true,
        description: "Manage your organization's role-based access control (RBAC) to services.",
      },
    ],
  },
  {
    icon: 'InfrastructureIcon',
    title: 'Infrastructure',
    description: 'Manage your infrastructure across the hybrid cloud.',
    links: [
      {
        href: '/openshift/create',
        title: 'Create cluster',
        description: 'Select an OpenShift cluster type to create.',
      },
      {
        href: '/openshift',
        title: 'Clusters',
        description: 'View, Register, or Create a Openshift Cluster.',
      },
      {
        href: '/openshift/overview',
        title: 'Openshift Dashboard (overview)',
        description: 'Overview of your Openshift Environment.',
      },
      {
        href: '/openshift/releases',
        title: 'Releases',
        description: 'View general information on the most recent OpenShift Container Platform release versions that you can install.',
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
        title: 'Clusters Inventory',
      },
      {
        href: '/edge/fleet-management',
        title: 'Edge Inventory',
      },
      {
        href: '/insights/image-builder',
        title: 'Images',
        description: 'Build and manage Red Hat Enterprise Linux images and environments.',
      },
      {
        href: '/insights/subscriptions/inventory',
        title: 'Subscriptions Inventory',
        description: 'List your purchased subscriptions and view more information about each one.',
      },
      {
        href: '/insights/inventory',
        title: 'Systems',
        description: 'View details about your Red Hat Enterprise Linux systems. ',
      },
    ],
  },
  {
    icon: 'ChartLineIcon',
    title: 'Observe',
    ITLess: true,
    description: 'Monitor, troubleshoot, and improve application performance.',
    links: [
      {
        isGroup: true,
        title: 'Ansible',
        links: [
          {
            href: '/ansible/advisor/recommendations#workloads=Ansible+Automation+Platform&SIDs=&tags=',
            title: 'Advisor',
            description: 'See targeted recommendations to optimize your Ansible hosts’ availability, performance, and security.',
          },
          {
            href: '/ansible/drift',
            title: 'Drift',
            description: 'Compare systems in your Ansible inventory to one another or against a set baseline.',
          },
          {
            href: '/ansible/policies',
            title: 'Policies',
            description: 'Monitor your Ansible hosts against set parameters to detect deviation or misalignment. ',
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
            description: 'See targeted recommendations to optimize your OpenShift clusters’ availability, performance, and security.',
          },
          {
            href: '/openshift/insights/vulnerability',
            title: 'Vulnerability',
            description: 'Identify and prioritize security vulnerabilities within your OpenShift clusters based on severity and frequency.',
          },
        ],
      },
      {
        isGroup: true,
        title: 'RHEL',
        ITLess: true,
        links: [
          {
            href: '/insights/advisor/recommendations',
            title: 'Advisor',
            description: 'See targeted recommendations to optimize your Red Hat Enterprise Linux systems’ availability, performance, and security.',
          },
          {
            href: '/insights/patch/advisories',
            title: 'Content Advisories',
            description: 'View applicable advisories and updates for your Red Hat Enterprise Linux systems.',
            ITLess: true,
          },
          {
            href: '/insights/drift',
            title: 'Drift',
            description: 'Compare your Red Hat Enterprise Linux systems to one another or against a set baseline.',
            ITLess: true,
          },
          {
            href: '/insights/patch/advisories',
            title: 'Patch',
            ITLess: true,
            description: 'Review applicable advisories and keep your RHEL systems up to date.',
          },
          {
            href: '/insights/policies/list',
            title: 'Policies',
            description: 'Monitor your Red Hat Enterprise Linux inventory systems against set parameters to detect deviation or misalignment.',
            ITLess: true,
          },
          {
            href: '/insights/remediations',
            title: 'Remediations',
            description:
              'Use Ansible Playbooks to resolve configuration, security, and compliance issues identified on your Red Hat Enterprise Linux systems. ',
            ITLess: true,
          },
          {
            href: '/insights/ros',
            title: 'Resource Optimization',
            description: 'Optimize your public cloud-based Red Hat Enterprise Linux systems based on CPU, memory, and disk input/output performance.',
            ITLess: true,
          },
        ],
      },
    ],
  },
  {
    icon: 'CloudSecurityIcon',
    title: 'Security',
    ITLess: true,
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
            description: 'Identify and prioritize security vulnerabilities within your OpenShift clusters based on severity and frequency.',
          },
        ],
      },
      {
        isGroup: true,
        title: 'RHEL',
        ITLess: true,
        links: [
          {
            href: '/insights/advisor/recommendations',
            title: 'Advisor',
            description: 'See targeted recommendations to optimize your Red Hat Enterprise Linux systems’ availability, performance, and security.',
          },
          {
            href: '/insights/patch/advisories',
            title: 'Content Advisories',
            description: 'View applicable advisories and updates for your Red Hat Enterprise Linux systems.',
            ITLess: true,
          },
          {
            href: '/insights/compliance',
            title: 'Compliance',
            description: 'Evaluate your Red Hat Enterprise systems’ compliance with security or regulatory standards.',
            ITLess: true,
          },
          {
            href: '/edge/fleet-management',
            title: 'Edge',
            description: 'Manage the lifecycle and enhance security of your RHEL systems at the edge.',
          },
          {
            href: '/insights/malware',
            title: 'Malware',
            description: 'Identify potential malware on your Red Hat Enterprise Linux systems. ',
            ITLess: true,
          },
          {
            href: '/insights/remediations',
            title: 'Remediations',
            description:
              'Use Ansible Playbooks to resolve configuration, security, and compliance issues identified on your Red Hat Enterprise Linux systems.',
            ITLess: true,
          },
          {
            href: '/insights/vulnerability/cves',
            title: 'Vulnerability',
            description:
              'Identify and prioritize security vulnerabilities within your Red Hat Enterprise Linux systems based on severity and frequency.',
            ITLess: true,
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
        description: 'List your purchased subscriptions and view more information about each one.',
      },
      {
        href: '/insights/ros',
        title: 'Resource Optimization',
        description: 'Optimize your public cloud-based Red Hat Enterprise Linux systems based on CPU, memory, and disk input/output performance.',
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
        description: 'Create activation keys to register your systems and configure repositories without using a username and password.',
      },
      {
        href: '/insights/subscriptions/manifests',
        title: 'Manifests',
        description: 'Export subscription manifests for Red Hat Satellite.',
      },
      {
        href: '/insights/registration',
        title: 'Register Systems',
        description: 'Register your systems with the Red Hat Insights Client to view them on the Red Hat Hybrid Cloud Console.',
      },
      {
        href: '/settings/connector',
        title: 'Remote Host Configuration',
        description: 'Configure your systems to execute Ansible Playbooks.',
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
        description: 'Gain hands-on experience and assess if a product is right for you in a no-cost trial.',
      },
    ],
  },
];

export default allServicesLinks;
