import setDependencies from './externalDependencies';

const asyncLoader = (imports, callback = ([cmp]) => cmp) => {
    return (dependencies) => {
        setDependencies(dependencies);

        return Promise.all(imports).then(callback);
    };
};

export default {
    loadVulnerabilities: asyncLoader([
        import('@red-hat-insights/insights-frontend-components/components/Vulnerabilities'),
        import('./vulnerabilityStyles')
    ]),
    loadAdvisor: asyncLoader([
        import('@red-hat-insights/insights-frontend-components/components/Advisor'),
        import('./advisorStyles')
    ]),
    loadCompliance: asyncLoader([
        import('@red-hat-insights/insights-frontend-components/components/Compliance'),
        import('./complianceStyles')
    ])
};
