import { useEffect, useMemo, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChromeLogin } from '../auth/ChromeAuthContext';
import { activeModuleAtom, activeModuleDefinitionReadAtom } from '../state/atoms/activeModuleAtom';
import shouldReAuthScopes from '../auth/shouldReAuthScopes';
import { routeAuthScopeReadyAtom } from '../state/atoms/routeAuthScopeReady';

type UseUserSSOScopesOptions = {
  login: ChromeLogin;
  reAuthWithScopes: (...scopes: string[]) => Promise<void>;
  silentReauthEnabled: boolean;
};

/**
 * Performs silent reauth and manages the routeAuthScopeReady flag lifecycle for a specific module.
 * reAuthWithScopes already has access to requiredScopes from its closure, so we don't pass them.
 */
const performSilentReauth = async (
  moduleScope: string,
  reAuthWithScopes: () => Promise<void>,
  setAuthScopeReadyMap: (update: (prev: Record<string, boolean>) => Record<string, boolean>) => void
) => {
  setAuthScopeReadyMap((prev) => ({ ...prev, [moduleScope]: false }));
  try {
    await reAuthWithScopes();
  } catch (error) {
    console.error('Silent reauth failed in useUserSSOScopes:', error);
  } finally {
    setAuthScopeReadyMap((prev) => ({ ...prev, [moduleScope]: true }));
  }
};

/**
 * Performs legacy reauth by triggering a login redirect if new scopes are needed
 */
const performLegacyReauth = (requiredScopes: string[], login: ChromeLogin) => {
  const [shouldReAuth, newScopes] = shouldReAuthScopes(requiredScopes);
  if (shouldReAuth) {
    login(newScopes);
  }
};

/**
 * Unifed SSO scopes hook. When silent reauth is enabled, it performs silent reauth and
 * sets the routeAuthScopeReady flag appropriately for the active module. When disabled,
 * it uses legacy behavior and triggers a login if new scopes are required.
 */
const useUserSSOScopes = ({ login, reAuthWithScopes, silentReauthEnabled }: UseUserSSOScopesOptions) => {
  const activeModuleScope = useAtomValue(activeModuleAtom);
  const activeModule = useAtomValue(activeModuleDefinitionReadAtom);
  const setAuthScopeReadyMap = useSetAtom(routeAuthScopeReadyAtom);

  // Compute required scopes and memoize to avoid unnecessary effect re-runs
  const requiredScopes = useMemo(
    () => activeModule?.config?.ssoScopes || activeModule?.moduleConfig?.ssoScopes || [],
    [activeModule?.config?.ssoScopes, activeModule?.moduleConfig?.ssoScopes]
  );

  // Use refs to avoid re-running effect when function references change
  // login and reAuthWithScopes come from OIDCSecured where they are recreated
  // on auth state updates. We keep them in refs so this effect doesn't re-run
  // on every auth change, only when scopes/mode/module change.
  const loginRef = useRef(login);
  const reAuthWithScopesRef = useRef(reAuthWithScopes);

  useEffect(() => {
    loginRef.current = login;
    reAuthWithScopesRef.current = reAuthWithScopes;
  });

  useEffect(() => {
    if (!activeModuleScope) {
      return;
    }

    if (requiredScopes.length <= 0) {
      setAuthScopeReadyMap((prev) => ({ ...prev, [activeModuleScope]: true }));
      return;
    }

    if (silentReauthEnabled) {
      void performSilentReauth(activeModuleScope, reAuthWithScopesRef.current, setAuthScopeReadyMap);
    } else {
      performLegacyReauth(requiredScopes, loginRef.current);
    }
  }, [silentReauthEnabled, requiredScopes, setAuthScopeReadyMap, activeModuleScope, activeModule?.fullProfile]);
};

export default useUserSSOScopes;
