pipeline {
    agent { label 'insights' }
    options {
        timestamps()
    }
    stages {
        stage('Initial Setup') {
            steps {
                script {
                    env.ENV_TEST = DefineEnv(env.ghprbTargetBranch)

                    echo "environment: ${ENV_NAME}"
                    echo "Source branch: ${ghprbSourceBranch}"

                    MASTER_BRANCH="master"
                    MASTER_STABLE_BRANCH="master-stable"
                }
            }
        }

        stage('Ephemeral Testing') {
            when {
                expression {
                    return (env.ghprbSourceBranch == env.MASTER_BRANCH || env.ghprbSourceBranch == env.MASTER_STABLE_BRANCH)
                }
            }
            steps {
                sh "echo 'ephemeral testing'"

                script {
                    echo "environment: ${ENV_NAME}"
                }
            }
        }

        stage('Regression Testing') {
            when {
                expression {
                    return (env.ghprbSourceBranch != env.MASTER_BRANCH || env.ghprbSourceBranch != env.MASTER_STABLE_BRANCH)
                }
            }
            steps {
                sh "echo 'regression testing'"
            }
        }

        stage('Build') {
            when {
                expression {
                    return (env.ghprbSourceBranch != env.MASTER_BRANCH || env.ghprbSourceBranch != env.MASTER_STABLE_BRANCH)
                }
            }
            steps {
                sh """
                    echo 'build'

                    #./deploy/build_deploy.sh
                """
            }
        }

        stage('Deploy to Environment') {
            when {
                expression {
                    return (env.ghprbSourceBranch != env.MASTER_BRANCH || env.ghprbSourceBranch != env.MASTER_STABLE_BRANCH)
                }
            }
            steps {
                sh "echo 'deploy'"
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
