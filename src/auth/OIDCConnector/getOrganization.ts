import { ChromeUser } from '@redhat-cloud-services/types';

type Organization = ChromeUser['identity']['organization'];

const getOrganization = (profileOrganization: Organization, accessToken?: string): Organization => {
  if (profileOrganization?.name) {
    return profileOrganization;
  }

  try {
    const payload = accessToken?.split('.')[1];
    if (!payload) return profileOrganization;

    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims: unknown = JSON.parse(decodeURIComponent(Array.from(decoded, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')));
    if (typeof claims !== 'object' || claims === null || !('organization' in claims)) return profileOrganization;

    const organization = claims.organization;
    // Read only display metadata from the authenticated session token, never authorization claims.
    if (typeof organization === 'object' && organization !== null && 'name' in organization && typeof organization.name === 'string') {
      return { name: organization.name };
    }
  } catch {
    // Missing or malformed optional metadata must not interrupt authentication.
  }

  return profileOrganization;
};

export default getOrganization;
