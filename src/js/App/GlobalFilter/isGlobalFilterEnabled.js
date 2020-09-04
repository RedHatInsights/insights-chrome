export const EXCLUDED_PAGES = ['insights/registration', 'insights/remediations'];

/**
 * Checks if the chrome should render global filter component
 * @returns {boolean}
 */
const isGlobalFilterEnabled = () => {
    const { pathname } = location;
    if (!pathname.includes('insights')) {
        return false;
    }
    if (EXCLUDED_PAGES.some(page => pathname.includes(page))) {
        return false;
    }

    return window?.insights?.chrome?.isBeta() || Boolean(localStorage.getItem('chrome:experimental:global-filter'));
};

export default isGlobalFilterEnabled;
