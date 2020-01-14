const functionBuilder = (key, value) => {
    window.localStorage && window.localStorage.setItem(key, value);
    return () => window.localStorage && window.localStorage.removeItem(key);
};

export default ({
    iqe: () => functionBuilder('iqe:chrome:init', true),
    remediationsDebug: () => functionBuilder('remediations:debug', true),
    invTags: () => functionBuilder('rhcs-tags', true),
    shortSession: () => functionBuilder('chrome:jwt:shortSession', true),
    jwtDebug: () => functionBuilder('chrome:jwt:debug', true),
    reduxDebug: () => functionBuilder('chrome:redux:debug', true),
    forcePendo: () => functionBuilder('forcePendo', true)
});
