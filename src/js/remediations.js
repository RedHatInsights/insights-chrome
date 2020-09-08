import setDependencies from './externalDependencies';

export default function loadRemediation (dependencies) {
    setDependencies(dependencies);

    return Promise.all([
        import(/* webpackChunkName: "remediations" */ '@redhat-cloud-services/frontend-components-remediations'),
        import(/* webpackChunkName: "remediation-styles" */ './remediationsStyles')
    ]).then(([remediations]) => remediations);
}
