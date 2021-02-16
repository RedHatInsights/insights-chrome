import React from 'react';
import SectionNav from './SectionNav';
import { render } from '@testing-library/react';

describe('SectionNav', () => {
  it('should render corectly', () => {
    const props = { id: 'id', title: 'title', activeLocation: 'loc', onClick: jest.fn() };
    const { container } = render(<SectionNav {...props} />);
    expect(container).toMatchSnapshot();
  });
  it('should render group with app', () => {
    const props = { id: 'id', title: 'title', activeLocation: 'loc', onClick: jest.fn(), items: [{ id: 'app', title: 'title' }] };
    const { container } = render(<SectionNav {...props} />);
    expect(container).toMatchSnapshot();
  });
  it('should render group with app and sub app', () => {
    const props = {
      id: 'id',
      title: 'title',
      activeLocation: 'loc',
      onClick: jest.fn(),
      items: [{ id: 'app', title: 'title', subItems: [{ id: 'subapp', title: 'title2' }] }],
    };
    const { container } = render(<SectionNav {...props} />);
    expect(container).toMatchSnapshot();
  });
  it('should render app without group', () => {
    const props = {
      id: 'app',
      title: 'title',
      activeLocation: 'loc',
      onClick: jest.fn(),
    };
    const { container } = render(<SectionNav {...props} />);
    expect(container).toMatchSnapshot();
  });
  it('should render app with subapp withou group', () => {
    const props = {
      id: 'app',
      title: 'title',
      activeLocation: 'loc',
      onClick: jest.fn(),
      subItems: [{ id: 'subapp', title: 'title2' }],
    };
    const { container } = render(<SectionNav {...props} />);
    expect(container).toMatchSnapshot();
  });
});
