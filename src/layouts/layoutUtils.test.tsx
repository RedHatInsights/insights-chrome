import React from 'react';
import { render, screen } from '@testing-library/react';
import { withHorizontalSubnav } from './layoutUtils';

describe('withHorizontalSubnav', () => {
  it('returns masthead as-is when no horizontalSubnav provided', () => {
    const masthead = <div data-testid="masthead">Masthead</div>;
    const result = withHorizontalSubnav(masthead);
    const { container } = render(<>{result}</>);
    expect(screen.getByTestId('masthead')).toBeInTheDocument();
    expect(container.querySelector('.chr-c-page-subnav')).toBeNull();
  });

  it('returns masthead as-is when horizontalSubnav is undefined', () => {
    const masthead = <div data-testid="masthead">Masthead</div>;
    const result = withHorizontalSubnav(masthead, undefined);
    const { container } = render(<>{result}</>);
    expect(screen.getByTestId('masthead')).toBeInTheDocument();
    expect(container.querySelector('.chr-c-page-subnav')).toBeNull();
  });

  it('wraps masthead with subnav sibling when horizontalSubnav provided', () => {
    const masthead = <div data-testid="masthead">Masthead</div>;
    const subnav = <nav data-testid="subnav">Subnav</nav>;
    const result = withHorizontalSubnav(masthead, subnav);
    const { container } = render(<>{result}</>);

    expect(screen.getByTestId('masthead')).toBeInTheDocument();
    expect(screen.getByTestId('subnav')).toBeInTheDocument();

    const subnavWrapper = container.querySelector('.chr-c-page-subnav');
    expect(subnavWrapper).toBeInTheDocument();
    expect(subnavWrapper).toContainElement(screen.getByTestId('subnav'));
  });

  it('renders masthead before subnav wrapper in DOM order', () => {
    const masthead = <div data-testid="masthead">Masthead</div>;
    const subnav = <nav data-testid="subnav">Subnav</nav>;
    const result = withHorizontalSubnav(masthead, subnav);
    const { container } = render(<div>{result}</div>);

    const children = Array.from(container.firstElementChild!.children);
    expect(children).toHaveLength(2);
    expect(children[0]).toHaveAttribute('data-testid', 'masthead');
    expect(children[1]).toHaveClass('chr-c-page-subnav');
  });
});
