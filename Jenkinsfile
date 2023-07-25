pipeline {
    agent { label 'insights' }
    options {
        timestamps()
    }

    environment {
        MASTER_BRANCH="master"
        MASTER_STABLE_BRANCH="master-stable"

        BASE_IMG="registry.access.redhat.com/ubi8/nodejs-16:1-111.1689167503"

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

        stage('Unit tests / Lint') {
            parallel {
                stage('Unit Testing') {
                    steps {
                        sh "echo 'ephemeral testing'"

                        script {
                            sh '''
                                npm i
                                npm run test -- --coverage
                            '''
                        }
                    }
                }

                stage('Lint') {
                    steps {
                        sh "echo 'Lint'"

                        script {
                            sh '''
                                npm i
                                npm run lint
                            '''
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

