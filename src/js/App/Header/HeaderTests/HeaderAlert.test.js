import React from 'react';
import { render } from '@testing-library/react';
import HeaderAlert from '../HeaderAlert';

describe('HeaderAlert', () => {
  it('should render correctly not dismissable', () => {
    const { container } = render(<HeaderAlert title="test" dismissDelay={0} />);
    expect(container.querySelector('div')).toMatchSnapshot();
  });

  it('should render correctly dismissable', () => {
    const onAppear = jest.fn();
    const { container } = render(<HeaderAlert title="test" dismissable={true} onAppear={onAppear} />);
    expect(container.querySelector('div')).toMatchSnapshot();
    expect(onAppear).toHaveBeenCalledTimes(1);
  });
});
