import { ProductCardProps } from './ProductCard';

const productsList: Omit<ProductCardProps, 'order'>[] = [
  {
    img: '/apps/frontend-assets/platform-logos/rhel.svg',
    description: 'You can create your own OS image to deploy to your cloud instance.',
    link: {
      href: '/insights/dashboard',
      appId: 'dashboard',
      label: 'Create an OS image',
    },
  },
  {
    img: '/apps/frontend-assets/platform-logos/openshift.svg',
    description: 'You can create a cluster to deploy to your cloud instance.',
    link: {
      href: '/openshift',
      appId: 'openshift',
      label: 'Create a cluster',
    },
  },
  {
    img: '/apps/frontend-assets/platform-logos/ansible-automation-platform.svg',
    description: 'Learn how to install and configure your Ansible infrastructure.',
    link: {
      href: '/ansible/ansible-dashboard',
      appId: 'ansibleDashboard',
      label: 'Ansible Automation Platform',
    },
  },
  {
    img: '/apps/frontend-assets/platform-logos/application-services.svg',
    description: 'Learn how to access your Application services.',
    link: {
      href: '/application-services/overview',
      appId: 'applicationServices',
      label: 'Application Services',
    },
  },
];

export default productsList;
