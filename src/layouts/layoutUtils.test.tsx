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

  it('places subnav as a sibling of the masthead when provided', () => {
    const masthead = <div data-testid="masthead">Masthead</div>;
    const subnav = <nav data-testid="subnav">Subnav</nav>;
    const result = withHorizontalSubnav(masthead, subnav);

    render(<>{result}</>);

    expect(screen.getByTestId('masthead')).toBeInTheDocument();
    expect(screen.getByTestId('subnav')).toBeInTheDocument();
  });

  it('renders masthead before subnav in DOM order', () => {
    const masthead = <div data-testid="masthead">Masthead</div>;
    const subnav = (
      <nav className="chr-c-page-subnav" data-testid="subnav">
        Subnav
      </nav>
    );
    const result = withHorizontalSubnav(masthead, subnav);
    const { container } = render(<div>{result}</div>);

    const children = Array.from(container.firstElementChild!.children);
    expect(children).toHaveLength(2);
    expect(children[0]).toHaveAttribute('data-testid', 'masthead');
    expect(children[1]).toHaveAttribute('data-testid', 'subnav');
  });

  it('does not leave an empty wrapper when subnav component renders null', () => {
    const masthead = <div data-testid="masthead">Masthead</div>;
    const NullSubnav = () => null;
    const result = withHorizontalSubnav(masthead, <NullSubnav />);
    const { container } = render(<div>{result}</div>);

    expect(screen.getByTestId('masthead')).toBeInTheDocument();
    expect(container.querySelector('.chr-c-page-subnav')).toBeNull();
    expect(container.firstElementChild!.children).toHaveLength(1);
  });
});
