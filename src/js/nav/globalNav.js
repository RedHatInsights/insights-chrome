export const grouppedNav = {
    insights: {
        title: 'Red Hat Insights',
        routes: [
            {
                group: 'insights',
                id: 'actions',
                title: 'Overview',
                default: true
            },
            {
                group: 'insights',
                id: 'rules',
                title: 'Rules'
            },
            {
                id: 'inventory',
                title: 'Inventory'
            },
            {
                id: 'remediations',
                title: 'Remediations'
            },
            {
                title: 'Settings',
                disabled: window.location.pathname.indexOf('/beta') === -1,
                subItems: [
                    {
                        id: 'hooks',
                        title: 'Hooks',
                        reload: 'settings/hooks'
                    },
                    {
                        id: 'sources',
                        title: 'Sources',
                        reload: 'settings/sources'
                    }
                ]
            }
        ]
    },
    rhel: {
        title: 'Cloud Management Services',
        routes: [
            {
                id: 'dashboard',
                title: 'Dashboard',
                default: true
            },
            {
                id: 'vulnerability',
                title: 'Vulnerability'
            },
            {
                id: 'compliance',
                title: 'Compliance'
            },
            {
                id: 'drift',
                title: 'System Comparison'
            },
            {
                id: 'inventory',
                title: 'Inventory'
            },
            {
                id: 'remediations',
                title: 'Remediations'
            }

        ]
    },
    openshift: {
        title: 'Red Hat OpenShift Cluster Manager',
        routes: [
            {
                id: 'clusters',
                title: 'Clusters',
                default: true
            }
        ]
    },
    hybrid: {
        title: 'Hybrid Cloud Management services',
        routes: [
            {
                id: 'catalog',
                title: 'Catalog',
                subItems: [
                    {
                        id: 'portfolios',
                        title: 'Portfolios',
                        default: true
                    },
                    {
                        id: 'platforms',
                        title: 'Platforms'
                    },
                    {
                        id: 'orders',
                        title: 'Orders'
                    },
                    {
                        id: 'approval',
                        title: 'Approval',
                        reload: 'catalog/approval'
                    }
                ]
            },
            {
                id: 'cost-management',
                title: 'Cost Management',
                subItems: [
                    {
                        id: '',
                        title: 'Overview',
                        default: true
                    },
                    {
                        id: 'ocp-on-aws',
                        title: 'OpenShift on cloud details'
                    },
                    {
                        id: 'ocp',
                        title: 'OpenShift details'
                    },
                    {
                        id: 'aws',
                        title: 'Cloud details'
                    },
                    {
                        id: 'cost-models',
                        title: 'Cost model details'
                    }
                ]
            },
            {
                title: 'Settings',
                subItems: [
                    {
                        id: 'sources',
                        title: 'Catalog Sources',
                        reload: 'settings/sources'
                    },
                    {
                        id: 'cost-management-sources',
                        title: 'Cost Management Sources',
                        reload: 'cost-management/sources'
                    },
                    {
                        id: 'rbac',
                        title: 'User Access Management',
                        reload: 'settings/rbac'
                    }
                ]
            }
        ]
    },
    staging: {
        title: 'Staging Bundle',
        routes: [
            {
                id: 'migration-analytics',
                title: 'Migration Analytics',
                disabled: window.location.pathname.indexOf('/beta') === -1 || window.location.hostname === 'cloud.redhat.com',
                default: true
            },
            {
                id: 'ruledev',
                title: 'Home',
                default: true
            }
        ]
    }
};

export default Object.freeze([
    {
        id: 'dashboard',
        title: 'Dashboard'
    },
    {
        id: 'catalog',
        title: 'Catalog',
        // nav is built before window.insights.chrome
        // detect isProd manually here
        disabled: window.location.hostname === 'cloud.redhat.com',
        subItems: [
            {
                id: 'portfolios',
                title: 'Portfolios'
            },
            {
                id: 'platforms',
                title: 'Platforms'
            },
            {
                id: 'orders',
                title: 'Orders'
            }
        ]
    },
    {
        id: 'advisor',
        title: 'Insights',
        subItems: [
            {
                id: 'actions',
                title: 'Actions',
                default: true
            },
            {
                id: 'rules',
                title: 'Rules'
            }
        ]
    },
    {
        id: 'vulnerability',
        title: 'Vulnerability'
    },
    {
        id: 'compliance',
        title: 'Compliance'
    },
    {
        id: 'cost-management',
        title: 'Cost Management',
        subItems: [
            {
                id: '',
                title: 'Overview',
                default: true
            },
            {
                id: 'ocp',
                title: 'OpenShift Details'
            },
            {
                id: 'aws',
                title: 'AWS Details'
            }
        ]
    },
    {
        id: 'inventory',
        title: 'Inventory'
    },
    {
        id: 'topological-inventory',
        title: 'Sources',
        disabled: window.location.hostname === 'cloud.redhat.com'
    },
    {
        id: 'remediations',
        title: 'Remediations'
    },
    {
        id: 'uhc',
        title: 'UHC',
        disabled: window.location.hostname === 'cloud.redhat.com'
    },
    {
        id: 'drift',
        title: 'System Comparison'
    },
    {
        id: 'tower-analytics',
        title: 'Tower Analytics',
        disabled: window.location.hostname === 'cloud.redhat.com'
    },
    {
        id: 'migration-analytics',
        title: 'Migration Analytics',
        disabled: window.location.pathname.indexOf('/beta') === -1 || window.location.hostname === 'cloud.redhat.com',
        default: true
    }
]);
