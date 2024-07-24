import React from 'react';
import './SearchFeedback.scss';
import throttle from 'lodash/throttle';

import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import OutlinedThumbsUpIcon from '@patternfly/react-icons/dist/dynamic/icons/outlined-thumbs-up-icon';
import OutlinedThumbsDownIcon from '@patternfly/react-icons/dist/dynamic/icons/outlined-thumbs-down-icon';
import { MenuGroup, MenuItem } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { useSegment } from '../../analytics/useSegment';
import type { SearchItem } from './SearchTypes';
import { SegmentEvent } from '@segment/analytics-next';

export type SearchFeedbackProps = {
  query: string;
  results: SearchItem[];
};

const SearchFeedback = ({ query, results }: SearchFeedbackProps) => {
  const { ready, analytics } = useSegment();
  const trackFeedback = (type: string | SegmentEvent) => {
    ready && analytics && analytics.track(type, { query, results });
  };
  const throttledTrackFeedback = throttle(trackFeedback, 5000);
  return (
    <MenuGroup className="chr-c-search-feedback pf-v5-u-px-md" label="Are these results helpful?">
      <MenuItem className="pf-v5-u-px-xs" onClick={() => throttledTrackFeedback('chrome.search-query-feedback-positive')}>
        <Icon isInline>
          <OutlinedThumbsUpIcon className="pf-v5-u-color-200" />
        </Icon>
      </MenuItem>
      <MenuItem className="pf-v5-u-px-xs" onClick={() => throttledTrackFeedback('chrome.search-query-feedback-negative')}>
        <Icon isInline>
          <OutlinedThumbsDownIcon className="pf-v5-u-color-200" />
        </Icon>
      </MenuItem>
    </MenuGroup>
  );
};

export default SearchFeedback;
