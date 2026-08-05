const path = require('path');
const validateFrontendCrd = require('@redhat-cloud-services/frontend-components-config-utilities/feo/validate-frontend-crd').default;

const crdPath = path.resolve(__dirname, '../frontend.yml');

try {
  validateFrontendCrd(crdPath);
  console.log('Frontend CRD validation passed.');
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
