import React from 'react';
import { render } from '@testing-library/react';
import HeaderAlert from '../HeaderAlert';

describe('HeaderAlert', () => {
  it('should render correctly not dismissable', () => {
    const { container } = render(<HeaderAlert title="test" dismissDelay={0} />);
    expect(container.querySelector('div')).toMatchSnapshot();
  });

  it('should render correctly dismissable', () => {
    const onDismiss = jest.fn();
    const { container } = render(<HeaderAlert title="test" dismissable={true} onDismiss={onDismiss} />);
    expect(container.querySelector('div')).toMatchSnapshot();
  });
});
