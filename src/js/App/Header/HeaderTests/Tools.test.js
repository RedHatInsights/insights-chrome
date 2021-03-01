import React from 'react';
import Tools, { switchRelease } from '../Tools';
import { render, act } from '@testing-library/react';

jest.mock('../UserToggle', () => () => '<UserToggle />');
jest.mock('../ToolbarToggle', () => () => '<ToolbarToggle />');

describe('Tools', () => {
  it('should render correctly', async () => {
    const mockClick = jest.fn();
    let container;
    await act(async () => {
      container = render(<Tools onClick={mockClick} />).container;
    });
    expect(container.querySelector('div')).toMatchSnapshot();
  });

  it('should switch release correctly', () => {
    expect(switchRelease(true, '/beta/settings/rbac')).toEqual(`${document.baseURI}settings/rbac`);
    expect(switchRelease(false, '/settings/rbac')).toEqual(`${document.baseURI}beta/settings/rbac`);
  });
});
