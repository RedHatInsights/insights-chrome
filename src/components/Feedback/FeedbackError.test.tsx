import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider, useIntl } from 'react-intl';
import FeedbackError from './FeedbackError';
import messages from '../../locales/Messages';

jest.unmock('react-intl');

const BugDescriptionMessage = () => {
  const intl = useIntl();
  return (
    <p>
      {intl.formatMessage(messages.describeReportBugWithSupportCaseLink, {
        SupportCaseLink: (chunks) => <a href="/support">{chunks}</a>,
      })}
    </p>
  );
};

describe('FeedbackError', () => {
  it('renders the complete request guidance with the support link', () => {
    render(
      <IntlProvider locale="en">
        <FeedbackError onCloseModal={jest.fn()} />
      </IntlProvider>
    );

    const supportLink = screen.getByRole('link', { name: 'Red Hat support' });
    expect(supportLink.closest('p')).toHaveTextContent(
      'There was a problem processing the request. Try reloading the page. If the problem persists, contact Red Hat support.'
    );
    expect(supportLink.textContent).toBe('Red Hat support');
    expect(supportLink).toHaveAttribute('href', 'https://access.redhat.com/support/cases/#/case/new/get-support?caseCreate=true&source=console');
    expect(supportLink).toHaveAttribute('target', '_blank');
    expect(supportLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('keeps terminal punctuation outside the support-case link', () => {
    render(
      <IntlProvider locale="en">
        <BugDescriptionMessage />
      </IntlProvider>
    );

    const supportCaseLink = screen.getByRole('link', { name: 'Open a support case' });
    expect(supportCaseLink.textContent).toBe('Open a support case');
    expect(supportCaseLink.nextSibling?.textContent).toBe('.');
    expect(supportCaseLink.parentElement).toHaveTextContent(
      'Describe the bug you encountered. Include where it is located and what action caused it. If this issue is urgent or blocking your workflow, Open a support case.'
    );
  });
});
