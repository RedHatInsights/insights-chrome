import { createContext } from 'react';
import { LibJWT } from '../../auth';

const LibtJWTContext = createContext<LibJWT>({} as LibJWT);

export default LibtJWTContext;
