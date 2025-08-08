import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UnauthedHeader from '../UnAuthtedHeader';

describe('unauthed', () => {
  it('should render correctly', () => {
    const { container } = render(
      <MemoryRouter>
        <UnauthedHeader />
      </MemoryRouter>
    );
    expect(container.querySelector('div')).toMatchSnapshot();
  });
});
