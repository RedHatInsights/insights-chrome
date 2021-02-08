import React from 'react';
import AsyncInventory from './AsyncInventory';

const BaseAppInfo = (props) => <AsyncInventory componentName="AppInfo" {...props} />;

const AppInfo = React.forwardRef((props, ref) => <BaseAppInfo innerRef={ref} {...props} />);

export default AppInfo;
