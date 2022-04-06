const core = require('@actions/core');
const github = require('@actions/github');

try {
  core.setOutput("envs", process.env)
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  core.setOutput("payload", payload)
} catch (error) {
  core.setFailed(error.message)
}
