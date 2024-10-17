import React, { useEffect, useState } from 'react';
import './SearchFeedback.scss';

import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import OutlinedThumbsUpIcon from '@patternfly/react-icons/dist/dynamic/icons/outlined-thumbs-up-icon';
import OutlinedThumbsDownIcon from '@patternfly/react-icons/dist/dynamic/icons/outlined-thumbs-down-icon';
import { MenuGroup, MenuItem } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { useSegment } from '../../analytics/useSegment';
import type { SearchItem } from './SearchTypes';

export const SEARCH_FEEDBACK_POSITIVE = 'chrome.search-query-feedback-positive';
export const SEARCH_FEEDBACK_NEGATIVE = 'chrome.search-query-feedback-negative';

export type SearchFeedbackType = typeof SEARCH_FEEDBACK_POSITIVE | typeof SEARCH_FEEDBACK_NEGATIVE | undefined;

export type SearchFeedbackProps = {
  query: string;
  results: SearchItem[];
  feedbackType?: SearchFeedbackType;
  onFeedbackSubmitted?: (type: SearchFeedbackType) => void;
};

const SearchFeedback = ({ query, results, feedbackType, onFeedbackSubmitted }: SearchFeedbackProps) => {
  const { ready, analytics } = useSegment();
  const [error, setError] = useState<boolean>(false);
  const [inFlight, setInFlight] = useState<boolean>(false);
  const [currentFeedbackType, setcurrentFeedbackType] = useState<SearchFeedbackType>(feedbackType);

  useEffect(() => {
    setcurrentFeedbackType(feedbackType);
  }, [feedbackType]);

  const trackFeedback = (type: SearchFeedbackType) => {
    if (!ready || !analytics || inFlight) {
      return;
    }

    setInFlight(true);
    // even if the track API call fails - the analytics API resolves the promise with the context and no indication of failure (retries internally)
    analytics
      .track(type as string, { query, results })
      .then(() => {
        setcurrentFeedbackType(type);
        onFeedbackSubmitted?.(type);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => {
        setInFlight(false);
      });
  };

  // TODO move these for translation
  let label = 'Are these results helpful?';
  if (currentFeedbackType) {
    label = 'Thank you for your feedback!';
  } else if (error) {
    label = 'Something went wrong. Please try again.';
  }

  return (
    <MenuGroup className="chr-c-search-feedback pf-v6-u-px-md" label={label}>
      <MenuItem className="pf-v6-u-px-xs" isDisabled={!!currentFeedbackType} onClick={() => trackFeedback(SEARCH_FEEDBACK_POSITIVE)}>
        <Icon isInline>
          <OutlinedThumbsUpIcon className={currentFeedbackType === SEARCH_FEEDBACK_POSITIVE ? 'pf-v6-u-active-color-100' : 'pf-v6-u-color-200'} />
        </Icon>
      </MenuItem>
      <MenuItem className="pf-v6-u-px-xs" isDisabled={!!currentFeedbackType} onClick={() => trackFeedback(SEARCH_FEEDBACK_NEGATIVE)}>
        <Icon isInline>
          <OutlinedThumbsDownIcon className={currentFeedbackType === SEARCH_FEEDBACK_NEGATIVE ? 'pf-v6-u-active-color-100' : 'pf-v6-u-color-200'} />
        </Icon>
      </MenuItem>
    </MenuGroup>
  );
};

export default SearchFeedback;
