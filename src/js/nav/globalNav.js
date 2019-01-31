export default Object.freeze([
    {
        id: 'dashboard',
        title: 'Dashboard'
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
        id: 'security',
        title: 'Security',
        subItems: [
            {
                id: 'vulnerability',
                title: 'Vulnerability',
                reload: 'vulnerability'
            },
            {
                id: 'compliance',
                title: 'Compliance',
                reload: 'compliance'
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
                id: 'aws',
                title: 'Cloud Cost'
            },
            {
                id: 'ocp',
                title: 'OpenShift Charge'
            }
        ]
    },
    {
        id: 'service-portal',
        title: 'Catalog',
        // nav is built before window.insights.chrome
        // detect isProd manually here
        disabled: window.location.hostname === 'access.redhat.com'
    },
    {
        id: 'inventory',
        title: 'Inventory'
    },
    {
        id: 'topological-inventory',
        title: 'Topological Inventory',
        disabled: window.location.hostname === 'access.redhat.com'
    },
    {
        id: 'remediations',
        title: 'Playbooks'
    }
]);
