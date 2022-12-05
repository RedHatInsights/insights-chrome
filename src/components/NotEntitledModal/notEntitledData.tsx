import React from 'react';

export type EntitlementData = {
  entitlement: string;
  title: string;
  image?: string;
  emptyTitle: string;
  emptyText: React.ReactNode;
  emptyID: string;
  emptyAction?: {
    secondary?: {
      navigate: string;
    };
    primary?: {
      navigate: string;
      title: React.ReactNode;
    };
    close?: {
      title: React.ReactNode;
    };
  };
};

const notEntitledData: EntitlementData[] = [
  {
    entitlement: 'ansible',
    title: 'Ansible Automation',
    image: 'https://console.redhat.com/apps/frontend-assets/icons/icon__automation.svg',
    emptyTitle: 'Get started with Red Hat Ansible Automation Platform',
    emptyText: [
      'Red Hat Ansible Automation Platform simplifies the development and operation of automation workloads across diverse hybrid environments using Ansible Automation Controller, certified and supported content collections, and the hosted services on cloud.redhat.com.',
    ],
    emptyID: 'ansible',
    emptyAction: {
      primary: {
        title: 'Try it',
        navigate: 'https://www.redhat.com/en/technologies/management/ansible/try-it',
      },
      secondary: {
        navigate: 'https://www.ansible.com/products/automation-platform?extIdCarryOver=true&intcmp=701f20000012m1qAAA&sc_cid=701f2000001Css0AAC',
      },
      close: {
        title: 'Not now',
      },
    },
  },
  {
    entitlement: 'insights',
    image: 'https://console.redhat.com/apps/frontend-assets/icons/icon__exp-up.svg',
    title: 'Insights',
    emptyTitle: 'Red Hat Insights is included with your Red Hat Enterprise Linux subscription.',
    emptyText: [
      'Red Hat Insights for Red Hat Enterprise Linux simplifies how IT teams maintain and optimize a stable, secure, and performant operating environment.',
      <br key="insights-space1" />,
      <br key="insights-space2" />,
      'This is done by visualizing subscription and resource utilization of RHEL, and using powerful rule-based analytical models to proactively \
       identify and prioritize operational and security risks so teams can take action faster and easier.',
      <br key="insights-space3" />,
      <br key="insights-space4" />,
      'Start your trial today.',
    ],
    emptyID: 'insights',
    emptyAction: {
      primary: {
        title: 'Request a trial',
        navigate: 'https://www.redhat.com/en/technologies/linux-platforms/enterprise-linux/try-it',
      },
      secondary: {
        navigate: 'https://www.redhat.com/en/technologies/linux-platforms/enterprise-linux',
      },
      close: {
        title: 'Not now',
      },
    },
  },
  {
    entitlement: 'subscriptions',
    image: 'https://console.redhat.com/apps/frontend-assets/icons/icon__subscriptions.svg',
    title: 'Subscriptions',
    emptyTitle: 'Subscriptions',
    emptyID: 'subscription-watch',
    emptyText: [
      'Subscriptions enables you to understand your total subscription usage and capacity across your hybrid infrastructure over time.',
      <br key="sw1" />,
      <br key="sw2" />,
      'If you are interested in trying Subscriptions, your Red Hat account team can help.',
    ],
    emptyAction: {
      primary: {
        title: 'Contact us',
        navigate: 'https://access.redhat.com/account-team',
      },
      close: {
        title: 'Not now',
      },
    },
  },
  {
    entitlement: 'cost_management',
    image: 'https://console.redhat.com/apps/frontend-assets/icons/icon__const.svg',
    emptyTitle: 'Cost Management for OpenShift',
    emptyID: 'cost-management',
    emptyText:
      'Cost Management provides visibility and analysis for your OpenShift \
        and cloud costs. To obtain access to Cost Management, become an OpenShift customer.',
    emptyAction: {
      primary: {
        title: 'Learn more',
        navigate: 'https://www.redhat.com/en/technologies/cloud-computing/openshift',
      },
      close: {
        title: 'Not now',
      },
    },
    title: 'Cost Management',
  },
];

export default notEntitledData;
