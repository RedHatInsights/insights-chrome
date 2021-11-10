import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AsyncComponent from '@redhat-cloud-services/frontend-components/AsyncComponent';
import Deffered from '@redhat-cloud-services/frontend-components-utilities/Deffered';

const RenderWrapper = ({ promise, onClose, ...props }) => {
  const [isModalOpen, setIsModalOpen] = useState();
  const [{ data, basePath }, setConfig] = useState({});

  useEffect(() => {
    (async () => {
      const config = await promise;
      setConfig(config);
      setIsModalOpen(true);
    })();
  }, []);
  return (
    <Fragment>
      {isModalOpen && (
        <AsyncComponent
          setOpen={(isOpen) => {
            setIsModalOpen(isOpen);
            const deffered = new Deffered();
            onClose(deffered);
            (async () => {
              const config = await deffered.promise;
              setConfig(config);
              setIsModalOpen(true);
            })();
          }}
          appName="remediations"
          module="./RemediationWizard"
          data={data}
          basePath={basePath}
          {...props}
        />
      )}
    </Fragment>
  );
};

RenderWrapper.propTypes = {
  promise: PropTypes.shape({
    then: PropTypes.func,
  }),
  onClose: PropTypes.func,
};

export default RenderWrapper;
