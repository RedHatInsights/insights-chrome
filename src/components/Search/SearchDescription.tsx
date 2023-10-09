import React from 'react';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';

import './SearchDescription.scss';

const SearchDescription = ({ description }: { description: string }) => {
  return (
    <TextContent>
      <Text
        component="small"
        className="chr-c-search__item__description pf-v5-u-color-100 pf-v5-u-text-break-word"
        dangerouslySetInnerHTML={{ __html: description }}
      ></Text>
    </TextContent>
  );
};

export default SearchDescription;
