import React from 'react';
import { render, screen } from '@testing-library/react';
import SettingsToggle, { SettingsToggleProps } from '../SettingsToggle';
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
  const dropdownItems: SettingsToggleProps['dropdownItems'] = [
    {
      items: [
        {
          title: 'Test item',
          onClick: jest.fn(),
        },
      ],
    },
  ];

  const renderSettingsToggle = (props: Partial<SettingsToggleProps> = {}) =>
    render(
      <MemoryRouter>
        <JotaiProvider>
          <SettingsToggle id="TestSettings" ariaLabel="Settings menu" dropdownItems={dropdownItems} {...props} />
        </JotaiProvider>
      </MemoryRouter>
    );

  it('should include chr-c-toolbar-toggle class on the toggle button', () => {
    renderSettingsToggle();
    const toggleButton = screen.getByRole('button', { name: 'Settings menu' });
    expect(toggleButton).toHaveClass('chr-c-toolbar-toggle');
  });

  it('should append additional className alongside chr-c-toolbar-toggle', () => {
    renderSettingsToggle({ className: 'my-custom-class' });
    const toggleButton = screen.getByRole('button', { name: 'Settings menu' });
    expect(toggleButton).toHaveClass('chr-c-toolbar-toggle');
    expect(toggleButton).toHaveClass('my-custom-class');
  });
});
