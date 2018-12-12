import setDependencies from './externalDependencies';

export default (dependencies) => {
    setDependencies(dependencies);

    return import('./inventoryStyles').then(
        () => import('@red-hat-insights/insights-frontend-components/components/Inventory')
    );
};
