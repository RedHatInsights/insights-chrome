document.addEventListener("DOMContentLoaded", function (event) {
    const menu = {
        'dashboard': {
            url: '/insights/dashboard/map'
        },
        'advisor': {
            url: '/insights/advisor'
        },
        'security': {
            url: '/insights/security'
        },
        'compliance': {
            url: '/insights/compliance'
        },
        'cmaas': {
            url: '/insights/cmaas'
        },
        'vmaas': {
            url: '/insights/vmaas'
        },
        'inventory': {
            url: '/insights/deployments'
        },
        'reports': {
            url: '/insights/reports'
        },
        'settings': {
            url: '/insights/settings'
        }
    };

    let selectedMenu = Object.keys(menu).filter(oneKey => menu[oneKey].url === location.pathname)[0];

    function makeActive(menuItem) {
        selectedMenu = menuItem;
        document.getElementById(selectedMenu).classList.add('active');
    }

    makeActive(selectedMenu);

    window.selectOption = (menuItem) => {
        makeActive(selectedMenu);
        window.location.href = menu[menuItem].url;
    };
});