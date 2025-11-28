import React from 'react';
import { useIntl } from 'react-intl';
import messages from '../../locales/Messages';
import { FilterMenuItemOnChange } from '@redhat-cloud-services/frontend-components/ConditionalFilter/groupFilterConstants';
import { Group } from '@redhat-cloud-services/frontend-components/ConditionalFilter';
import { GroupFilter } from '@redhat-cloud-services/frontend-components/ConditionalFilter';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { InputGroup } from '@patternfly/react-core/dist/dynamic/components/InputGroup';
import { InputGroupItem } from '@patternfly/react-core/dist/dynamic/components/InputGroup';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import { PopoverPosition } from '@patternfly/react-core/dist/dynamic/components/Popover';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/outlined-question-circle-icon';
import { FlagTagsFilter } from '../../@types/types';

export type GroupFilterInputGroupProps = {
  isDisabled: boolean;
  filter: {
    filterBy?: string | number;
    onFilter?: (value: string) => void;
    groups?: Group[];
    onChange: FilterMenuItemOnChange;
  };
  setIsOpen: (callback?: ((origValue?: boolean) => void) | boolean) => void;
  hotjarEventEmitter?: ((eventType: string, eventName: string) => void) | (() => void);
  selectedTags: FlagTagsFilter;
};

const GroupFilterInputGroup: React.FunctionComponent<GroupFilterInputGroupProps> = ({ filter, isDisabled, selectedTags, setIsOpen }) => {
  const intl = useIntl();

  return (
    <InputGroup>
      <InputGroupItem>
        <GroupFilter
          className="chr-c-menu-global-filter__select"
          selected={selectedTags}
          isDisabled={isDisabled}
          groups={filter.groups}
          onChange={filter.onChange}
          placeholder={intl.formatMessage(messages.filterByTags)}
          isFilterable
          onFilter={filter.onFilter || (() => undefined)}
          filterBy={filter.filterBy as string}
          showMoreTitle={intl.formatMessage(messages.showMore)}
          onShowMore={() => setIsOpen(true)}
          showMoreOptions={{
            isLoadButton: true,
          }}
        />
      </InputGroupItem>
      <InputGroupItem>
        <Popover
          aria-label="Tags help Popover"
          position={PopoverPosition.top}
          headerContent={<div>{intl.formatMessage(messages.filterByTagsPopoverHeader)}</div>}
          bodyContent={
            <div>
              {intl.formatMessage(messages.filterByTagsPopoverContent1)}{' '}
              <a
                href="https://docs.redhat.com/en/documentation/subscription_central/1-latest/html/getting_started_with_the_subscriptions_service/proc-installing-satellite-inventory-upload-plugin_assembly-setting-up-subscriptionwatch-ctxt"
                target="_blank"
                rel="noreferrer"
              >
                {intl.formatMessage(messages.filterByTagsPopoverSatelliteLink)}
              </a>
              {intl.formatMessage(messages.filterByTagsPopoverContent2)}{' '}
              <a
                href="https://docs.redhat.com/en/documentation/red_hat_lightspeed/1-latest/html-single/client_configuration_guide_for_red_hat_lightspeed/index#proc-lightspeed-creating-custom-group-tags-yaml-file_lightspeed-cg-adding-tags"
                target="_blank"
                rel="noreferrer"
              >
                {intl.formatMessage(messages.filterByTagsPopoverCCGLink)}
              </a>{' '}
              {intl.formatMessage(messages.filterByTagsPopoverContent3)}
            </div>
          }
          appendTo={() => document.body}
        >
          <Button icon={<OutlinedQuestionCircleIcon />} variant="control" aria-label="Tags help" />
        </Popover>
      </InputGroupItem>
    </InputGroup>
  );
};

export default GroupFilterInputGroup;
