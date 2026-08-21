import React from 'react';

/**
 * Wraps a masthead element with an optional horizontal subnav placed as a
 * sibling — making both direct children of PF6's `.pf-v6-c-page` grid
 * container. This keeps the subnav *outside* the page card (unlike PF6's
 * built-in `horizontalSubnav` prop, which renders inside `.pf-v6-c-page__main`).
 *
 * The subnav `<div>` uses the `chr-c-page-subnav` class so it can be placed
 * into a named "subnav" grid area defined by the layout's stylesheet.
 */
export function withHorizontalSubnav(masthead: React.ReactNode, horizontalSubnav?: React.ReactNode): React.ReactNode {
  if (!horizontalSubnav) {
    return masthead;
  }

  return (
    <>
      {masthead}
      <div className="chr-c-page-subnav">{horizontalSubnav}</div>
    </>
  );
}
