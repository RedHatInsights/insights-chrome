import React, { Fragment, VoidFunctionComponent } from 'react';
import { Text, TextContent } from '@patternfly/react-core';
import ArrowRightIcon from '@patternfly/react-icons/dist/js/icons/arrow-right-icon';
import ChromeLink from '../ChromeLink/ChromeLink';

import './product-card.scss';

export type ProductCardProps = {
  img: string;
  description: React.ReactNode;
  order: number;
  link: {
    label: React.ReactNode;
    href: string;
    appId: string;
  };
};

const ProductCard: VoidFunctionComponent<ProductCardProps> = ({ img, description, link, order }) => {
  return (
    <Fragment>
      <div className={`chr-c-product-card__title title-${order}`}>
        <img className="chr-c-product-card__image" src={img} />
      </div>
      <div className={`chr-c-product-card__body body-${order}`}>
        <TextContent>
          <Text>{description}</Text>
        </TextContent>
      </div>
      <div className={`chr-c-product-card__footer footer-${order}`}>
        <ChromeLink className="chr-c-product-card__link" href={link.href} appId={link.appId}>
          {link.label}&nbsp;
          <ArrowRightIcon className="pf-u-ml-sm" />
        </ChromeLink>
      </div>
    </Fragment>
  );
};

export default ProductCard;
