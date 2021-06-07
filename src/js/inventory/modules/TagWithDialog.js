import React from 'react';
import AsyncInventory from './AsyncInventory';

const BaseTagWithDialog = (props) => <AsyncInventory componentName="TagWithDialog" {...props} />;

const TagWithDialog = React.forwardRef((props, ref) => <BaseTagWithDialog innerRef={ref} {...props} />);

export default TagWithDialog;
