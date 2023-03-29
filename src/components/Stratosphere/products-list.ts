import { ProductCardProps } from './ProductCard';

const productsList: Omit<ProductCardProps, 'order'>[] = [
  {
    img: '/apps/frontend-assets/logos/logo__rhel.svg',
    description: 'You can create your own OS image to deploy to your cloud instance.',
    link: {
      href: '/insights/dashboard',
      appId: 'dashboard',
      label: 'Create an OS image',
    },
  },
  {
    img: '/apps/frontend-assets/logos/logo__openshift.svg',
    description: 'You can create a cluster to deploy to your cloud instance.',
    link: {
      href: '/openshift',
      appId: 'openshift',
      label: 'Create a cluster',
    },
  },
  {
    img: '/apps/frontend-assets/logos/logo__ansible-automation.svg',
    description: 'Learn how to install and configure your Ansible infrastructure.',
    link: {
      href: '/ansible/ansible-dashboard',
      appId: 'ansibleDashboard',
      label: 'Ansible Automation Platform',
    },
  },
  {
    img: '/apps/frontend-assets/logos/logo__application-services.svg',
    description: 'Learn how to access your Application and Data services.',
    link: {
      href: '/application-services/overview',
      appId: 'applicationServices',
      label: 'Application and Data Services',
    },
  },
];

export default productsList;
