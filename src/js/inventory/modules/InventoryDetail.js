import React from 'react';
import AsyncInventory from './AsyncInventory';

const BaseInventoryDetail = (props) => <AsyncInventory componentName="InventoryDetail" {...props} />;

const InventoryDetail = React.forwardRef((props, ref) => <BaseInventoryDetail innerRef={ref} {...props} />);

export default InventoryDetail;
