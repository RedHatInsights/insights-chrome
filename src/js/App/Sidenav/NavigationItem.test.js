import React from 'react';
import NavigationItem from './NavigationItem';
import { render } from '@testing-library/react';

describe('NavigationItem', () => {
  it('should render coorectly', () => {
    const { container } = render(<NavigationItem />);
    expect(container).toMatchSnapshot();
  });
  it('parent with value and itemID undefined', () => {
    let props = { parent: 'someValue' };
    const { container } = render(<NavigationItem {...props} />);
    expect(container).toMatchSnapshot();
  });
  it('parent and itemID with value', () => {
    let props = { parent: 'someValue', itemID: 'someID' };
    const { container } = render(<NavigationItem {...props} />);
    expect(container).toMatchSnapshot();
  });
  it('parent undefined and itemID with value', () => {
    let props = { itemID: 'someID' };
    const { container } = render(<NavigationItem {...props} />);
    expect(container).toMatchSnapshot();
  });
  it('with some navigate value set', () => {
    let navigate = {};
    const { container } = render(<NavigationItem navigate={navigate} />);
    expect(container).toMatchSnapshot();
  });
});
