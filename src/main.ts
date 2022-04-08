import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
  try {
    const token =  core.getInput("gh_token", { required: true });
    const repo = process.env['GITHUB_REPOSITORY']
    const octokit = github.getOctokit(token)
    // Get the rev for the most recent tag
    const tags = await octokit.request(`GET /repos/${repo}/tags`)
  } catch (error) {

  }
}


run();
