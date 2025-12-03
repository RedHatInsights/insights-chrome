import React from 'react';
import PlaceholderIcon from '../AllServicesDropdown/icon-placeholder';
import AITechnologyIcon from '../AllServicesDropdown/icon-ai-technology';
import ACSIcon from '../AllServicesDropdown/icon-acs';
import AnsibleIcon from '../AllServicesDropdown/icon-ansible';
import AppServicesIcon from '../AllServicesDropdown/icon-app-services';
import DataScienceIcon from '../AllServicesDropdown/icon-data-science';
import IAmIcon from '../AllServicesDropdown/icon-iam';
import InsightsIcon from '../AllServicesDropdown/icon-insights';
import OpenShiftIcon from '../AllServicesDropdown/icon-openshift';
import OtherServicesIcon from '../AllServicesDropdown/icon-other-services';
import QuayIoIcon from '../AllServicesDropdown/icon-quay-io';
import RHIcon from '../AllServicesDropdown/icon-rh';
import ServicesIcon from '../AllServicesDropdown/icon-services';
import SettingsIcon from '../AllServicesDropdown/icon-settings';
import SubscriptionsIcon from '../AllServicesDropdown/icon-subscriptions';
import TrustedArtifactIcon from '../AllServicesDropdown/icon-trusted-artifact';
import TrustedContentIcon from '../AllServicesDropdown/icon-trusted-content';
import BoxesIcon from '@patternfly/react-icons/dist/dynamic/icons/boxes-icon';
import ChartLineIcon from '@patternfly/react-icons/dist/dynamic/icons/chart-line-icon';
import CloudSecurityIcon from '@patternfly/react-icons/dist/dynamic/icons/cloud-security-icon';
import CloudUploadAltIcon from '@patternfly/react-icons/dist/dynamic/icons/cloud-upload-alt-icon';
import CogIcon from '@patternfly/react-icons/dist/dynamic/icons/cog-icon';
import CreditCardIcon from '@patternfly/react-icons/dist/dynamic/icons/credit-card-icon';
import CubeIcon from '@patternfly/react-icons/dist/dynamic/icons/cube-icon';
import LightBulbIcon from '@patternfly/react-icons/dist/dynamic/icons/lightbulb-icon';
import InfrastructureIcon from '@patternfly/react-icons/dist/dynamic/icons/infrastructure-icon';
import RocketIcon from '@patternfly/react-icons/dist/dynamic/icons/rocket-icon';
import ShoppingCartIcon from '@patternfly/react-icons/dist/dynamic/icons/shopping-cart-icon';
import UsersIcon from '@patternfly/react-icons/dist/dynamic/icons/users-icon';
import MonitoringIcon from '@patternfly/react-icons/dist/dynamic/icons/monitoring-icon';
import AutomationIcon from '@patternfly/react-icons/dist/dynamic/icons/automation-icon';
import BellIcon from '@patternfly/react-icons/dist/dynamic/icons/bell-icon';
import BrainIcon from '@patternfly/react-icons/dist/dynamic/icons/brain-icon';

export enum FavorableIcons {
  AITechnologyIcon = 'AITechnologyIcon',
  ACSIcon = 'ACSIcon',
  AnsibleIcon = 'AnsibleIcon',
  AppServicesIcon = 'AppServicesIcon',
  BrainIcon = 'BrainIcon',
  DataScienceIcon = 'DataScienceIcon',
  IAmIcon = 'IAmIcon',
  InsightsIcon = 'InsightsIcon',
  OpenShiftIcon = 'OpenShiftIcon',
  OtherServicesIcon = 'OtherServicesIcon',
  QuayIoIcon = 'QuayIoIcon',
  RHIcon = 'RHIcon',
  ServicesIcon = 'ServicesIcon',
  SettingsIcon = 'SettingsIcon',
  SubscriptionsIcon = 'SubscriptionsIcon',
  TrustedArtifactIcon = 'TrustedArtifactIcon',
  TrustedContentIcon = 'TrustedContentIcon',
  PlaceholderIcon = 'PlaceholderIcon',
  CloudUploadAltIcon = 'CloudUploadAltIcon',
  AutomationIcon = 'AutomationIcon',
  LightBulbIcon = 'LightBulbIcon',
  RocketIcon = 'RocketIcon',
  UsersIcon = 'UsersIcon',
  InfrastructureIcon = 'InfrastructureIcon',
  BellIcon = 'BellIcon',
  ChartLineIcon = 'ChartLineIcon',
  CloudSecurityIcon = 'CloudSecurityIcon',
  CreditCardIcon = 'CreditCardIcon',
  CogIcon = 'CogIcon',
  ShoppingCartIcon = 'ShoppingCartIcon',
  CubeIcon = 'CubeIcon',
  BoxesIcon = 'BoxesIcon',
  MonitoringIcon = 'MonitoringIcon',
}

const iconEnum: { [key in FavorableIcons]: React.ComponentType } = {
  AITechnologyIcon,
  ACSIcon,
  AnsibleIcon,
  AppServicesIcon,
  DataScienceIcon,
  IAmIcon,
  InsightsIcon,
  OpenShiftIcon,
  OtherServicesIcon,
  QuayIoIcon,
  RHIcon,
  ServicesIcon,
  SettingsIcon,
  SubscriptionsIcon,
  TrustedArtifactIcon,
  TrustedContentIcon,
  PlaceholderIcon,
  CloudUploadAltIcon,
  AutomationIcon,
  LightBulbIcon,
  RocketIcon,
  UsersIcon,
  InfrastructureIcon,
  BellIcon,
  ChartLineIcon,
  CloudSecurityIcon,
  CreditCardIcon,
  CogIcon,
  ShoppingCartIcon,
  CubeIcon,
  BoxesIcon,
  BrainIcon,
  MonitoringIcon,
};

const ServiceIcon = ({ icon }: { icon?: FavorableIcons }) => {
  const C = icon ? iconEnum[icon] : PlaceholderIcon;
  return <C />;
};

export default ServiceIcon;
