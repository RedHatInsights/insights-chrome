import setDependencies from '../externalDependencies';
import RenderWrapper from './RenderWrapper';
import { SystemCvesStore } from '@redhat-cloud-services/frontend-components-inventory-vulnerabilities/dist/esm/SystemCvesStore';
// import { SystemAdvisoryListStore } from '@redhat-cloud-services/frontend-components-inventory-patchman/dist/esm';
import systemProfileStore from '@redhat-cloud-services/frontend-components-inventory-general-info/esm/systemProfileStore';
const isEnabled = () => {
    return window.localStorage.getItem('chrome:inventory:experimental_detail') !== undefined;
};

export default (dependencies) => {
    setDependencies(dependencies);

    return import('../inventoryStyles').then(
        () => import('@redhat-cloud-services/frontend-components-inventory').then(data => {
            return {
                ...data,
                inventoryConnector: (store) => data.inventoryConnector(store, isEnabled ? {
                    componentMapper: RenderWrapper,
                    appList: [
                        { title: 'General information', name: 'general_information' },
                        { title: 'Advisor', name: 'advisor' },
                        { title: 'Vulnerability', name: 'vulnerabilities' },
                        { title: 'Compliance', name: 'compliance' },
                        { title: 'Patch', name: 'patch' }
                    ]
                } : undefined),
                mergeWithDetail: (redux) => ({
                    ...data.mergeWithDetail(redux),
                    SystemCvesStore,
                    systemProfileStore
                    // SystemAdvisoryListStore
                })
            };
        })
    );
};
