import React from 'react';
import AsyncInventory from './AsyncInventory';

const BaseInventoryDetailHead = (props) => <AsyncInventory componentName="InventoryDetailHead" {...props} />;

const InventoryDetailHead = React.forwardRef((props, ref) => <BaseInventoryDetailHead innerRef={ref} {...props} />);

export default InventoryDetailHead;
