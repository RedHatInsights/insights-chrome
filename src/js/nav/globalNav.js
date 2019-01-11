export default Object.freeze([{
    id: 'dashboard',
    title: 'Dashboard'
}, {
    id: 'advisor',
    title: 'Advisor',
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
}, {
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
}, {
    id: 'remediations',
    title: 'Remediations'
}, {
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
}, {
    id: 'inventory',
    title: 'Inventory'
}, {
    id: 'reports',
    title: 'Reports'
}, {
    id: 'service-portal',
    title: 'Service Portal'
}, {
    id: 'subscriptions',
    title: 'Subscriptions'
}, {
    id: 'settings',
    title: 'Settings'
}]);
