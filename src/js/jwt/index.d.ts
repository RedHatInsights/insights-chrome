import { ISimplePromise }   from './simulatedPromise';
import { Keycloak }         from './@types/keycloak';
import { INumberCache }     from './cacheUtils';

import {
    ILoginOptions,
    IToken,
    IInternalToken,
    IJwtUser,
    IKeycloakOptions,
    IState,
    IKeycloakInitOptions,
    IJwtOptions
} from './models';

declare namespace Jwt {
    export function isAuthenticated(): boolean;
    export function login(options?: ILoginOptions): Keycloak.KeycloakPromise<void, void>;
    export function logout(options?: ILoginOptions): void;
    export function register(options: any): void;
    export function hasRole(...roles: string[]): boolean;
    export function isInternal(): boolean;
    export function getRegisterUrl(): string;
    export function getLoginUrl(options?: ILoginOptions): string;
    export function getLogoutUrl(): string;
    export function getAccountUrl(): string;
    export function getToken(): IToken | IInternalToken;
    export function getStoredTokenValue(): string;
    export function getEncodedToken(): string;
    export function getUserInfo(): IJwtUser;
    export function updateToken(force?: boolean): ISimplePromise;
    export function cancelRefreshLoop(shouldStopTokenUpdates?: boolean);
    export function startRefreshLoop(): ISimplePromise;
    export function isTokenExpired(tte?: number);
    export function onInit(func: Function): void;
    export function onInitError(func: Function): void;
    export function onAuthRefreshError(func: Function): void;
    export function onAuthRefreshSuccess(func: Function): void;
    export function onAuthLogout(func: Function): void;
    export function onTokenExpired(func: Function): void;
    export function onInitialUpdateToken(func: Function): void;
    export function onTokenMismatch(func: Function): void;
    export function init(options: IJwtOptions): Keycloak.KeycloakPromise<boolean, Keycloak.KeycloakError>;
    export function enableDebugLogging();
    export function disableDebugLogging();
    export const _state: IState;
    export function failCountPassed(key: string, threshold: number): Promise<boolean>;
    export function getCountForKey(key: string): Promise<INumberCache>;
    export function expiresIn(): number;
    export function reinit();
}

export default Jwt;