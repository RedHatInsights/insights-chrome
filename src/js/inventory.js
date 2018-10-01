export let PFReactCore;
export let React;
export let PFReactIcons;
export let ReactRouterDOM;

export default ({ react, reactRouterDom, reactCore, reactIcons }) => {
    PFReactCore = reactCore;
    React = react;
    PFReactIcons = reactIcons;
    ReactRouterDOM = reactRouterDom;
    return import('./inventoryStyles').then(
        () => import('@red-hat-insights/insights-frontend-components/components/Inventory')
    );
};
