export let PFReactCore;
export let React;
export let PFReactIcons;
export let ReactRouterDOM;

export default function setDependencies ({ react, reactRouterDom, reactCore, reactIcons }) {
    PFReactCore = reactCore || PFReactCore;
    React = react || React;
    PFReactIcons = reactIcons || PFReactIcons;
    ReactRouterDOM = reactRouterDom || ReactRouterDOM;
}
