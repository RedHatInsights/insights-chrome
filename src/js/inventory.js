import setDependencies from './externalDependencies';

export default (dependencies) => {
    setDependencies(dependencies);

    return import('./inventoryStyles').then(
        () => import('@redhat-cloud-services/frontend-components-inventory')
    );
};
