import { ChromeUser } from '@redhat-cloud-services/types';

type Organization = ChromeUser['identity']['organization'];

const getOrganization = (profileOrganization: Organization, accessToken?: string): Organization => {
  if (typeof profileOrganization?.name === 'string') {
    return profileOrganization;
  }

  try {
    const segments = accessToken?.split('.');
    if (segments?.length !== 3) return profileOrganization;
    const payload = segments[1];

    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims: unknown = JSON.parse(decodeURIComponent(Array.from(decoded, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')));
    if (typeof claims !== 'object' || claims === null || !('organization' in claims)) return profileOrganization;

    const organization = claims.organization;
    // Read only display metadata from the authenticated session token, never authorization claims.
    if (typeof organization === 'object' && organization !== null && 'name' in organization && typeof organization.name === 'string') {
      return { ...profileOrganization, name: organization.name };
    }
  } catch {
    // Missing or malformed optional metadata must not interrupt authentication.
  }

  return profileOrganization;
};

export default getOrganization;
