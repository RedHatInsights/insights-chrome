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
]

pipeline {
    agent { label 'insights' }
    options {
        timestamps()
    }
    environment {
        PROJECT_NAME="insights-chrome"

        MASTER_BRANCH="master"
        MASTER_STABLE_BRANCH="master-stable"

        IMG_TAG=$(script: "git rev-parse --short=8 HEAD", stdout: true).trim()

    }

    stages {
        stage('Initial Setup') {
            steps {
                script {
                    env.ENV_TEST = DefineEnv(env.ghprbTargetBranch)

                    echo "environment: ${ENV_NAME}"
                    echo "Source branch: ${ghprbSourceBranch}"
                }
            }
        }

        stage('Parallel Stages') {
            parallel {
                stage('Unit Testing') {
                    environment {
                        TEST_CONT="${PROJECT_NAME}-unit-tests"
                    }
                    steps {
                        sh "echo 'ephemeral testing'"

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
                    steps {
                        sh "echo 'Lint'"

                        script {
                            withVault([configuration: configuration, vaultSecrets: secrets]) {
                                sh '''
                                ./ci/lint.sh
                                '''
                            }
                        }
                    }
                }

                // stage('Test E2E') {
                //     steps {
                //         script {
                //             withVault([configuration: configuration, vaultSecrets: secrets]) {
                //                 sh '''
                //                     echo "Running Cypress Tests
                //                 '''
                //             }
                //         }
                //     }
                // }

                stage('Build') {
                    steps {
                        script {
                            withVault([configuration: configuration, vaultSecrets: secrets]) {
                                sh '''
                                    ./ci/build.sh
                                '''
                            }
                        }
                    }
                }
            }
        }
    }
}

def DefineEnv(branch) {
    if (ghprbTargetBranch == 'main') {
        echo 'Setting environment to "stage-preview"'
        return env.ENV_NAME="stage-preview"
    } else if (ghprbTargetBranch == 'stable') {
        echo 'Setting environment to "stage-stable"'
        return env.ENV_NAME="stage-stable"
    }

    echo 'Git branch is not "master" or "master-stable"'
    return
}