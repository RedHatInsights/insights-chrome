import { ChromeAPI } from '@redhat-cloud-services/types';
import { createContext } from 'react';

const InternalChromeContext = createContext<ChromeAPI>({} as ChromeAPI);

export default InternalChromeContext;
