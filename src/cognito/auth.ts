import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';
import { getEnv } from '../utils/common';
import { isBeta } from '../utils/common';

export interface CogUser {
  auth_time: number;
  client_id: string;
  email: string;
  event_id: string;
  exp: number;
  first_name: string;
  iat: number;
  id: string;
  is_internal: boolean;
  is_org_admin: boolean;
  iss: string;
  jti: string;
  last_name: string;
  locale: string;
  org_id: string;
  origin_jti: string;
  scope: string;
  sub: string;
  token_use: string;
  username: string;
  version: number;
}

async function fetchData() {
  try {
    const response = await fetch(`${isBeta() ? '/beta' : ''}/apps/chrome/env.json`);
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.log(error);
  }
}

function getSearchParams(url: string): { [key: string]: string } {
  const searchString = new URL(url).search;
  const searchParams = new URLSearchParams(searchString);
  const searchParamsObject: { [key: string]: string } = {};
  for (const [key, value] of searchParams) {
    searchParamsObject[key] = value;
  }
  return searchParamsObject;
}

export async function getTokenWithAuthorizationCode() {
  const code = getSearchParams(window.location.href).code;
  const refreshToken = localStorage.getItem('REFRESH_TOKEN');

  const data = await fetchData();
  const dataConfig = getEnv() === 'frh' ? data.poolData?.prod : getEnv() === 'frhStage' ? data.poolData?.stage : null;
  const loginUrl = `${dataConfig?.ssoUrl}/login?client_id=${dataConfig?.ClientId}&response_type=code&scope=openid&redirect_uri=${dataConfig?.redirectUri}`;

  const redirectUri = dataConfig?.redirectUri;
  if (!code && !refreshToken) {
    window.location.href = loginUrl;
  }
  if (refreshToken) {
    try {
      const response = await fetch(`${dataConfig?.ssoUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=refresh_token&client_id=${dataConfig?.ClientId}&refresh_token=${localStorage.getItem('REFRESH_TOKEN')}`,
      });
      if (!response.ok) {
        window.location.href = loginUrl;
        throw new Error(`Request failed with status code ${response.status}`);
      }

      const tokens = await response.json();

      localStorage.setItem('ACCESS_TOKEN', tokens.access_token);
      return tokens.access_token;
    } catch (error) {
      console.error(error);
    }
  }
  try {
    const response = await fetch(`${dataConfig?.ssoUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=authorization_code&client_id=${dataConfig?.ClientId}&redirect_uri=${redirectUri}&code=${code}`,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status code ${response.status}`);
    }

    const tokens = await response.json();
    localStorage.setItem('REFRESH_TOKEN', tokens.refresh_token);
    localStorage.setItem('ACCESS_TOKEN', tokens.access_token);
    return tokens.access_token;
  } catch (error) {
    console.error(error);
  }
}

export async function getUser(): Promise<any> {
  const token = localStorage.getItem('ACCESS_TOKEN');

  const requestOptions = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await fetch('/api/identity/me', requestOptions);
    if (!response.ok) {
      throw new Error(`Request failed with status code: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getEntitlements() {
  const token = localStorage.getItem('ACCESS_TOKEN');

  const requestOptions = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await fetch('/api/entitlements/v1/services', requestOptions);
    if (!response.ok) {
      throw new Error(`Request failed with status code: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function createUser() {
  const userRes = await getUser();
  const entitlementRes = await getEntitlements();

  const user = {
    entitlements: entitlementRes,
    identity: {
      account_number: '1234',
      org_id: userRes.org_id,
      type: 'User',
      user: {
        username: userRes.username,
        email: userRes.email,
        first_name: userRes.first_name,
        last_name: userRes.last_name,
        is_active: userRes?.is_active || true,
        is_org_admin: userRes.is_org_admin,
        is_internal: userRes.is_internal,
        locale: userRes.locale,
      },
      internal: {
        org_id: userRes.org_id,
        account_id: userRes.id,
      },
    },
  };
  return user;
}

export async function login(username: string, password: string) {
  const data = await fetchData();
  return new Promise((resolve, reject) => {
    const authenticationData = {
      Username: username,
      Password: password,
    };
    const authenticationDetails = new AuthenticationDetails(authenticationData);
    const userPool = new CognitoUserPool(data.poolData.stage);
    const userData = {
      Username: username,
      Pool: userPool,
    };
    const cognitoUser = new CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        resolve(result);
      },
      onFailure: function (err) {
        reject(err);
      },
    });
  });
}

export async function cogLogout() {
  const data = await fetchData();
  const dataConfig = getEnv() === 'frh' ? data.poolData?.prod : getEnv() === 'frhStage' ? data.poolData?.stage : null;
  const loginUrl = `${dataConfig?.ssoUrl}/login?client_id=${dataConfig?.ClientId}&response_type=code&scope=openid&redirect_uri=${dataConfig?.redirectUri}`;
  localStorage.clear();
  window.location.href = loginUrl;
}
