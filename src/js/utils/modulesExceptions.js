const checkApproval = (moduleKey, chrome) =>
  chrome?.activeApp === 'approval' && chrome?.activeSection?.id === 'catalog' && moduleKey === chrome?.activeApp;

const checkManifests = (_moduleKey, chrome) => chrome?.activeApp === 'rhel' && window.location.pathname.includes('/insights/subscriptions/manifest');

const moduleRules = {
  approval: checkApproval,
  manifests: checkManifests,
};

/**
 * @deprecated
 * This is a hotfix required before the nav system rework
 * It fixes issues with sub apps being separate modules
 * Unfortunately there is no common pattern and we can easily generalize the rules witout breaking normal remoe module identification.
 * So we need special rule for each sub app
 */
function checkSubAppExceptionModule(moduleKey, chrome) {
  const fn = moduleRules[moduleKey];
  if (typeof fn === 'function') {
    return fn(moduleKey, chrome);
  }
  return false;
}

export default checkSubAppExceptionModule;
