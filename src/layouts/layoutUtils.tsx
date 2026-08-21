import React from 'react';

/**
 * Places an optional horizontal subnav as a sibling of the masthead — making
 * both direct children of PF6's `.pf-v6-c-page` grid container. This keeps the
 * subnav *outside* the page card (unlike PF6's built-in `horizontalSubnav` prop,
 * which renders inside `.pf-v6-c-page__main`).
 *
 * The subnav itself is responsible for the `chr-c-page-subnav` class (grid
 * placement). Passing a component that renders `null` therefore leaves no empty
 * wrapper in the grid.
 */
export function withHorizontalSubnav(masthead: React.ReactNode, horizontalSubnav?: React.ReactNode): React.ReactNode {
  if (!horizontalSubnav) {
    return masthead;
  }

  return (
    <>
      {masthead}
      {horizontalSubnav}
    </>
  );
}
