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
                title: 'Playbooks'
            },
            {
                title: 'Settings',
                subItems: [
                    {
                        id: 'webhooks',
                        title: 'Webhooks',
                        reload: 'webhooks'
                    }
                ]
            }
        ]
    },
    rhcs: {
        title: 'Red Hat Enterprise Linux management services',
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
                title: 'System Comparison',
                disabled: window.location.hostname === 'access.redhat.com'
            },
            {
                id: 'inventory',
                title: 'Inventory'
            },
            {
                id: 'remediations',
                title: 'Playbooks'
            }

        ]
    },
    uhc: {
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
    hcm: {
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
        disabled: window.location.hostname === 'access.redhat.com'
    },
    {
        id: 'remediations',
        title: 'Playbooks'
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
