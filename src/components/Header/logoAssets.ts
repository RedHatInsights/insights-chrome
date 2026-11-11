// Centralizes the masthead logo asset imports so both Logo.tsx and
// LightwellServicesLink.tsx resolve the same files, and so tests can mock
// a single plain module instead of the raw `.svg` imports. Every `.svg`
// import is routed to the same stub by the `moduleNameMapper` regex in
// jest.config.js, so per-asset `jest.mock()` overrides on the raw paths
// collide; mocking this module avoids that collision.
import rhLogoLight from '../../../static/images/logo.svg';
import rhLogoDark from '../../../static/images/logo-dark.svg';
import lightwellLogoLight from '../../../static/images/lightwell-logo.svg';
import lightwellLogoDark from '../../../static/images/lightwell-logo-dark.svg';

export { rhLogoLight, rhLogoDark, lightwellLogoLight, lightwellLogoDark };
