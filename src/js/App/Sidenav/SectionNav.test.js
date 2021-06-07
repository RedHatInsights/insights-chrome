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
    const props = { section: 'section1', activeLocation: 'loc', onClick: jest.fn(), items: [{ id: 'app', title: 'title' }] };
    const { container } = render(<SectionNav {...props} />);
    expect(container).toMatchSnapshot();
  });
  it('should render group with app and sub app', () => {
    const props = {
      section: 'section1',
      activeLocation: 'loc',
      onClick: jest.fn(),
      items: [{ id: 'app', title: 'title', subItems: [{ id: 'subapp', title: 'title2' }] }],
    };
    const { container } = render(<SectionNav {...props} />);
    expect(container).toMatchSnapshot();
  });
  it('should render group with app, sub app and custom url', () => {
    const props = {
      section: 'section1',
      activeLocation: 'loc',
      onClick: jest.fn(),
      items: [{ id: 'app', title: 'title', subItems: [{ id: 'subapp', title: 'title2', navigate: 'example.url.com' }] }],
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
  it('should render app with subapp without group', () => {
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
  it('should render app with subapp and custom url, but without group ', () => {
    const props = {
      id: 'app',
      title: 'title',
      activeLocation: 'loc',
      onClick: jest.fn(),
      subItems: [{ id: 'subapp', title: 'title2' }],
      navigate: 'example.url.com',
    };
    const { container } = render(<SectionNav {...props} />);
    expect(container).toMatchSnapshot();
  });
});
