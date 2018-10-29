import { Keycloak } from './@types/keycloak';

export interface IKeycloakOptions {
    realm: string;
    clientId: string;
    url?: string;
    credentials?: any;
    internalAuth?: boolean;
}

export interface IKeycloakInitOptions {
    responseMode?: 'query' | 'fragment';
    flow: 'standard' | 'implicit' | 'hybrid';
    token: ITokenResponse; // Or IToken, unsure
    refreshToken: string;
    adapter?: any; // appears to be string which is then set to an object
    checkLoginIframe?: any;
    checkLoginIframeInterval?: number;
    onLoad?: string;
    idToken?: string;
}

export interface IJwtOptions {
    keycloakOptions: Partial<IKeycloakOptions>;
    keycloakInitOptions?: Partial<IKeycloakInitOptions>;
    // If enabled disables updating the token automatically
    // It would now be the responsibility of the parent
    // app to do this.
    disablePolling?: boolean;
    reLoginIframeEnabled?: boolean;
    reLoginIframe?: any;
    disableBroadcastMessage?: boolean;
    generateJwtTokenCookie?: boolean;
}


export interface ILoginOptions {
    redirectUri?: string;
    skipRedirect?: boolean;
}

export interface IJwtUser {
    user_id: string; // keeping for legacy reasons in the CSP
    id: string;
    username: string;
    account_id: string;
    account_number: string;
    email: string;
    firstName: string;
    lastName: string;
    lang: string;
    region: string;
    login: string;
    internal: boolean;
}

export interface IToken {
    REDHAT_LOGIN: string; // "rhn-support-<name>"
    RHAT_LOGIN: string; // "rhn-support-<name>"
    account_id: string; // "<numbers>"
    account_number: string; // "<numbers>"
    acr: string; // "1"
    'allowed-origins': string[]; // ["*"]
    aud: string; // "customer-portal"
    auth_time: number; // 1501857720
    azp: string; // "customer-portal"
    client_session: string;
    country: string; // "US";
    email: string; // "<name>+qa@redhat.com<200b>"
    employeeId: string; // "rhn-support-<name>"
    exp: number; // 1501873015
    firstName: string; // "Samuel"
    iat: number; // 1501872715
    iss: string; // "https://sso.<env>.redhat.com/auth/realms/redhat-external"
    jti: string;
    lang: string; // "en_US"
    lastName: string;
    nbf: number; // 0
    nonce: string;
    organization_id: string;
    portal_id: string;
    realm_access: { roles: string[] };
    region: string; // "US"
    resource_access: {
        'realm-management': {
            'roles': string[]; // ["impersonation", "view-users"]
        }
    };
    session_state: string;
    siteID: string;
    siteId: string;
    sub: string; // "f:<hash>:rhn-support-<name>"
    typ: string; // "Bearer"
    user_id: string; // "4677944"
    username: string; // "rhn-support-<name>"
}

export interface IState {
    initialized: boolean;
    keycloak: Keycloak.KeycloakInstance;
}

export interface ITokenResponse {
    access_token: string;
    expires_in: number; // default 300
    id_token: string;
    'not-before-policy': number;
    refresh_expires_in: number; // default 36000
    refresh_token: string;
    session_state: string;
    token_type: string; // default 'bearer'
}

export interface IKeycloakCallback {
    state: string;
    nonce: string;
    redirectUri: string;
    expires: number; // 1505486922969
}

export interface ITokenUpdateFailure {
    status: number;
    statusText: string;
    url: string;
    date: string;
    minValidity: number;
    tokenExpired: boolean;
    expiresIn: number;
}

export interface IRealmAccess {
    roles: string[];
}

export interface IAccount {
    roles: string[];
}

export interface IResourceAccess {
    account: IAccount;
}

export interface IInternalToken {
    jti: string;
    exp: number;
    nbf: number;
    iat: number;
    iss: string;
    aud: string;
    sub: string;
    typ: string;
    azp: string;
    nonce: string;
    auth_time: number;
    session_state: string;
    acr: string;
    client_session?: string;
    'allowed-origins': string[];
    realm_access: IRealmAccess;
    resource_access: IResourceAccess;
    employeeType?: string;
    rhatGeo?: string;
    rhatJobTitle?: string;
    preferredTimeZone?: string;
    rhatUUID?: string;
    name: string;
    preferred_username: string;
    given_name: string;
    family_name: string;
    email: string;
}

export interface IBroadcastChannelPayload {
    type: string;
    clientId: string;
    authenticated: boolean;
}

export interface IBroadcastChannelPayloadEvent {
    data: IBroadcastChannelPayload;
    [key: string]: any; // For other properties in the event
}