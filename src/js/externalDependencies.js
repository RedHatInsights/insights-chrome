export let ReactRouterDOM;
export let PFReact;
export let PFReactTable;
export let customReact;
export let reactRedux;
export let PFReactCore;

export default function setDependencies({ reactRouterDom, pfReact, pfReactTable, React, react, ReactRedux }) {
    ReactRouterDOM = reactRouterDom || ReactRouterDOM;
    PFReact = pfReact || PFReact;
    PFReactTable = pfReactTable || PFReactTable || {};
    PFReactCore = pfReact || PFReactCore;
    customReact = React || react || customReact;
    reactRedux = ReactRedux || reactRedux;
}
