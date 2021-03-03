import React from 'react';
import AsyncInventory from './AsyncInventory';

const BaseInventoryTable = (props) => <AsyncInventory componentName="InventoryTable" {...props} />;

const InventoryTable = React.forwardRef((props, ref) => <BaseInventoryTable innerRef={ref} {...props} />);

export default InventoryTable;
