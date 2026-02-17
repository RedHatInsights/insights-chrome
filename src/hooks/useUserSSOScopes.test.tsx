import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import useUserSSOScopes from './useUserSSOScopes';
import { Provider as JotaiProvider, useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { activeModuleAtom } from '../state/atoms/activeModuleAtom';
import { chromeModulesAtom } from '../state/atoms/chromeModuleAtom';
import { routeAuthScopeReadyAtom } from '../state/atoms/routeAuthScopeReady';
import shouldReAuthScopes from '../auth/shouldReAuthScopes';
import { ChromeLogin } from '../auth/ChromeAuthContext';

jest.mock('../auth/shouldReAuthScopes', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const HookHarness = ({
  login,
  reAuthWithScopes,
  silentReauthEnabled,
  activeModuleId,
}: {
  login: ChromeLogin;
  reAuthWithScopes: (...scopes: string[]) => Promise<void>;
  silentReauthEnabled: boolean;
  activeModuleId?: string;
}) => {
  useUserSSOScopes({ login, reAuthWithScopes, silentReauthEnabled });
  const readyMap = useAtomValue(routeAuthScopeReadyAtom);
  const ready = activeModuleId ? (readyMap[activeModuleId] ?? true) : true;
  return <div data-testid="ready">{String(ready)}</div>;
};

function renderWithAtoms(ui: React.ReactElement, atoms?: { activeModule?: string; modules?: any }) {
  const HydrateAtoms = ({ children }: { children: React.ReactNode }) => {
    const initialValues = atoms?.modules
      ? ([[chromeModulesAtom, atoms.modules] as const] as unknown as Parameters<typeof useHydrateAtoms>[0])
      : ([] as unknown as Parameters<typeof useHydrateAtoms>[0]);
    useHydrateAtoms(initialValues);
    return <>{children}</>;
  };
  const ActivateModule = ({ moduleId, children }: { moduleId?: string; children: React.ReactNode }) => {
    const setActive = useSetAtom(activeModuleAtom);
    useEffect(() => {
      if (moduleId) {
        setActive(moduleId);
      }
    }, [moduleId, setActive]);
    return <>{children}</>;
  };
  return render(
    <JotaiProvider>
      <HydrateAtoms>
        <ActivateModule moduleId={atoms?.activeModule}>{ui}</ActivateModule>
      </HydrateAtoms>
    </JotaiProvider>
  );
}

describe('useUserSSOScopes', () => {
  beforeEach(() => {
    (shouldReAuthScopes as jest.Mock).mockReset();
  });

  it('when silent reauth is enabled: calls reAuthWithScopes and sets routeAuthScopeReady true for that module', async () => {
    let resolveFn: () => void;
    const reAuthWithScopes = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFn = resolve;
        })
    );
    const login = jest.fn();

    renderWithAtoms(<HookHarness login={login} reAuthWithScopes={reAuthWithScopes} silentReauthEnabled={true} activeModuleId="foo" />, {
      activeModule: 'foo',
      modules: { foo: { config: { ssoScopes: ['a', 'b'] }, moduleConfig: { ssoScopes: ['a', 'b'] } } },
    });

    // reAuth should be initiated (with no args - scopes are in the closure)
    await waitFor(() => expect(reAuthWithScopes).toHaveBeenCalled());
    expect(reAuthWithScopes).toHaveBeenCalledWith();

    // resolve the re-auth promise
    resolveFn!();

    await waitFor(() => {
      expect(screen.getByTestId('ready').textContent).toBe('true');
    });

    expect(reAuthWithScopes).toHaveBeenCalledWith();
    expect(login).not.toHaveBeenCalled();
  });

  it('when silent reauth is enabled and no scopes required: does not call reAuthWithScopes', async () => {
    const reAuthWithScopes = jest.fn().mockResolvedValue(undefined);
    const login = jest.fn();
    renderWithAtoms(<HookHarness login={login} reAuthWithScopes={reAuthWithScopes} silentReauthEnabled={true} activeModuleId="foo" />, {
      activeModule: 'foo',
      modules: { foo: { config: { ssoScopes: [] } } },
    });

    expect(screen.getByTestId('ready').textContent).toBe('true');
    await new Promise((r) => setTimeout(r, 0));
    expect(reAuthWithScopes).not.toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
  });

  it('when silent reauth is disabled and should reauth: calls login with computed scopes', async () => {
    const reAuthWithScopes = jest.fn().mockResolvedValue(undefined);
    const login = jest.fn();
    (shouldReAuthScopes as jest.Mock).mockReturnValue([true, ['x', 'y']]);

    renderWithAtoms(<HookHarness login={login} reAuthWithScopes={reAuthWithScopes} silentReauthEnabled={false} activeModuleId="foo" />, {
      activeModule: 'foo',
      modules: { foo: { config: { ssoScopes: ['a'] } } },
    });

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith(['x', 'y']);
    });
    expect(reAuthWithScopes).not.toHaveBeenCalled();
    expect(screen.getByTestId('ready').textContent).toBe('true');
  });

  it('when silent reauth is disabled and should not reauth: does nothing', async () => {
    const reAuthWithScopes = jest.fn().mockResolvedValue(undefined);
    const login = jest.fn();
    (shouldReAuthScopes as jest.Mock).mockReturnValue([false, []]);

    renderWithAtoms(<HookHarness login={login} reAuthWithScopes={reAuthWithScopes} silentReauthEnabled={false} activeModuleId="foo" />, {
      activeModule: 'foo',
      modules: { foo: { config: { ssoScopes: ['a'] } } },
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(login).not.toHaveBeenCalled();
    expect(reAuthWithScopes).not.toHaveBeenCalled();
    expect(screen.getByTestId('ready').textContent).toBe('true');
  });
});
