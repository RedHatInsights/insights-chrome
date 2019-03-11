export let ReactRouterDOM;
export let PFReact;

export default function setDependencies({ reactRouterDom, pfReact }) {
    ReactRouterDOM = reactRouterDom || ReactRouterDOM;
    PFReact = pfReact || PFReact;
}
