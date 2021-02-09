import React from 'react';
import Tools from '../Tools';
import { render, act } from '@testing-library/react';

jest.mock('../UserToggle', () => () => '<UserToggle />');
jest.mock('../ToolbarToggle', () => () => '<ToolbarToggle />');
jest.mock('../InsightsAbout', () => () => '<InsightsAbout />');

describe('Tools', () => {
  it('should render correctly', async () => {
    const mockClick = jest.fn();
    let container;
    await act(async () => {
      container = render(<Tools onClick={mockClick} />).container;
    });
    expect(container.querySelector('div')).toMatchSnapshot();
  });
});
