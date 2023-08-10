def secrets = [
    [path: params.VAULT_PATH_SVC_ACCOUNT_EPHEMERAL, engineVersion: 1, secretValues: [
        [envVar: 'OC_LOGIN_TOKEN', vaultKey: 'oc-login-token'],
        [envVar: 'OC_LOGIN_SERVER', vaultKey: 'oc-login-server']]],
    [path: params.VAULT_PATH_SVC_ACCOUNT_EPHEMERAL, engineVersion: 1, secretValues: [
        [envVar: 'OC_LOGIN_TOKEN_DEV', vaultKey: 'oc-login-token-dev'],
        [envVar: 'OC_LOGIN_SERVER_DEV', vaultKey: 'oc-login-server-dev']]],
    [path: params.VAULT_PATH_QUAY_PUSH, engineVersion: 1, secretValues: [
        [envVar: 'QUAY_USER', vaultKey: 'user'],
        [envVar: 'QUAY_TOKEN', vaultKey: 'token']]],
    [path: params.VAULT_PATH_RHR_PULL, engineVersion: 1, secretValues: [
        [envVar: 'RH_REGISTRY_USER', vaultKey: 'user'],
        [envVar: 'RH_REGISTRY_TOKEN', vaultKey: 'token']]],
    [path: params.VAULT_PATH_CHROME_CYPRESS, engineVersion: 1, secretValues: [
        [envVar: 'CHROME_ACCOUNT', vaultKey: 'account'],
        [envVar: 'CHROME_PASSWORD', vaultKey: 'password']]],
]

def configuration = [vaultUrl: params.VAULT_ADDRESS, vaultCredentialId: params.VAULT_CREDS_ID, engineVersion: 1]

pipeline {
    agent none
    options {
        timestamps()
    }
    environment {
        PROJECT_NAME="insights-chrome"

        MASTER_BRANCH="master"
        MASTER_STABLE_BRANCH="master-stable"

        NODE_BASE_IMAGE="registry.access.redhat.com/ubi9/nodejs-18:1-53"
        CYPRESS_TEST_IMAGE="quay.io/cloudservices/cypress-e2e-image:06b70f3"

        CICD_URL="https://raw.githubusercontent.com/RedHatInsights/cicd-tools/main"
    }

    stages {
        stage('Tests/Build for Frontends') {
            parallel {
                stage('Unit Testing') {
                    agent { label 'insights' }
                    environment {
                            IMG_TAG=sh(script: "git rev-parse --short=8 HEAD", returnStdout: true).trim()
                            TEST_CONT="${PROJECT_NAME}-unit-tests-${IMG_TAG}"
                    }
                    steps {
                        script {
                            withVault([configuration: configuration, vaultSecrets: secrets]) {
                                sh '''
                                    ./ci/unit_tests.sh
                                '''
                            }
                        }
                    }
                }

                stage('Lint') {
                    agent { label 'insights' }
                    environment {
                        IMG_TAG=sh(script: "git rev-parse --short=8 HEAD", returnStdout: true).trim()
                        TEST_CONT="${PROJECT_NAME}-lint-${IMG_TAG}"
                    }
                    steps {
                        script {
                            withVault([configuration: configuration, vaultSecrets: secrets]) {
                                sh '''
                                    ./ci/lint.sh
                                '''
                            }
                        }
                    }
                }

                stage('Cypress Component Testing') {
                    agent { label 'insights' }
                    environment {
                        IMG_TAG=sh(script: "git rev-parse --short=8 HEAD", returnStdout: true).trim()
                        TEST_CONT="${PROJECT_NAME}-cypress-component-tests-${IMG_TAG}"
                    }
                    steps {
                        script {
                            withVault([configuration: configuration, vaultSecrets: secrets]) {
                                sh '''
                                    ./ci/cypress_component_tests.sh
                                '''
                            }
                        }
                    }
                }

                stage('Cypress E2E Tests') {
                    agent { label 'insights' }
                    environment {
                        IMG_TAG=sh(script: "git rev-parse --short=8 HEAD", returnStdout: true).trim()
                        TEST_CONT="${PROJECT_NAME}-cypress-e2e-tests-${IMG_TAG}"

                        COMPONENT="insights-chrome-frontend"
                        IMAGE="quay.io/cloudservices/${COMPONENT}"
                        INCLUDE_CHROME_CONFIG="true"
                    }
                    steps {
                        script {
                            withVault([configuration: configuration, vaultSecrets: secrets]) {
                                sh '''
                                    ./ci/cypress_e2e_tests.sh
                                '''
                            }
                        }
                    }
                }

                stage('IQE Tests') {
                    agent { label 'insights' }
                    environment {
                        IMG_TAG=sh(script: "git rev-parse --short=8 HEAD", returnStdout: true).trim()
                        TEST_CONT="${PROJECT_NAME}-cypress-e2e-tests-${IMG_TAG}"

                        // Deploy to an ephemeral namespace for testing
                        IMAGE="quay.io/cloudservices/rbac"
                        GIT_COMMIT="master"
                        IMAGE_TAG="latest"
                        DEPLOY_FRONTENDS=true
                        
                        // Run tests with ClowdJobInvocation
                        IQE_IMAGE_TAG="platform-ui"
                        IQE_PLUGINS="platform_ui"
                        IQE_MARKER_EXPRESSION="smoke"
                        // xclude progressive profile tests
                        // Exclude APIdocs tests
                        IQE_FILTER_EXPRESSION="not (test_progressive or test_apidocs)"
                        IQE_ENV="ephemeral"
                        IQE_SELENIUM="true"
                        IQE_CJI_TIMEOUT="30m"
                        DEPLOY_TIMEOUT="900"  // 15min

                        // Ensure that we deploy the right component for testing
                        APP_NAME="rbac"
                        COMPONENT="rbac"
                        COMPONENT_NAME="rbac"
                    }

                    steps {
                        script {
                            withVault([configuration: configuration, vaultSecrets: secrets]) {
                                sh '''
                                    ./ci/iqe_tests.sh
                                '''
                            }
                        }
                    }
                    post {
                        archiveArtifacts artifacts: 'artifacts/**/*', fingerprint: true
                        junit skipPublishingChecks: true, testResults: 'artifacts/junit-*.xml'
                    }
                }

                stage('Frontend Build') {
                    agent { label 'insights' }
                    environment {
                        COMMON_BUILDER="https://raw.githubusercontent.com/RedHatInsights/insights-frontend-builder-common/master"

                        COMPONENT="insights-chrome-frontend"
                        IMAGE="quay.io/cloudservices/${COMPONENT}"
                    }
                    steps {
                        withVault([configuration: configuration, vaultSecrets: secrets]) {
                            sh '''
                                ./ci/frontend-build.sh
                            '''
                        }
                    }
                }
            }
        }
    }
}
