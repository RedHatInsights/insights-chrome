import React from 'react';
import ReactDOM from 'react-dom';
import { rootApp } from './chrome/entry';

window.React = React;
window.ReactDOM = ReactDOM;

rootApp();
