import React from 'react';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';

import './SearchDescription.scss';
import parseHighlights from './parseHighlight';

const SearchDescription = ({ description, highlight = [] }: { highlight?: string[]; description: string }) => {
  const parsedDescription = parseHighlights(description, highlight);
  return (
    <Content>
      <Content
        component="small"
        className="chr-c-search__item__description pf-v6-u-color-100 pf-v6-u-text-break-word"
        dangerouslySetInnerHTML={{ __html: parsedDescription }}
      ></Content>
    </Content>
  );
};

export default SearchDescription;
