def wrapStep(String stepName, Closure step) {
  println "In wrapStep ${stepName}"
  try {
    step(stepName)
  } catch (e) {
    notify('FAILED', stepName)
    throw e
  }
}

node('insights-frontend-slave') {
  if ('master' == env.BRANCH_NAME) {
    wrapStep('clone', { name -> stage(name) { checkout scm } })
    wrapStep('deploy_dashboard', { name -> stage(name) { sh 'rsync -arv -e "ssh -2" * sshacs@unprotected.upload.akamai.com:/114034/insights/platform/dashboard/' } })
  }
}

