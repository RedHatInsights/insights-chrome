import setDependencies from '../externalDependencies';
import accountNumbers from './accountNumbers.json';

const isEnabled = async () => {
    const isExperimentalEnabled = window.localStorage.getItem('chrome:inventory:experimental_detail');
    const { identity } = await insights.chrome.auth.getUser();
    return (isExperimentalEnabled && isExperimentalEnabled !== 'false') ||
        // eslint-disable-next-line camelcase
        (accountNumbers.includes(identity?.internal?.account_id) && isExperimentalEnabled !== 'false');
};

const isDrawerEnabled = () => {
    const drawerEnabled = window.localStorage.getItem('chrome:inventory:experimental_drawer');
    return Boolean(drawerEnabled);
};

export default async (dependencies) => {
    let SystemAdvisoryListStore;
    let SystemCvesStore;
    let systemProfileStore;
    let RenderWrapper;

    setDependencies(dependencies);

    const isDetailsEnabled = await isEnabled();
    await import(/* webpackChunkName: "inventory-styles" */ '../inventoryStyles');
    const invData = await import(/* webpackChunkName: "inventory" */ '@redhat-cloud-services/frontend-components-inventory');

    if (isDetailsEnabled) {
        SystemAdvisoryListStore = await import(/* webpackChunkName: "inventory-patch-store" */
            '@redhat-cloud-services/frontend-components-inventory-patchman/dist/cjs/SystemAdvisoryListStore'
        )?.SystemAdvisoryListStore;

        SystemCvesStore = await import(/* webpackChunkName: "inventory-vuln-store" */
            '@redhat-cloud-services/frontend-components-inventory-vulnerabilities/dist/cjs/SystemCvesStore'
        )?.SystemCvesStore;
        systemProfileStore = await import(/* webpackChunkName: "inventory-gen-info-store" */
            '@redhat-cloud-services/frontend-components-inventory-general-info/cjs/systemProfileStore'
        );
        RenderWrapper = await import(/* webpackChunkName: "inventory-render-wrapper" */ './RenderWrapper');
    }

    return {
        ...invData,
        inventoryConnector: (store) => invData.inventoryConnector(store, isDetailsEnabled ? {
            componentMapper: RenderWrapper.default,
            appList: [
                { title: 'General information', name: 'general_information', pageId: 'inventory' },
                { title: 'Advisor', name: 'advisor', pageId: 'insights' },
                { title: 'Vulnerability', name: 'vulnerabilities', pageId: 'vulnerability' },
                { title: 'Compliance', name: 'compliance' },
                { title: 'Patch', name: 'patch' }
            ]
        } : undefined, isDrawerEnabled() ? RenderWrapper.default : undefined),
        mergeWithDetail: (redux) => ({
            ...invData.mergeWithDetail(redux),
            ...(isDetailsEnabled || isDrawerEnabled()) && { systemProfileStore: systemProfileStore.default },
            ...isDetailsEnabled && {
                SystemCvesStore,
                SystemAdvisoryListStore
            }
        })
    };
};
