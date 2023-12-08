import { matchRoutes } from 'react-router-dom';
import { RouteDefinition } from '../@types/types';

function getInitialScope(routes: RouteDefinition[], pathname: string) {
  const initialModuleScope = matchRoutes(
    routes.map(({ path, ...rest }) => ({
      ...rest,
      path: `${path}/*`,
    })),
    // modules config does not include the preview fragment
    pathname.replace(/^\/(preview|beta)/, '')
  )?.[0]?.route?.scope;

  return initialModuleScope;
}

export default getInitialScope;
