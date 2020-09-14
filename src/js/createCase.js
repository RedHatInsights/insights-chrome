import Cookies from 'js-cookie';
import * as Sentry from '@sentry/browser';
const log = require('./jwt/logger')('createCase.js');

// Register apps

export function createSupportCase(userInfo, fields) {
    log('Creating a support case');
    fetch(`https://access.${window.insights.chrome.isProd ? '' : 'qa.'}redhat.com/hydra/rest/se/sessions`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${Cookies.get('cs_jwt')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            session: {
                createdBy: `${userInfo.user.username}`,
                userAgent: 'cloud.redhat.com'
            },
            sessionDetails: {
                createdBy: `${userInfo.user.username}`,
                environment: `${window.insights.chrome.isBeta() ? 'Production Beta' : 'Production'}`,
                ...fields?.all,
                ...fields?.case
            }
        })
    })
    .then(response => response.json())
    .then(data => data
        && window.open(`https://access.${window.insights.chrome.isProd ? '' : 'qa.'}redhat.com/support/cases/${data.session.id}`)
        && createSupportSentry(data.session.id, fields))
    .catch(err => Sentry.captureException(err));
}

function createSupportSentry(session, fields) {
    if (window.insights.chrome.isProd) {
        log('Capturing support case information in Sentry');
        Sentry.captureException(new Error('Support case created'), {
            tags: {
                caseId: session,
                ...fields?.all,
                ...fields?.sentry
            }
        });
    } else {
        log('No Sentry info captured in non prod environments');
    }
}
