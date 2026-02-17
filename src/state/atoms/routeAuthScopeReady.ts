import { atom } from 'jotai';

/**
 * Tracks auth scope readiness per module/route scope.
 * Key: module scope (e.g., 'insights', 'settings')
 * Value: boolean indicating if that module's scopes are ready
 *
 * NOTE: The default value for modules not in the map is determined by ChromeRoute based on:
 * - If silent reauth enabled AND module requires scopes: default to false (block until ready)
 * - Otherwise: default to true (render immediately)
 * This prevents race conditions where routes render before silent reauth completes.
 */
export const routeAuthScopeReadyAtom = atom<Record<string, boolean>>({});
