import getOrganization from './getOrganization';

const token = (claims: unknown) => `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;

describe('getOrganization', () => {
  it('uses the access token when the profile lacks organization data', () => {
    expect(getOrganization(undefined, token({ organization: { name: 'Insights QA', id: '11789772', account_number: '6089719' } }))).toEqual({
      name: 'Insights QA',
    });
  });

  it('preserves organization data from the profile', () => {
    const organization = { name: 'Profile Organization' };
    expect(getOrganization(organization, token({ organization: { name: 'Access Organization' } }))).toBe(organization);
  });

  it('falls back when the profile organization has no name', () => {
    expect(getOrganization({}, token({ organization: { name: 'Insights QA' } }))).toEqual({ name: 'Insights QA' });
  });

  it('falls back when the profile organization name is not a string', () => {
    expect(getOrganization({ name: 123 } as never, token({ organization: { name: 'Token Org' } }))).toEqual({ name: 'Token Org' });
  });

  it('preserves profile organization fields when adding the token name', () => {
    expect(getOrganization({ id: '42' } as never, token({ organization: { name: 'Token Org' } }))).toEqual({ id: '42', name: 'Token Org' });
  });

  it('rejects tokens without exactly three segments', () => {
    expect(getOrganization(undefined, 'header.payload')).toBeUndefined();
  });

  it('decodes Unicode organization names', () => {
    expect(getOrganization(undefined, token({ organization: { name: 'Societe 日本' } }))).toEqual({ name: 'Societe 日本' });
  });

  it.each([
    undefined,
    '',
    'opaque-token',
    'header.%%%.signature',
    token(null),
    token({}),
    token({ organization: null }),
    token({ organization: { name: 123 } }),
  ])('does not interrupt authentication for missing or malformed metadata (%s)', (accessToken) => {
    expect(getOrganization(undefined, accessToken)).toBeUndefined();
  });
});
