import setDependencies from '../externalDependencies';
import accountNumbers from './accountNumbers.json';

const isEnabled = async () => {
    const isExperimentalEnabled = window.localStorage.getItem('chrome:inventory:experimental_detail');
    const { identity } = await insights.chrome.auth.getUser();
    return isExperimentalEnabled !== undefined ||
        // eslint-disable-next-line camelcase
        (accountNumbers.includes(identity?.internal?.account_id) && isExperimentalEnabled !== 'false');
};

export default async (dependencies) => {
    setDependencies(dependencies);

    await import('../inventoryStyles');
    const invData = await import('@redhat-cloud-services/frontend-components-inventory');
    const { SystemAdvisoryListStore } = await import(
        '@redhat-cloud-services/frontend-components-inventory-patchman/dist/cjs/SystemAdvisoryListStore'
    );
    const { SystemCvesStore } = await import(
        '@redhat-cloud-services/frontend-components-inventory-vulnerabilities/dist/cjs/SystemCvesStore'
    );
    const systemProfileStore = await import(
        '@redhat-cloud-services/frontend-components-inventory-general-info/cjs/systemProfileStore'
    );
    const RenderWrapper = await import('./RenderWrapper');

    const isDetailsEnabled = await isEnabled();
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
        } : undefined),
        mergeWithDetail: (redux) => ({
            ...invData.mergeWithDetail(redux),
            ...isDetailsEnabled && {
                SystemCvesStore,
                systemProfileStore: systemProfileStore.default,
                SystemAdvisoryListStore
            }
        })
    };
};
