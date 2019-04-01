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
                subItems: [
                    {
                        id: 'webhooks',
                        title: 'Webhooks',
                        reload: 'webhooks'
                    },
                    {
                        id: 'sources',
                        title: 'Sources',
                        reload: 'sources'
                    }
                ]
            }
        ]
    },
    rhel: {
        title: 'Red Hat Enterprise Linux management services',
        routes: [
            {
                id: 'dashboard',
                title: 'Dashboard',
                default: true
            },
            {
                id: 'vulnerability',
                title: 'Vulnerabilities'
            },
            {
                id: 'compliance',
                title: 'Compliance'
            },
            {
                id: 'drift',
                title: 'System Comparison',
                disabled: window.location.hostname === 'access.redhat.com'
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
                id: '',
                title: 'UHC',
                disabled: window.location.hostname === 'access.redhat.com',
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
                // nav is built before window.insights.chrome
                // detect isProd manually here
                disabled: window.location.hostname === 'access.redhat.com',
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
                        reload: 'approval'
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
                title: 'Settings',
                subItems: [
                    {
                        id: 'sources',
                        title: 'Catalog',
                        reload: 'sources'
                    },
                    {
                        id: 'rbac',
                        title: 'User management',
                        reload: 'settings/rbac'
                    }
                ]
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
        disabled: window.location.hostname === 'access.redhat.com',
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
        title: 'Vulnerabilities'
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
        disabled: window.location.hostname === 'access.redhat.com'
    },
    {
        id: 'remediations',
        title: 'Remediations'
    },
    {
        id: 'uhc',
        title: 'UHC',
        disabled: window.location.hostname === 'access.redhat.com'
    },
    {
        id: 'drift',
        title: 'System Comparison',
        disabled: window.location.hostname === 'access.redhat.com'
    },
    {
        id: 'tower-analytics',
        title: 'Tower Analytics',
        disabled: window.location.hostname === 'access.redhat.com'
    }
]);
