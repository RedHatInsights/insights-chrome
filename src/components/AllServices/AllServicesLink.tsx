import React, { useMemo } from 'react';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';

import classNames from 'classnames';
import { matchPath } from 'react-router-dom';

import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';

import ChromeLink from '../ChromeLink';
import { useAtomValue } from 'jotai';
import { moduleRoutesAtom } from '../../state/atoms/chromeModuleAtom';

interface AllServicesLinkProps {
  href?: string;
  title?: string;
  sectionTitle?: string;
  bundleTitle?: string;
  isExternal?: boolean;
  category?: string;
  group?: string;
}

const AllServicesLink = ({ href, title, sectionTitle, bundleTitle, isExternal = false }: AllServicesLinkProps) => {
  const moduleRoutes = useAtomValue(moduleRoutesAtom);
  // Find service appId
  const appId = useMemo(() => {
    return moduleRoutes.find(({ path }) => matchPath(path, href ? href : '') || matchPath(`${path}/*`, href ? href : ''))?.scope;
  }, [moduleRoutes, href]);

  return (
    <Content component={ContentVariants.p} className={classNames('chr-c-favorite-trigger')}>
      <Flex display={{ default: 'inlineFlex' }} gap={{ default: 'gapXs' }}>
        <FlexItem>
          <ChromeLink style={{ textDecoration: 'none' }} appId={appId} isExternal={isExternal} href={href ?? '#'} data-ouia-component-id={`${title}`}>
            {title}
            {isExternal && (
              <Icon className="pf-v6-u-ml-sm chr-c-icon-external-link" isInline>
                <ExternalLinkAltIcon />
              </Icon>
            )}
          </ChromeLink>
        </FlexItem>
        <FlexItem>
          <div className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle">
            {sectionTitle} {sectionTitle && bundleTitle ? `>` : ''}{' '}
          </div>
        </FlexItem>
        <FlexItem>
          <div className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle">{bundleTitle}</div>
        </FlexItem>
      </Flex>
    </Content>
  );
};

export default AllServicesLink;
