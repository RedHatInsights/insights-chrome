import setDependencies from './externalDependencies';

export default function loadRemediation (dependencies) {
    setDependencies(dependencies);

    return Promise.all([
        import('@red-hat-insights/insights-frontend-components/components/Remediations'),
        import('./remediationsStyles')
    ]).then(([remediations]) => remediations);
}
