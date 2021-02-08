import React from 'react';
import AsyncInventory from './AsyncInventory';

const BaseDetailWrapper = (props) => <AsyncInventory componentName="DetailWrapper" {...props} />;

const DetailWrapper = React.forwardRef((props, ref) => <BaseDetailWrapper innerRef={ref} {...props} />);

export default DetailWrapper;
