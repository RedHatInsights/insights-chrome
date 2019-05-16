export let ReactRouterDOM;
export let PFReact;
export let PFReactTable;

export default function setDependencies({ reactRouterDom, pfReact, pfReactTable }) {
    ReactRouterDOM = reactRouterDom || ReactRouterDOM;
    PFReact = pfReact || PFReact;
    PFReactTable = pfReactTable || PFReactTable;
}
