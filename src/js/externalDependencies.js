export let PFReactCore;
export let React;
export let PFReactIcons;
export let ReactRouterDOM;

export default function setDependencies ({ react, reactRouterDom, reactCore, reactIcons }) {
    PFReactCore = reactCore;
    React = react;
    PFReactIcons = reactIcons;
    ReactRouterDOM = reactRouterDom;
}
