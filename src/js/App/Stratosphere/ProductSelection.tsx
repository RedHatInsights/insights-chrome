import React from 'react';
import { Masthead, Page } from '@patternfly/react-core';
import { Header } from '../Header/Header';

const ProductSelection = () => {
  return (
    <Page
      header={
        <Masthead className="chr-c-masthead">
          <Header />
        </Masthead>
      }
    ></Page>
  );
};

export default ProductSelection;
