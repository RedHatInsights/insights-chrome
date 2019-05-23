import setDependencies from './externalDependencies';

export default function loadRemediation (dependencies) {
    setDependencies(dependencies);

    return Promise.all([
        import('@redhat-cloud-services/frontend-components-remediations'),
        import('./remediationsStyles')
    ]).then(([remediations]) => remediations);
}
