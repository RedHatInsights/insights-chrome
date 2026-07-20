import React from 'react';
import { render } from '@testing-library/react';
import SettingsToggle from '../SettingsToggle';
import { Provider as JotaiProvider } from 'jotai';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../../state/atoms/releaseAtom', () => {
  const util = jest.requireActual('../../../state/atoms/utils');
  return {
    __esModule: true,
    isPreviewAtom: util.atomWithToggle(false),
  };
});

describe('SettingsToggle', () => {
  const dropdownItems = [
    {
      items: [
        {
          title: 'Test item',
          onClick: jest.fn(),
        },
      ],
    },
  ];

  const renderSettingsToggle = (props = {}) =>
    render(
      <MemoryRouter>
        <JotaiProvider>
          <SettingsToggle id="TestSettings" ariaLabel="Settings menu" dropdownItems={dropdownItems} {...props} />
        </JotaiProvider>
      </MemoryRouter>
    );

  it('should include chr-c-toolbar-toggle class on the toggle button', () => {
    const { container } = renderSettingsToggle();
    const toggleButton = container.querySelector('#TestSettings');
    expect(toggleButton).toBeTruthy();
    expect(toggleButton).toHaveClass('chr-c-toolbar-toggle');
  });

  it('should append additional className alongside chr-c-toolbar-toggle', () => {
    const { container } = renderSettingsToggle({ className: 'my-custom-class' });
    const toggleButton = container.querySelector('#TestSettings');
    expect(toggleButton).toHaveClass('chr-c-toolbar-toggle');
    expect(toggleButton).toHaveClass('my-custom-class');
  });
});
