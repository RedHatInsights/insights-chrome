import setDependencies from '../externalDependencies';

const isEnabled = () => {
    return window.localStorage.getItem('chrome:inventory:experimental_detail') !== undefined;
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

    return {
        ...invData,
        inventoryConnector: (store) => invData.inventoryConnector(store, isEnabled() ? {
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
            ...isEnabled() && {
                SystemCvesStore,
                systemProfileStore: systemProfileStore.default,
                SystemAdvisoryListStore
            }
        })
    };
};
